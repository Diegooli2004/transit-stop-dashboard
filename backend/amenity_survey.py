# amenity_survey.py — Send one transit stop image to Gemini and parse amenity JSON

import base64
import json
import re
import time
import requests

from config import LLM_API_CONFIG

AMENITY_KEYS = ["bench", "shelter", "lighting", "bikeRack", "trashCan", "realtimeDisplay"]

GEMINI_PROMPT = """This image shows a transit bus or light rail stop. Analyze it and detect the following amenities.

For each amenity, report:
1. detected: true if the amenity is clearly visible, false otherwise.
2. confidence: a number between 0 and 1 (e.g. 0.85 for 85% confident).

Amenities to detect:
- bench: seating bench for waiting passengers
- shelter: shelter or canopy over the stop
- lighting: street light or stop lighting
- bikeRack: bicycle rack or bike parking
- trashCan: trash can or waste bin
- realtimeDisplay: real-time arrival display or sign

Respond with ONLY a JSON object, no other text. Use this exact structure:
{
  "bench": { "detected": true or false, "confidence": 0.0 to 1.0 },
  "shelter": { "detected": true or false, "confidence": 0.0 to 1.0 },
  "lighting": { "detected": true or false, "confidence": 0.0 to 1.0 },
  "bikeRack": { "detected": true or false, "confidence": 0.0 to 1.0 },
  "trashCan": { "detected": true or false, "confidence": 0.0 to 1.0 },
  "realtimeDisplay": { "detected": true or false, "confidence": 0.0 to 1.0 }
}
"""


def _default_amenities():
    """Return all amenities as not detected, 0 confidence."""
    return {k: {"detected": False, "confidence": 0.0} for k in AMENITY_KEYS}


def _normalize_amenities(raw):
    """Ensure all keys exist and have detected (bool) and confidence (float 0-1)."""
    out = _default_amenities()
    for key in AMENITY_KEYS:
        if key not in raw or not isinstance(raw[key], dict):
            continue
        v = raw[key]
        out[key] = {
            "detected": bool(v.get("detected", False)),
            "confidence": max(0.0, min(1.0, float(v.get("confidence", 0.0)))),
        }
    return out


def survey_image(image_path):
    """
    Run Gemini vision on one image and return amenity detection dict.

    Args:
        image_path: Path to a JPEG image file.

    Returns:
        Dict with keys bench, shelter, lighting, bikeRack, trashCan, realtimeDisplay;
        each value is { "detected": bool, "confidence": float }.
        On failure returns default (all false, 0 confidence).
    """
    with open(image_path, "rb") as f:
        encoded = base64.b64encode(f.read()).decode("utf-8")

    url = LLM_API_CONFIG["url_factory"]()
    api_key = LLM_API_CONFIG["api_key_factory"]()

    if not api_key:
        print("GEMINI_API_KEY not set")
        return _default_amenities()

    payload = {
        "contents": [
            {
                "role": "user",
                "parts": [
                    {"text": GEMINI_PROMPT},
                    {"inlineData": {"mimeType": "image/jpeg", "data": encoded}},
                ],
            }
        ],
        "generationConfig": {
            "temperature": 0.0,
            "responseMimeType": "application/json",
        },
    }
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }

    try:
        response = requests.post(url, headers=headers, json=payload, timeout=60)
    except Exception as e:
        print(f"Gemini request failed: {e}")
        return _default_amenities()

    if response.status_code == 429:
        print("Gemini rate limit (429); consider increasing sleep between calls.")
        return _default_amenities()

    if response.status_code != 200:
        print(f"Gemini API error: {response.status_code} - {response.text[:200]}")
        return _default_amenities()

    try:
        result = response.json()
        text = result["candidates"][0]["content"]["parts"][0]["text"]
    except (KeyError, IndexError, TypeError):
        print("Unexpected Gemini response structure")
        return _default_amenities()

    # Parse JSON (may be wrapped in markdown code block)
    json_match = re.search(r"\{[\s\S]*\}", text)
    if not json_match:
        print("No JSON object in Gemini response")
        return _default_amenities()

    try:
        raw = json.loads(json_match.group())
        return _normalize_amenities(raw)
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        return _default_amenities()
