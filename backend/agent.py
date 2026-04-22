"""
Deck Design Agent
Translates client brief → createMultiLevelDeck params → Revit → screenshots
"""
import json
import math
import os
import uuid
from typing import Optional

import anthropic
from revit_client import call_revit
from family_catalog import get_entry, FAMILY_CATALOG

_client = anthropic.Anthropic()

# ── Family loading helpers ─────────────────────────────────────────────────────

# Base path to revit_family directory relative to this file (../../revit_family)
import pathlib
_REVIT_FAMILY_DIR = str(pathlib.Path(__file__).parent.parent.parent / "revit_family")

def _abs_rfa(relative_path: str) -> str:
    """Convert a relative revit_family path to absolute Windows path."""
    return str(pathlib.Path(_REVIT_FAMILY_DIR) / relative_path)

def _load_rfa_files(rfa_files: list) -> list:
    """Load a list of .rfa files into Revit. Returns list of family names loaded."""
    loaded = []
    for rel_path in rfa_files:
        abs_path = _abs_rfa(rel_path)
        result = call_revit("loadFamily", {"familyPath": abs_path})
        if result.get("success"):
            loaded.append(result.get("familyName", rel_path))
    return loaded

def _apply_decking_material(brief: dict, floor_element_ids: list) -> None:
    """Apply the selected decking material to all floor elements."""
    decking_entry = get_entry(brief.get("deckingId", "ipe_hardwood"))
    if not decking_entry or not decking_entry.get("revitMaterialName"):
        return
    mat_name = decking_entry["revitMaterialName"]
    mat_res = call_revit("getMaterialByName", {"name": mat_name})
    if not mat_res.get("success") or not mat_res.get("materialId"):
        return
    mat_id = mat_res["materialId"]
    for eid in floor_element_ids:
        call_revit("setElementMaterial", {"elementId": eid, "materialId": mat_id})

def _load_railing_families(brief: dict) -> str:
    """Load all railing component .rfa files and return the target railing type name."""
    railing_entry = get_entry(brief.get("railingId", ""))
    if not railing_entry or not railing_entry.get("rfaFiles"):
        return brief.get("railingType", "Guardrail - Pipe")
    _load_rfa_files(railing_entry["rfaFiles"])
    # Return the brand name as the Revit railing type to use
    return railing_entry["name"]

def _load_pergola_families(brief: dict) -> dict:
    """Load pergola component .rfa files. Returns component name map."""
    pergola_entry = get_entry(brief.get("pergolaId", "no_pergola"))
    if not pergola_entry or not pergola_entry.get("rfaFiles"):
        return {}
    _load_rfa_files(pergola_entry["rfaFiles"])
    return pergola_entry.get("revitComponents", {})

# ── Material resolution ────────────────────────────────────────────────────────

def _find_material(all_mats: list, keywords: list, exclude: list = None) -> Optional[str]:
    exclude = [e.lower() for e in (exclude or [])]
    for m in all_mats:
        name_l = m["name"].lower()
        if any(k.lower() in name_l for k in keywords):
            if not any(e in name_l for e in exclude):
                return m["name"]
    return None

def _resolve_materials(brief: dict, all_mats: list) -> dict:
    floor_pref = brief.get("floorMaterial", "").lower()
    wood_kw    = ["wood", "timber", "oak", "cedar", "ipe", "teak", "pine", "deck", "plank"]
    dark_kw    = ["walnut", "wenge", "dark", "charcoal", "black", "ebony", "rosewood"]
    concrete_kw = ["concrete", "cement", "masonry", "stone", "cmu"]

    # Try to match user preference, fall back to first wood
    if floor_pref:
        floor = _find_material(all_mats, [floor_pref]) or _find_material(all_mats, wood_kw) or "Oak Flooring"
    else:
        floor = _find_material(all_mats, wood_kw) or "Oak Flooring"

    column  = _find_material(all_mats, dark_kw + ["steel"], exclude=[floor]) or "Steel, Paint Finish, Dark Gray, Matte"
    concrete = _find_material(all_mats, concrete_kw) or "Concrete"
    metal   = _find_material(all_mats, ["steel", "iron", "metal"], exclude=[]) or column

    return {"floor": floor, "column": column, "concrete": concrete, "metal": metal}

# ── Geometry helpers ───────────────────────────────────────────────────────────

def _zone_to_pts(z: dict, total_w: float, total_d: float) -> list:
    x1 = z["x"] * total_w
    y1 = z["y"] * total_d
    x2 = (z["x"] + z["width"])  * total_w
    y2 = (z["y"] + z["height"]) * total_d
    return [[x1, y1, 0], [x2, y1, 0], [x2, y2, 0], [x1, y2, 0]]

