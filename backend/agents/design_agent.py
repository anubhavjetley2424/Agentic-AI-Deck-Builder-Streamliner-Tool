"""
Deck Design Agent — LangChain + Claude
Translates user deck configuration into Revit-ready parameters and Python scripts.
Uses LangChain tool-calling agent pattern.
"""
import json
import os
import uuid
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.tools import tool
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

from revit_client import call_revit


# ── LangChain Tools for Revit interaction ─────────────────────────────────────

@tool
def get_revit_materials() -> str:
    """Fetch all available materials from Revit."""
    result = call_revit("getAllMaterials", {})
    if result.get("success"):
        mats = result.get("materials", [])
        return json.dumps([m["name"] for m in mats[:50]])
    return json.dumps([])


@tool
def get_revit_levels() -> str:
    """Fetch all levels from the active Revit document."""
    result = call_revit("getLevels", {})
    if result.get("success"):
        return json.dumps(result.get("levels", []))
    return json.dumps([])


@tool
def get_stair_types() -> str:
    """Fetch available stair types from Revit."""
    result = call_revit("getStairTypes", {})
    if result.get("success"):
        return json.dumps(result.get("stairTypes", result.get("types", [])))
    return json.dumps(["Monolithic", "Cast-In-Place Concrete", "Precast Concrete"])


@tool
def get_railing_types() -> str:
    """Fetch available railing types from Revit."""
    result = call_revit("getRailingTypes", {})
    if result.get("success"):
        return json.dumps(result.get("railingTypes", result.get("types", [])))
    return json.dumps(["Guardrail - Pipe", "Guardrail - Glass Panel", "Handrail - Rectangular"])


@tool
def execute_revit_command(method: str, params_json: str) -> str:
    """Execute a Revit MCP command. method is the command name, params_json is a JSON string of parameters."""
    try:
        params = json.loads(params_json)
        result = call_revit(method, params)
        return json.dumps(result)
    except Exception as e:
        return json.dumps({"success": False, "error": str(e)})


# ── Agent setup ───────────────────────────────────────────────────────────────

SYSTEM_PROMPT = """You are an expert deck architect AI that generates precise Revit parameters for multi-level deck construction.

Given a user's deck configuration, you must produce a complete JSON parameter set for the createMultiLevelDeck Revit command.

The parameter schema:
{{
  "levelId": <int>,
  "tiers": [
    {{
      "points": [[x1,y1,0], [x2,y1,0], [x2,y2,0], [x1,y2,0]],
      "elevation": <float in feet>,
      "materialName": "<Revit material name>"
    }}
  ],
  "connections": [
    {{
      "type": "cascading" | "standard",
      "lowerTierIndex": <int>,
      "upperTierIndex": <int>,
      "side": <0=South, 1=East, 2=North, 3=West>,
      "width": <float in feet>,
      "hasRailing": <bool>,
      "stairTypeName": "<type>",
      "railingTypeName": "<type>"
    }}
  ],
  "gardenExits": [
    {{
      "tierIndex": <int>,
      "side": <0-3>,
      "width": <float>,
      "treadDepth": 2.5
    }}
  ],
  "pergola": {{  // optional
    "tierIndex": <int>,
    "canopyHeight": 10.0,
    "columnStyleKeyword": "Timber",
    "columnMaterialName": "<material>",
    "columnSize": 1.5,
    "roofMaterialName": "<material>"
  }}
}}

Rules:
- All coordinates are in FEET
- Tiers are sorted by elevation (lowest first)
- Connections go from lower to upper tier
- Points are counter-clockwise starting from bottom-left
- Ensure all tiers fit within the bounding box
- Negative elevation = sunken pit area
- Use realistic materials from Revit's library"""


