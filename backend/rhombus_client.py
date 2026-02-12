# rhombus_client.py — Fetch a single frame from Rhombus at a given timestamp

import os
import requests
from datetime import datetime, timedelta

from config import (
    API_CONFIG,
    IMAGE_QUALITY_OPTIONS,
    DEFAULT_QUALITY,
    OUTPUT_DIR,
)


def get_frame(camera_uuid, timestamp_ms=None, quality=DEFAULT_QUALITY, save_subdir="frames"):
    """
    Get a frame from the Rhombus camera at the given timestamp.

    Args:
        camera_uuid: Rhombus camera UUID.
        timestamp_ms: Epoch milliseconds. If None, uses now - 5 minutes to avoid time-travel errors.
        quality: One of high, medium, low, very_low.
        save_subdir: Subdirectory under OUTPUT_DIR to save the image.

    Returns:
        Path to saved image file, or None on failure.
    """
    if timestamp_ms is None:
        past = datetime.now() - timedelta(minutes=5)
        timestamp_ms = int(past.timestamp() * 1000)

    headers = API_CONFIG["headers_factory"]()
    payload = API_CONFIG["payload_defaults"].copy()
    payload["cameraUuid"] = camera_uuid
    payload["timestampMs"] = timestamp_ms

    if quality in IMAGE_QUALITY_OPTIONS:
        payload["downscaleFactor"] = IMAGE_QUALITY_OPTIONS[quality]["downscaleFactor"]
        payload["jpgQuality"] = IMAGE_QUALITY_OPTIONS[quality]["jpgQuality"]

    response = requests.post(
        API_CONFIG["url"],
        json=payload,
        headers=headers,
        timeout=30,
    )
    data = response.json()

    if data.get("error"):
        print(f"Rhombus API error: {data.get('error')}")
        return None

    frame_uri = data.get("frameUri")
    if not frame_uri:
        print("Rhombus response missing frameUri")
        return None

    image_response = requests.get(frame_uri, headers=headers, timeout=30)
    if image_response.status_code != 200:
        print(f"Frame download failed: {image_response.status_code}")
        return None

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    subdir = os.path.join(OUTPUT_DIR, save_subdir)
    os.makedirs(subdir, exist_ok=True)

    ts_dt = datetime.fromtimestamp(timestamp_ms / 1000)
    filename = f"stop_{ts_dt.strftime('%Y%m%d_%H%M%S')}.jpg"
    filepath = os.path.join(subdir, filename)
    with open(filepath, "wb") as f:
        f.write(image_response.content)

    return filepath
