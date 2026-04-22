"""
DeckForge — FastAPI Backend
"""
import os
import uuid
import json
from pathlib import Path
from typing import Optional, List

import httpx
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from revit_client import call_revit, is_revit_connected
from agent import generate_deck_params, refine_deck_params, build_and_capture, TEMPLATES
from family_catalog import FAMILY_CATALOG
from agents import analyze_floor_plan, generate_deck_design, refine_deck_design

# ── App setup ─────────────────────────────────────────────────────────────────

BASE_DIR        = Path(__file__).parent
SCREENSHOT_DIR  = BASE_DIR / "static" / "screenshots"
UPLOAD_DIR      = BASE_DIR / "static" / "uploads"
REVIT_FAMILY_DIR = BASE_DIR.parent.parent / "revit_family"   # ../../revit_family
TEXTURE_DIR     = REVIT_FAMILY_DIR / "textures"

SCREENSHOT_DIR.mkdir(parents=True, exist_ok=True)
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="DeckForge API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=str(BASE_DIR / "static")), name="static")
# Serve revit_family/textures at /static/textures if the directory exists
if TEXTURE_DIR.exists():
    app.mount("/static/textures", StaticFiles(directory=str(TEXTURE_DIR)), name="textures")

# In-memory session store (replace with Redis/DB for production)
sessions: dict = {}

# ── Models ─────────────────────────────────────────────────────────────────────

class GeocodeRequest(BaseModel):
    address: str

class Zone(BaseModel):
    id: str
    label: str
    x: float
    y: float
    width: float
    height: float
    elevation: float
    hasPergola: bool = False
    hasFirepit: bool = False

class DesignBrief(BaseModel):
    address: str
    bboxWidthFt: float
    bboxDepthFt: float
    template: str = "single"
    style: str = "modern"
    floorMaterial: str = ""
    railingType: str = "Guardrail - Pipe"
    columnType: str = ""
    stairType: str = "cascading"
    hasPergola: bool = False
    hasFirepit: bool = False
    zones: List[Zone] = []
    photoIds: List[str] = []
    # Catalog selections
    deckingId: str = "ipe_hardwood"
    railingId: str = "newtechwood_composite"
    pergolaId: str = "no_pergola"
    ceilingId: str = "open_ceiling"

class GenerateRequest(BaseModel):
    brief: DesignBrief

class RefineRequest(BaseModel):
    sessionId: str
    feedback: str

class DeckDesignConfig(BaseModel):
    property_width_m: float = 20.0
    property_depth_m: float = 30.0
    deck_area: dict = {"x_pct": 0, "y_pct": 0, "width_pct": 100, "height_pct": 100}
    deck_mode: str = "single"
    levels: list = []
    styles: dict = {}
    materials: dict = {}
    zones: list = []

class DeckDesignRequest(BaseModel):
    config: DeckDesignConfig

class DeckRefineRequest(BaseModel):
    sessionId: str
    feedback: str

# ── Helpers ────────────────────────────────────────────────────────────────────

def screenshots_to_urls(paths: list, base_url: str = "http://localhost:8000") -> list:
    urls = []
    for p in paths:
        filename = os.path.basename(p)
        urls.append(f"{base_url}/static/screenshots/{filename}")
    return urls

def get_level_id() -> int:
    result = call_revit("getLevels", {})
    if result.get("success") and result.get("levels"):
        levels = sorted(result["levels"], key=lambda l: l.get("elevation", 0))
        return levels[0].get("levelId") or levels[0].get("id") or 1
    return 1

# ── Routes ─────────────────────────────────────────────────────────────────────

@app.get("/api/catalog")
async def get_catalog():
    return {"catalog": FAMILY_CATALOG}

@app.get("/api/health")
async def health():
    revit_ok = is_revit_connected()
    return {"status": "ok", "revitConnected": revit_ok}

@app.post("/api/geocode")
async def geocode(req: GeocodeRequest):
    """Geocode an address using Nominatim (free, no API key required)."""
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": req.address, "format": "json", "limit": 1},
            headers={"User-Agent": "DeckForge/1.0"},
            timeout=10.0,
        )
    data = resp.json()
    if not data:
        raise HTTPException(status_code=404, detail="Address not found")
    result = data[0]
    return {
        "lat": float(result["lat"]),
        "lng": float(result["lon"]),
        "displayName": result["display_name"],
    }

@app.get("/api/revit/status")
async def revit_status():
    connected = is_revit_connected()
    level_id  = get_level_id() if connected else None
    return {"connected": connected, "levelId": level_id}

@app.get("/api/revit/materials")
async def get_materials():
    result = call_revit("getAllMaterials", {})
    if not result.get("success"):
        return {"materials": []}
    return {"materials": result.get("materials", [])}