def _connection_side(lz: dict, uz: dict) -> int:
    """Determine which side of the lower zone faces the upper zone (0=S,1=E,2=N,3=W)."""
    lx = lz["x"] + lz["width"]  / 2
    ly = lz["y"] + lz["height"] / 2
    ux = uz["x"] + uz["width"]  / 2
    uy = uz["y"] + uz["height"] / 2
    dx, dy = ux - lx, uy - ly
    if abs(dx) > abs(dy):
        return 1 if dx > 0 else 3
    return 2 if dy > 0 else 0

# ── Auto zone templates ────────────────────────────────────────────────────────

TEMPLATES = {
    "single": [
        {"label": "Main Deck", "x": 0.0, "y": 0.0, "width": 1.0, "height": 1.0, "elevation": 1.5},
    ],
    "split": [
        {"label": "Lower Deck", "x": 0.0, "y": 0.35, "width": 1.0, "height": 0.65, "elevation": 1.5},
        {"label": "Upper Deck", "x": 0.0, "y": 0.0,  "width": 0.55, "height": 0.35, "elevation": 3.5},
    ],
    "cascade": [
        {"label": "Lower Patio",  "x": 0.15, "y": 0.55, "width": 0.70, "height": 0.45, "elevation": 1.5},
        {"label": "Mid Deck",     "x": 0.0,  "y": 0.25, "width": 0.60, "height": 0.30, "elevation": 3.0},
        {"label": "Upper Outlook","x": 0.0,  "y": 0.0,  "width": 0.40, "height": 0.25, "elevation": 5.5},
    ],
    "firepit": [
        {"label": "Main Deck",  "x": 0.0,  "y": 0.25, "width": 0.60, "height": 0.75, "elevation": 1.5},
        {"label": "Fire Pit",   "x": 0.60, "y": 0.0,  "width": 0.40, "height": 0.55, "elevation": -4.0, "hasFirepit": True},
    ],
    "pergola_split": [
        {"label": "Pergola Deck","x": 0.20, "y": 0.0,  "width": 0.55, "height": 0.55, "elevation": 1.5, "hasPergola": True},
        {"label": "Upper Lounge","x": 0.0,  "y": 0.55, "width": 0.55, "height": 0.45, "elevation": 3.5},
        {"label": "Outlook",     "x": 0.0,  "y": 0.55, "width": 0.20, "height": 0.45, "elevation": 6.5},
    ],
    "full": [
        {"label": "Pergola Deck","x": 0.20, "y": 0.0,  "width": 0.50, "height": 0.50, "elevation": 1.5},
        {"label": "North Deck",  "x": 0.20, "y": 0.50, "width": 0.50, "height": 0.40, "elevation": 2.8},
        {"label": "Outlook",     "x": 0.0,  "y": 0.50, "width": 0.20, "height": 0.40, "elevation": 6.5},
        {"label": "Fire Pit",    "x": 0.70, "y": 0.0,  "width": 0.30, "height": 0.50, "elevation": -4.0, "hasFirepit": True},
    ],
}

# ── Parameter generation ───────────────────────────────────────────────────────

def generate_deck_params(brief: dict, level_id: int) -> dict:
    total_w = float(brief["bboxWidthFt"])
    total_d = float(brief["bboxDepthFt"])
    template = brief.get("template", "single")
    has_pergola = brief.get("hasPergola", False)
    stair_type  = brief.get("stairType", "cascading")
    railing_type = brief.get("railingType", "Guardrail - Pipe")

    # Fetch materials from Revit
    mats_res = call_revit("getAllMaterials", {})
    all_mats = mats_res.get("materials", []) if mats_res.get("success") else []
    mats = _resolve_materials(brief, all_mats)

    # Use provided zones or auto-generate from template
    zones = brief.get("zones") or []
    if not zones:
        base = TEMPLATES.get(template, TEMPLATES["single"])
        # Override with hasPergola/hasFirepit flags if template doesn't have them
        if brief.get("hasFirepit") and "firepit" not in template:
            template = "firepit"
            base = TEMPLATES["firepit"]
        zones = base

    # Sort by elevation so connections go low→high
    sorted_zones = sorted(zones, key=lambda z: z.get("elevation", 1.5))

    tiers = []
    for i, z in enumerate(sorted_zones):
        elev = z.get("elevation", 1.5)
        is_pit = elev < 0
        tier = {
            "points": _zone_to_pts(z, total_w, total_d),
            "elevation": elev,
            "materialName": mats["concrete"] if is_pit else mats["floor"],
        }
        if is_pit:
            tier["benchMaterialName"] = mats["floor"]
        tiers.append(tier)

    # Connections between adjacent tiers
    connections = []
    for i in range(len(sorted_zones) - 1):
        lz = sorted_zones[i]
        uz = sorted_zones[i + 1]
        elev_diff = uz.get("elevation", 0) - lz.get("elevation", 0)
        if elev_diff <= 0.1:
            continue
        is_pit = lz.get("elevation", 1.5) < 0
        conn = {
            "type": "standard" if is_pit or stair_type == "standard" else "cascading",
            "lowerTierIndex": i,
            "upperTierIndex": i + 1,
            "side": _connection_side(lz, uz),
            "width": 4.0 if is_pit else min(total_w * 0.30, 12.0),
            "hasRailing": not is_pit,
            "stairTypeName": "Monolithic",
        }
        if not is_pit:
            conn["railingTypeName"] = railing_type
        connections.append(conn)

    # Garden exit from lowest positive-elevation tier
    garden_exits = []
    pos_zones = [(i, z) for i, z in enumerate(sorted_zones) if z.get("elevation", 1.5) > 0]
    if pos_zones:
        idx, pz = pos_zones[0]
        garden_exits.append({
            "tierIndex": idx,
            "side": 0,
            "width": min(total_w * 0.40, 12.0),
            "treadDepth": 2.5,
        })

    params: dict = {
        "levelId": level_id,
        "tiers": tiers,
        "connections": connections,
        "gardenExits": garden_exits,
    }

    # Pergola
    pergola_zone = next(
        ((i, z) for i, z in enumerate(sorted_zones) if z.get("hasPergola") or has_pergola),
        None
    )
    if pergola_zone:
        pIdx, _ = pergola_zone
        params["pergola"] = {
            "tierIndex": pIdx,
            "canopyHeight": 10.0,
            "columnStyleKeyword": "Timber",
            "columnMaterialName": mats["column"],
            "columnSize": 1.5,
            "roofMaterialName": mats["metal"],
        }

    return params

