# run_survey.py — CLI: for each stop get frame from Rhombus, run Gemini survey, write webapp-ready JSON

import argparse
import json
import os
import time
from datetime import datetime, timedelta

from config import (
    STOPS_CONFIG_PATH,
    OUTPUT_DIR,
    DEFAULT_QUALITY,
    STATUS_RECENT_DAYS,
    STATUS_NEEDS_UPDATE_DAYS,
)
from rhombus_client import get_frame
from amenity_survey import survey_image


def load_stops_config(path=None):
    path = path or STOPS_CONFIG_PATH
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def compute_status(last_surveyed_iso):
    """Return 'recent' | 'needs-update' | 'no-data' based on survey age."""
    if not last_surveyed_iso:
        return "no-data"
    try:
        dt = datetime.fromisoformat(last_surveyed_iso.replace("Z", "+00:00"))
        # If naive, treat as UTC
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.now().astimezone().tzinfo)
    except Exception:
        return "no-data"
    now = datetime.now(dt.tzinfo)
    age_days = (now - dt).total_seconds() / 86400
    if age_days <= STATUS_RECENT_DAYS:
        return "recent"
    if age_days <= STATUS_NEEDS_UPDATE_DAYS:
        return "needs-update"
    return "needs-update"


def run_survey(stops_config_path=None, quality=DEFAULT_QUALITY, sleep_seconds=2, output_path=None):
    """
    For each stop: get frame from Rhombus, run amenity survey, build stops + routeCoordinates.
    Writes JSON to output_path or backend/output/stops_output.json.
    """
    data = load_stops_config(stops_config_path)
    stops_config = data.get("stops", [])
    if not stops_config:
        print("No stops in config")
        return

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    if output_path is None:
        output_path = os.path.join(OUTPUT_DIR, "stops_output.json")

    survey_time = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    route_coordinates = [[s["lat"], s["lon"]] for s in stops_config]
    stops_out = []
    recent_activity = []

    for i, stop in enumerate(stops_config):
        stop_id = stop.get("id", "")
        name = stop.get("name", "")
        camera_uuid = stop.get("cameraUuid", "").strip()
        timestamp_ms = stop.get("timestampMs")

        if not camera_uuid or camera_uuid == "YOUR_CAMERA_UUID":
            print(f"[{stop_id}] Skipping: no cameraUuid set")
            stops_out.append({
                "id": stop_id,
                "name": name,
                "lat": stop["lat"],
                "lon": stop["lon"],
                "direction": stop.get("direction", "Outbound"),
                "lastSurveyed": "",
                "status": "no-data",
                "amenities": {
                    "bench": {"detected": False, "confidence": 0},
                    "shelter": {"detected": False, "confidence": 0},
                    "lighting": {"detected": False, "confidence": 0},
                    "bikeRack": {"detected": False, "confidence": 0},
                    "trashCan": {"detected": False, "confidence": 0},
                    "realtimeDisplay": {"detected": False, "confidence": 0},
                },
                "imageUrl": "",
            })
            continue

        print(f"[{stop_id}] Fetching frame...")
        frame_path = get_frame(camera_uuid, timestamp_ms=timestamp_ms, quality=quality)
        if not frame_path:
            print(f"[{stop_id}] No frame; using no-data")
            stops_out.append({
                "id": stop_id,
                "name": name,
                "lat": stop["lat"],
                "lon": stop["lon"],
                "direction": stop.get("direction", "Outbound"),
                "lastSurveyed": "",
                "status": "no-data",
                "amenities": {
                    "bench": {"detected": False, "confidence": 0},
                    "shelter": {"detected": False, "confidence": 0},
                    "lighting": {"detected": False, "confidence": 0},
                    "bikeRack": {"detected": False, "confidence": 0},
                    "trashCan": {"detected": False, "confidence": 0},
                    "realtimeDisplay": {"detected": False, "confidence": 0},
                },
                "imageUrl": "",
            })
            continue

        if sleep_seconds > 0:
            time.sleep(sleep_seconds)

        print(f"[{stop_id}] Running amenity survey...")
        amenities = survey_image(frame_path)
        detected_count = sum(1 for a in amenities.values() if a.get("detected"))

        stops_out.append({
            "id": stop_id,
            "name": name,
            "lat": stop["lat"],
            "lon": stop["lon"],
            "direction": stop.get("direction", "Outbound"),
            "lastSurveyed": survey_time,
            "status": compute_status(survey_time),
            "amenities": amenities,
            "imageUrl": f"/stops/{stop_id}.jpg",
        })

        recent_activity.append({
            "id": f"a{i+1}",
            "stopId": stop_id,
            "stopName": name,
            "timestamp": survey_time,
            "type": "survey",
            "description": f"Survey completed - {detected_count} amenities detected",
        })

    payload = {
        "stops": stops_out,
        "routeCoordinates": route_coordinates,
        "recentActivity": recent_activity[-7:],  # last 7
    }

    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    print(f"Wrote {len(stops_out)} stops to {output_path}")
    return output_path


def main():
    parser = argparse.ArgumentParser(description="Run transit stop amenity survey (Rhombus + Gemini)")
    parser.add_argument("--config", default=None, help="Path to stops_config.json")
    parser.add_argument("--quality", choices=["high", "medium", "low", "very_low"], default=DEFAULT_QUALITY)
    parser.add_argument("--sleep", type=float, default=2, help="Seconds between Gemini calls")
    parser.add_argument("--output", default=None, help="Output JSON path")
    args = parser.parse_args()

    run_survey(
        stops_config_path=args.config,
        quality=args.quality,
        sleep_seconds=args.sleep,
        output_path=args.output,
    )


if __name__ == "__main__":
    main()