@app.get("/api/revit/column-materials/{column_style}")
async def check_column_materials(column_style: str):
    """Check Revit material availability for a given column style via Revit MCP."""
    result = call_revit("getAllMaterials", {})
    if not result.get("success"):
        return {
            "revitConnected": False,
            "columnStyle": column_style,
            "materialCheck": {},
            "totalRevitMaterials": 0,
        }

    revit_materials = result.get("materials", [])
    revit_names = [m.get("name", "").lower() for m in revit_materials]

    material_keywords: dict[str, list[str]] = {
        "timber-natural": ["timber", "wood", "thermowood", "cedar", "hardwood", "pine", "oak", "redwood", "spotted gum", "merbau"],
        "steel-black":    ["steel", "metal", "powder coat", "black metal", "iron", "aluminium"],
        "rendered-concrete": ["concrete", "render", "cement", "masonry", "plaster"],
        "composite-panel":   ["composite", "panel", "fibre", "cladding", "compressed"],
    }

    # Recommended materials per column style
    style_recommended: dict[str, list[str]] = {
        "wood-timber":   ["timber-natural"],
        "metal-clad":    ["steel-black"],
        "doric":         ["rendered-concrete"],
        "chamfered":     ["timber-natural", "rendered-concrete"],
        "rectangular":   ["timber-natural", "rendered-concrete"],
        "round":         ["rendered-concrete", "steel-black"],
    }

    recommended_ids = style_recommended.get(column_style, [])
    material_check: dict[str, dict] = {}

    for mat_id, keywords in material_keywords.items():
        matching = [
            m.get("name") for m in revit_materials
            if any(kw in m.get("name", "").lower() for kw in keywords)
        ]
        material_check[mat_id] = {
            "available": bool(matching),
            "recommended": mat_id in recommended_ids,
            "matchingRevitMaterials": matching[:5],
        }

    return {
        "revitConnected": True,
        "columnStyle": column_style,
        "materialCheck": material_check,
        "totalRevitMaterials": len(revit_materials),
    }


@app.get("/api/revit/stair-types")
async def get_stair_types():
    result = call_revit("getStairTypes", {})
    if not result.get("success"):
        return {"types": ["Monolithic", "Cast-In-Place Concrete", "Precast Concrete"]}
    return {"types": result.get("stairTypes", result.get("types", []))}

@app.get("/api/revit/railing-types")
async def get_railing_types():
    result = call_revit("getRailingTypes", {})
    if not result.get("success"):
        return {"types": ["Guardrail - Pipe", "Guardrail - Glass Panel", "Handrail - Rectangular"]}
    return {"types": result.get("railingTypes", result.get("types", []))}

@app.get("/api/templates")
async def get_templates():
    return {
        "templates": [
            {"id": "single",         "name": "Single Level",      "tiers": 1, "description": "Clean flat deck — minimal and spacious"},
            {"id": "split",          "name": "Split Level",        "tiers": 2, "description": "Two connected levels with steps"},
            {"id": "cascade",        "name": "Cascade",            "tiers": 3, "description": "Three descending tiers — dramatic & sculptural"},
            {"id": "firepit",        "name": "Fire Pit Retreat",   "tiers": 2, "description": "Elevated deck + sunken fire pit area"},
            {"id": "pergola_split",  "name": "Pergola & Lounge",   "tiers": 3, "description": "Pergola-covered lower deck with upper lounge"},
            {"id": "full",           "name": "Full Estate",        "tiers": 4, "description": "Pergola, upper outlook, sunken fire pit — all in"},
        ]
    }

# ── Floor Plan Analysis (LangChain Vision Agent) ─────────────────────────────

@app.post("/api/floorplan/analyze")
async def analyze_floorplan(file: UploadFile = File(...)):
    """Upload a floor plan image and analyze it with Claude Vision via LangChain."""
    ext = Path(file.filename).suffix or ".jpg"
    file_id = uuid.uuid4().hex[:12] + ext
    file_path = UPLOAD_DIR / file_id
    with open(file_path, "wb") as out:
        out.write(await file.read())
    
    try:
        analysis = analyze_floor_plan(str(file_path))
        return {
            "success": True,
            "fileId": file_id,
            "fileUrl": f"/static/uploads/{file_id}",
            "analysis": analysis,
        }
    except Exception as e:
        return {
            "success": False,
            "fileId": file_id,
            "fileUrl": f"/static/uploads/{file_id}",
            "error": str(e),
            "analysis": {
                "property_width_m": 20.0,
                "property_depth_m": 30.0,
                "house_width_m": 15.0,
                "house_depth_m": 12.0,
                "rooms": [],
                "outdoor_spaces": [],
                "deck_suggestions": [],
                "notes": f"Analysis failed: {str(e)}. Enter measurements manually.",
            },
        }


# ── LangChain Design Agent ────────────────────────────────────────────────────

