"""
Floor Plan Analysis Agent — LangChain + Claude Vision
Extracts property dimensions, room layout, and suggests optimal deck placement
from an uploaded floor plan image.
"""
import base64
import json
import os
from pathlib import Path
from typing import Optional

from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field


class RoomDetection(BaseModel):
    name: str = Field(description="Room name (e.g. 'Kitchen', 'Patio', 'Garage')")
    x_pct: float = Field(description="X position as percentage of total width (0-100)")
    y_pct: float = Field(description="Y position as percentage of total depth (0-100)")
    width_pct: float = Field(description="Width as percentage of total width")
    height_pct: float = Field(description="Height as percentage of total depth")
    floor: str = Field(description="Which floor: 'ground' or 'first'")


class OutdoorSpace(BaseModel):
    name: str = Field(description="Name of the outdoor area")
    x_pct: float = Field(description="X position as percentage (0-100)")
    y_pct: float = Field(description="Y position as percentage (0-100)")
    width_pct: float = Field(description="Width as percentage")
    height_pct: float = Field(description="Height as percentage")
    suitable_for_deck: bool = Field(description="Whether this area is suitable for a deck")
    notes: str = Field(description="Notes about the space")


class DeckSuggestion(BaseModel):
    x_pct: float = Field(description="Suggested deck X position (0-100)")
    y_pct: float = Field(description="Suggested deck Y position (0-100)")
    width_pct: float = Field(description="Suggested deck width percentage")
    height_pct: float = Field(description="Suggested deck height percentage")
    reason: str = Field(description="Why this placement is recommended")


class FloorPlanAnalysis(BaseModel):
    property_width_m: float = Field(description="Total property width in metres")
    property_depth_m: float = Field(description="Total property depth in metres")
    house_width_m: float = Field(description="House footprint width in metres")
    house_depth_m: float = Field(description="House footprint depth in metres")
    rooms: list[RoomDetection] = Field(description="Detected rooms")
    outdoor_spaces: list[OutdoorSpace] = Field(description="Detected outdoor/garden areas")
    deck_suggestions: list[DeckSuggestion] = Field(description="Suggested deck placements, ranked best-first")
    notes: str = Field(description="General observations about the property")


ANALYSIS_PROMPT = """You are an expert architectural analyst specializing in outdoor deck design.
Analyze this floor plan image and extract detailed measurements and spatial information.

Look carefully at:
1. **Property dimensions** — find any measurements labeled on the plan (in metres or feet). If in feet, convert to metres.
2. **House footprint** — estimate the building's width and depth
3. **Room layout** — identify and locate all visible rooms with approximate positions
4. **Outdoor spaces** — identify gardens, patios, courtyards, pool areas, driveways
5. **Deck placement** — suggest the best locations for a deck based on:
   - Proximity to living areas (kitchen, dining, family room)
   - Access from indoor to outdoor
   - Available flat space
   - Sun exposure and privacy
   - Connection to existing patio/outdoor areas

CRITICAL: All positions must be expressed as percentages (0-100) of the total property dimensions.
The origin (0,0) is the top-left corner of the property boundary.

Return your analysis as JSON matching this exact schema:
{{
  "property_width_m": <number>,
  "property_depth_m": <number>,
  "house_width_m": <number>,
  "house_depth_m": <number>,
  "rooms": [
    {{"name": "<string>", "x_pct": <0-100>, "y_pct": <0-100>, "width_pct": <number>, "height_pct": <number>, "floor": "ground|first"}}
  ],
  "outdoor_spaces": [
    {{"name": "<string>", "x_pct": <0-100>, "y_pct": <0-100>, "width_pct": <number>, "height_pct": <number>, "suitable_for_deck": <bool>, "notes": "<string>"}}
  ],
  "deck_suggestions": [
    {{"x_pct": <0-100>, "y_pct": <0-100>, "width_pct": <number>, "height_pct": <number>, "reason": "<string>"}}
  ],
  "notes": "<string>"
}}

Return ONLY the JSON object, no markdown formatting or extra text."""


def _encode_image(image_path: str) -> tuple[str, str]:
    """Read and base64-encode an image file. Returns (base64_data, media_type)."""
    path = Path(image_path)
    suffix = path.suffix.lower()
    media_map = {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".gif": "image/gif",
        ".webp": "image/webp",
    }
    media_type = media_map.get(suffix, "image/jpeg")
    with open(path, "rb") as f:
        data = base64.b64encode(f.read()).decode("utf-8")
    return data, media_type


def analyze_floor_plan(image_path: str) -> dict:
    """
    Analyze a floor plan image using Claude Vision via LangChain.
    Returns a FloorPlanAnalysis dict.
    """
    llm = ChatAnthropic(
        model="claude-sonnet-4-20250514",
        temperature=0,
        max_tokens=4096,
    )

    image_data, media_type = _encode_image(image_path)

    message = HumanMessage(
        content=[
            {
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": media_type,
                    "data": image_data,
                },
            },
            {
                "type": "text",
                "text": ANALYSIS_PROMPT,
            },
        ]
    )

    response = llm.invoke([message])
    text = response.content.strip()

    # Parse JSON from response
    start = text.find("{")
    end = text.rfind("}") + 1
    if start >= 0 and end > start:
        try:
            result = json.loads(text[start:end])
            # Validate with pydantic
            analysis = FloorPlanAnalysis(**result)
            return analysis.model_dump()
        except (json.JSONDecodeError, Exception) as e:
            return {
                "error": f"Failed to parse analysis: {str(e)}",
                "raw": text,
                "property_width_m": 20.0,
                "property_depth_m": 30.0,
                "house_width_m": 15.0,
                "house_depth_m": 12.0,
                "rooms": [],
                "outdoor_spaces": [],
                "deck_suggestions": [
                    {
                        "x_pct": 50,
                        "y_pct": 20,
                        "width_pct": 40,
                        "height_pct": 30,
                        "reason": "Default suggestion — manual adjustment recommended",
                    }
                ],
                "notes": "Analysis parsing failed. Please verify measurements manually.",
            }

    return {
        "error": "No JSON found in response",
        "property_width_m": 20.0,
        "property_depth_m": 30.0,
        "house_width_m": 15.0,
        "house_depth_m": 12.0,
        "rooms": [],
        "outdoor_spaces": [],
        "deck_suggestions": [],
        "notes": "Could not parse the floor plan. Please enter measurements manually.",
    }
