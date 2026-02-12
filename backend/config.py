# config.py — Rhombus + Gemini + paths for transit stop amenity survey
# Secrets: set RHOMBUS_API_KEY and GEMINI_API_KEY in environment (or use .env / secrets.json)

import os

# Image quality settings (reuse EV pattern)
IMAGE_QUALITY_OPTIONS = {
    "high": {"downscaleFactor": 1, "jpgQuality": 90},
    "medium": {"downscaleFactor": 1, "jpgQuality": 75},
    "low": {"downscaleFactor": 3, "jpgQuality": 60},
    "very_low": {"downscaleFactor": 4, "jpgQuality": 40},
}

DEFAULT_QUALITY = "medium"

# Rhombus API — getExactFrameUri
# Payload cameraUuid is overridden per stop in rhombus_client
def _rhombus_headers():
    key = os.environ.get("RHOMBUS_API_KEY", "")
    return {
        "accept": "application/json",
        "x-auth-scheme": "api-token",
        "content-type": "application/json",
        "x-auth-apikey": key,
    }


def _rhombus_payload_defaults():
    q = IMAGE_QUALITY_OPTIONS[DEFAULT_QUALITY]
    return {
        "permyriadCropX": 0,
        "permyriadCropY": 0,
        "permyriadCropWidth": 10000,
        "permyriadCropHeight": 10000,
        "downscaleFactor": q["downscaleFactor"],
        "jpgQuality": q["jpgQuality"],
    }


API_CONFIG = {
    "url": "https://api2.rhombussystems.com/api/video/getExactFrameUri",
    "headers_factory": _rhombus_headers,
    "payload_defaults": _rhombus_payload_defaults,
}

# Gemini API
def _gemini_url():
    return "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"


def _gemini_api_key():
    return os.environ.get("GEMINI_API_KEY", "")


LLM_API_CONFIG = {
    "url_factory": _gemini_url,
    "api_key_factory": _gemini_api_key,
}

# Paths
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "output")
STOPS_CONFIG_PATH = os.path.join(os.path.dirname(__file__), "stops_config.json")

# Status thresholds (days)
STATUS_RECENT_DAYS = 7
STATUS_NEEDS_UPDATE_DAYS = 30