@app.post("/api/design/generate-v2")
async def generate_design_v2(req: DeckDesignRequest):
    """Generate deck design using LangChain agent."""
    config_dict = req.config.model_dump()
    
    try:
        params = generate_deck_design(config_dict)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Design agent error: {str(e)}")
    
    session_id = uuid.uuid4().hex
    sessions[session_id] = {"params": params, "config": config_dict, "iteration": 1}
    
    # If Revit is connected, build and capture screenshots
    screenshot_urls = []
    if is_revit_connected():
        try:
            from agent import build_and_capture
            # Convert config to brief format for build_and_capture
            brief = {
                "bboxWidthFt": config_dict["property_width_m"] * 3.28084,
                "bboxDepthFt": config_dict["property_depth_m"] * 3.28084,
                "deckingId": config_dict.get("materials", {}).get("decking", "ipe_hardwood"),
                "railingId": config_dict.get("materials", {}).get("railing", ""),
                "pergolaId": config_dict.get("materials", {}).get("pergola", "no_pergola"),
            }
            paths = build_and_capture(params, str(SCREENSHOT_DIR), brief)
            screenshot_urls = screenshots_to_urls(paths)
        except Exception as e:
            print(f"Build/capture error: {e}")
    
    return {
        "sessionId": session_id,
        "params": params,
        "screenshotUrls": screenshot_urls,
        "summary": _summarise(params, config_dict),
        "iteration": 1,
    }


@app.post("/api/design/refine-v2")
async def refine_design_v2(req: DeckRefineRequest):
    """Refine design using LangChain agent."""
    session = sessions.get(req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    refined = refine_deck_design(
        session["params"], req.feedback, session.get("config", {})
    )
    
    session["params"] = refined
    session["iteration"] = session.get("iteration", 1) + 1
    
    screenshot_urls = []
    if is_revit_connected():
        try:
            config = session.get("config", {})
            brief = {
                "bboxWidthFt": config.get("property_width_m", 20) * 3.28084,
                "bboxDepthFt": config.get("property_depth_m", 30) * 3.28084,
            }
            paths = build_and_capture(refined, str(SCREENSHOT_DIR), brief)
            screenshot_urls = screenshots_to_urls(paths)
        except Exception as e:
            print(f"Build/capture error: {e}")
    
    return {
        "sessionId": req.sessionId,
        "params": refined,
        "screenshotUrls": screenshot_urls,
        "summary": _summarise(refined, session.get("config", {})),
        "iteration": session["iteration"],
    }


@app.post("/api/photos/upload")
async def upload_photos(files: List[UploadFile] = File(...)):
    ids = []
    for f in files:
        ext = Path(f.filename).suffix or ".jpg"
        photo_id = uuid.uuid4().hex[:12] + ext
        path = UPLOAD_DIR / photo_id
        with open(path, "wb") as out:
            out.write(await f.read())
        ids.append(photo_id)
    return {"photoIds": ids}

@app.post("/api/design/generate")
async def generate_design(req: GenerateRequest):
    brief_dict = req.brief.model_dump()

    # Ensure Revit is connected
    if not is_revit_connected():
        raise HTTPException(status_code=503, detail="Revit is not connected. Start Revit with RevitMCPBridge2026 add-in.")

    level_id = get_level_id()

    # Generate params and build
    params = generate_deck_params(brief_dict, level_id)
    paths  = build_and_capture(params, str(SCREENSHOT_DIR), brief_dict)

    session_id = uuid.uuid4().hex
    sessions[session_id] = {"params": params, "brief": brief_dict, "iteration": 1}

    return {
        "sessionId": session_id,
        "screenshotUrls": screenshots_to_urls(paths),
        "summary": _summarise(params, brief_dict),
        "iteration": 1,
    }

@app.post("/api/design/refine")
async def refine_design(req: RefineRequest):
    session = sessions.get(req.sessionId)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not is_revit_connected():
        raise HTTPException(status_code=503, detail="Revit not connected")

    # Refine params using LLM
    refined = refine_deck_params(session["params"], req.feedback, session["brief"])

    # Clear existing deck elements and rebuild
    for cat in ["Floors", "Structural Columns", "Railings", "Roofs", "Stairs", "Walls"]:
        r = call_revit("getElements", {"category": cat})
        if r.get("success"):
            ids = [el["id"] for el in r.get("result", {}).get("elements", [])]
            if ids:
                call_revit("deleteElements", {"elementIds": ids})

    paths = build_and_capture(refined, str(SCREENSHOT_DIR), session["brief"])
    session["params"]    = refined
    session["iteration"] = session.get("iteration", 1) + 1

    return {
        "sessionId": req.sessionId,
        "screenshotUrls": screenshots_to_urls(paths),
        "summary": _summarise(refined, session["brief"]),
        "iteration": session["iteration"],
    }

def _summarise(params: dict, brief: dict) -> str:
    tier_count = len(params.get("tiers", []))
    conn_count = len(params.get("connections", []))
    has_pergola = "pergola" in params
    pit_tiers   = sum(1 for t in params.get("tiers", []) if t.get("elevation", 0) < 0)
    parts = [f"{tier_count}-tier deck"]
    if conn_count:
        parts.append(f"{conn_count} stair connection{'s' if conn_count > 1 else ''}")
    if pit_tiers:
        parts.append(f"{pit_tiers} sunken fire pit area")
    if has_pergola:
        parts.append("pergola")
    return "Built: " + ", ".join(parts) + f" | {brief.get('bboxWidthFt', 0):.0f}′ × {brief.get('bboxDepthFt', 0):.0f}′"
