# Transit Stop Amenity Survey — Backend

Python backend that pulls frames from your **Rhombus** org (by camera + timestamp), runs a **Gemini** vision prompt to detect transit stop amenities, and writes JSON in the shape consumed by the [Transit Stop Dashboard](../) webapp.

## Setup

1. **Python 3.8+** and a virtual environment (recommended):

   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate   # Windows
   # source .venv/bin/activate   # macOS/Linux
   pip install -r requirements.txt
   ```

2. **API keys** (do not commit these):

   - **Rhombus:** Create an API token in your Rhombus org. Set:
     - `RHOMBUS_API_KEY` = your Rhombus API key
   - **Gemini:** Get an API key from [Google AI Studio](https://aistudio.google.com/). Set:
     - `GEMINI_API_KEY` = your Gemini API key

   Set them in your shell or in a `.env` file (add `backend/.env` to `.gitignore` if you use one). Example:

   ```bash
   set RHOMBUS_API_KEY=your_rhombus_key
   set GEMINI_API_KEY=your_gemini_key
   ```

3. **Stops and cameras:** Edit `stops_config.json`. Each stop must have:
   - `id`, `name`, `lat`, `lon`, `direction` (used in output and for the route polyline)
   - `cameraUuid`: the Rhombus camera UUID that views this stop (replace `YOUR_CAMERA_UUID` with the real UUID from Rhombus)
   - Optional: `timestampMs` — epoch milliseconds for the frame. If omitted, the script uses “now minus 5 minutes” to avoid Rhombus “time travel” errors.

   To find camera UUIDs: use the Rhombus console or API (e.g. list cameras) and copy the UUID for each camera that corresponds to a stop.

## Running the survey

From the `backend` directory:

```bash
python run_survey.py
```

Options:

- `--config PATH` — Path to a different stops config JSON (default: `stops_config.json` in this folder).
- `--quality high|medium|low|very_low` — Image quality for Rhombus frames (default: `medium`).
- `--sleep SECONDS` — Pause between Gemini API calls to reduce rate limits (default: 2).
- `--output PATH` — Output JSON file path (default: `output/stops_output.json`).

Example:

```bash
python run_survey.py --quality medium --sleep 3 --output output/stops_survey_20240211.json
```

## Output

The script writes a single JSON file containing:

- **stops** — Array of stop objects matching the webapp’s `Stop` type: `id`, `name`, `lat`, `lon`, `direction`, `lastSurveyed`, `status`, `amenities` (bench, shelter, lighting, bikeRack, trashCan, realtimeDisplay with `detected` and `confidence`), `imageUrl`.
- **routeCoordinates** — Polyline `[[lat, lon], ...]` in the same order as the stops.
- **recentActivity** — Last 7 survey events for the activity feed.

Default path: `backend/output/stops_output.json`.

## Ingesting into the webapp

- **Option A:** Copy the output file into the repo (e.g. `transit-stop-dashboard/data/stops_output.json`) and update the webapp’s data layer to import or load that JSON instead of the hardcoded mock data.
- **Option B:** Write output to a path under the webapp (e.g. `transit-stop-dashboard/public/data/stops.json`) and have the app fetch it at runtime (e.g. `/data/stops.json`).

The output schema is compatible with the dashboard’s types so you can plug it in when ready.