# ── LLM refinement ─────────────────────────────────────────────────────────────

def refine_deck_params(current_params: dict, feedback: str, brief: dict) -> dict:
    prompt = f"""You are an expert deck architect AI. A client reviewed their Revit deck design and has feedback.

Client feedback: "{feedback}"

Current deck parameters:
{json.dumps(current_params, indent=2)}

Bounding box: {brief.get('bboxWidthFt', 30)}ft wide × {brief.get('bboxDepthFt', 25)}ft deep
Template: {brief.get('template', 'single')}

Modify the parameters to address the feedback. Keep all coordinates within the bounding box.
Return ONLY the modified JSON object with the same top-level structure (levelId, tiers, connections, gardenExits, optional pergola).

Common feedback mappings:
- "wider / bigger" → increase tier width/height values
- "higher elevation / more height" → increase elevation values
- "add pergola" → add pergola key
- "remove fire pit / remove pit" → remove that tier and its connections
- "more steps / wider stairs" → increase connection width
- "no railing / open steps" → set hasRailing to false
- "lower the pit" → make sunken tier elevation more negative"""

    response = _client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}]
    )
    text = response.content[0].text.strip()
    start = text.find("{")
    end   = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            return json.loads(text[start:end])
        except json.JSONDecodeError:
            pass
    return current_params

# ── Build + capture ────────────────────────────────────────────────────────────

def build_and_capture(params: dict, output_dir: str, brief: dict = None) -> list:
    """Call createMultiLevelDeck, apply catalog families/materials, capture screenshots."""
    os.makedirs(output_dir, exist_ok=True)
    shot_id = uuid.uuid4().hex[:8]
    brief = brief or {}

    # 1. Pre-load railing families into Revit
    resolved_railing_type = _load_railing_families(brief)
    # Inject resolved railing type name into all connections
    for conn in params.get("connections", []):
        if conn.get("hasRailing"):
            conn["railingTypeName"] = resolved_railing_type

    # 2. Pre-load pergola families
    _load_pergola_families(brief)

    # 3. Build the deck
    result = call_revit("createMultiLevelDeck", params)
    if not result.get("success"):
        raise RuntimeError(f"Deck build failed: {result.get('error', 'Unknown')}")

    # 4. Apply decking material to created floor elements
    floor_ids = result.get("floorIds") or result.get("createdElements") or []
    if brief.get("deckingId") and floor_ids:
        _apply_decking_material(brief, floor_ids)

    # Try to capture viewport - attempt multiple method names
    out_path = os.path.join(output_dir, f"{shot_id}_deck.png")
    paths = []

    for method, method_params in [
        ("captureViewport",   {"outputPath": out_path, "width": 1920, "height": 1080}),
        ("captureView3D",     {"outputPath": out_path}),
        ("exportView3DToImage", {"outputPath": out_path, "width": 1920, "height": 1080}),
    ]:
        cap = call_revit(method, method_params)
        saved = cap.get("outputPath") or cap.get("filePath") or (out_path if cap.get("success") else None)
        if saved and os.path.exists(saved):
            paths.append(saved)
            break

    return paths