def _build_agent():
    """Create the LangChain tool-calling agent for deck design."""
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=0,
        max_tokens=4096,
    )

    tools = [
        get_revit_materials,
        get_revit_levels,
        get_stair_types,
        get_railing_types,
        execute_revit_command,
    ]

    prompt = ChatPromptTemplate.from_messages([
        ("system", SYSTEM_PROMPT),
        MessagesPlaceholder(variable_name="chat_history", optional=True),
        ("human", "{input}"),
        MessagesPlaceholder(variable_name="agent_scratchpad"),
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=5)


# Cache the agent executor
_agent_executor = None

def _get_agent():
    global _agent_executor
    if _agent_executor is None:
        _agent_executor = _build_agent()
    return _agent_executor


def generate_deck_design(config: dict) -> dict:
    """
    Generate Revit deck parameters from the user's deck configuration.
    
    config should include:
    - property_width_m, property_depth_m
    - deck_area: {x_pct, y_pct, width_pct, height_pct}
    - deck_mode: 'single' | 'multi'
    - levels: [{name, elevation_ft}]
    - styles: {stairs, columns, railing, roof}
    - materials: {decking, railing, columns, roof}
    - zones: [{id, label, type, x, y, width, height, elevation}]
    """
    # Convert metres to feet for Revit
    prop_w_ft = config.get("property_width_m", 20) * 3.28084
    prop_d_ft = config.get("property_depth_m", 30) * 3.28084

    deck_area = config.get("deck_area", {"x_pct": 0, "y_pct": 0, "width_pct": 100, "height_pct": 100})
    deck_w_ft = prop_w_ft * deck_area.get("width_pct", 100) / 100
    deck_d_ft = prop_d_ft * deck_area.get("height_pct", 100) / 100
    deck_x_ft = prop_w_ft * deck_area.get("x_pct", 0) / 100
    deck_y_ft = prop_d_ft * deck_area.get("y_pct", 0) / 100

    levels = config.get("levels", [{"name": "Main Deck", "elevation_ft": 1.5}])
    styles = config.get("styles", {})
    materials = config.get("materials", {})
    zones = config.get("zones", [])

    input_text = f"""Generate createMultiLevelDeck parameters for this deck:

Deck bounding box: {deck_w_ft:.1f}ft wide × {deck_d_ft:.1f}ft deep
Deck offset from property origin: ({deck_x_ft:.1f}, {deck_y_ft:.1f}) ft
Mode: {config.get('deck_mode', 'single')}-level

Levels:
{json.dumps(levels, indent=2)}

Style preferences:
- Stairs: {styles.get('stairs', 'cascading')}
- Columns: {styles.get('columns', 'timber 90x90')}
- Railing: {styles.get('railing', 'Guardrail - Pipe')}
- Roof/Pergola: {styles.get('roof', 'none')}

Material preferences:
- Decking: {materials.get('decking', 'hardwood')}
- Railing: {materials.get('railing', 'steel')}
- Columns: {materials.get('columns', 'timber')}

{f'Zones: {json.dumps(zones, indent=2)}' if zones else 'No custom zones — auto-generate from levels.'}

First use get_revit_levels to get the base level ID, then get_revit_materials to find matching material names.
Then return the complete JSON parameters.
Return ONLY the final JSON object wrapped in ```json``` code fences."""

    try:
        agent = _get_agent()
        result = agent.invoke({"input": input_text})
        output = result.get("output", "")

        # Extract JSON from response
        if "```json" in output:
            start = output.index("```json") + 7
            end = output.index("```", start)
            return json.loads(output[start:end].strip())
        elif "{" in output:
            start = output.index("{")
            end = output.rindex("}") + 1
            return json.loads(output[start:end])
    except Exception as e:
        print(f"Agent error: {e}")

    # Fallback: generate params directly without agent
    return _fallback_generate(config, deck_w_ft, deck_d_ft, deck_x_ft, deck_y_ft, levels)


def _fallback_generate(config, deck_w_ft, deck_d_ft, deck_x_ft, deck_y_ft, levels):
    """Direct parameter generation when agent fails."""
    tiers = []
    for i, lvl in enumerate(levels):
        # Distribute levels across the deck area
        n = len(levels)
        tier_h = deck_d_ft / n
        y1 = deck_y_ft + i * tier_h
        y2 = y1 + tier_h
        tiers.append({
            "points": [
                [deck_x_ft, y1, 0],
                [deck_x_ft + deck_w_ft, y1, 0],
                [deck_x_ft + deck_w_ft, y2, 0],
                [deck_x_ft, y2, 0],
            ],
            "elevation": lvl.get("elevation_ft", 1.5 + i * 1.5),
            "materialName": "Oak Flooring",
        })

    connections = []
    for i in range(len(tiers) - 1):
        connections.append({
            "type": "cascading",
            "lowerTierIndex": i,
            "upperTierIndex": i + 1,
            "side": 2,
            "width": min(deck_w_ft * 0.3, 8.0),
            "hasRailing": True,
            "stairTypeName": "Monolithic",
            "railingTypeName": "Guardrail - Pipe",
        })

    params = {
        "levelId": 1,
        "tiers": tiers,
        "connections": connections,
        "gardenExits": [{
            "tierIndex": 0,
            "side": 0,
            "width": min(deck_w_ft * 0.4, 10.0),
            "treadDepth": 2.5,
        }],
    }

    if config.get("styles", {}).get("roof", "none") != "none":
        params["pergola"] = {
            "tierIndex": 0,
            "canopyHeight": 10.0,
            "columnStyleKeyword": "Timber",
            "columnMaterialName": "Steel, Paint Finish, Dark Gray, Matte",
            "columnSize": 1.5,
            "roofMaterialName": "Steel, Paint Finish, Dark Gray, Matte",
        }

    return params


def refine_deck_design(current_params: dict, feedback: str, config: dict) -> dict:
    """Refine existing deck parameters based on user feedback using LangChain."""
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=0,
        max_tokens=4096,
    )

    prompt = f"""You are an expert deck architect AI. A client reviewed their Revit deck design and has feedback.

Client feedback: "{feedback}"

Current deck parameters:
{json.dumps(current_params, indent=2)}

Modify the parameters to address the feedback. Keep all coordinates valid.
Return ONLY the modified JSON object with the same structure (levelId, tiers, connections, gardenExits, optional pergola)."""

    response = llm.invoke([HumanMessage(content=prompt)])
    text = response.content.strip()

    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return current_params
