"""CoderIQ API server — serves analysis.json and learning.json to the React app."""

import json
from datetime import datetime, timezone
from pathlib import Path

import uvicorn
from fastapi import FastAPI, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANALYSIS_PATH = PROJECT_ROOT / "analysis.json"
LEARNING_PATH = PROJECT_ROOT / "learning.json"

app = FastAPI(title="CoderIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _read_json(path: Path):
    """Return (data, error). data is None when error is non-None."""
    if not path.exists():
        return None, "missing"
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except json.JSONDecodeError:
        return None, "invalid"


def _is_empty(data) -> bool:
    return data is None or data == {} or data == []


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/analysis")
def get_analysis():
    data, err = _read_json(ANALYSIS_PATH)
    if err == "missing":
        return {"status": "empty"}
    if err == "invalid":
        return {"status": "error", "message": "Invalid JSON in analysis.json"}
    if _is_empty(data):
        return {"status": "empty"}
    return data


@app.get("/api/learning")
def get_learning():
    data, err = _read_json(LEARNING_PATH)
    if err == "missing":
        return {"status": "empty"}
    if err == "invalid":
        return {"status": "error", "message": "Invalid JSON in learning.json"}
    if _is_empty(data):
        return {"status": "empty"}
    if not any(k in data for k in ("flashcards", "quiz", "fill_in_the_blank")):
        return {"status": "empty"}
    return data


@app.post("/api/learning/upload")
async def upload_learning(file: UploadFile = File(...)):
    raw = await file.read()
    try:
        text = raw.decode("utf-8")
    except UnicodeDecodeError:
        return {"status": "error", "message": "Uploaded file is not valid UTF-8."}

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        return {"status": "error", "message": f"Invalid JSON: {e}"}

    if not isinstance(data, dict):
        return {
            "status": "error",
            "message": "Uploaded JSON must be an object at the top level.",
        }

    if not any(k in data for k in ("flashcards", "quiz", "fill_in_the_blank")):
        return {"status": "error", "message": "JSON must contain at least one of: flashcards, quiz, fill_in_the_blank"}

    if not data.get("generated_at"):
        data["generated_at"] = datetime.now(timezone.utc).isoformat()
    if not data.get("source"):
        data["source"] = "upload"

    LEARNING_PATH.write_text(
        json.dumps(data, indent=2), encoding="utf-8"
    )
    return {"status": "ok", "message": "Learning content uploaded successfully."}


@app.delete("/api/learning")
def clear_learning():
    LEARNING_PATH.write_text("{}\n", encoding="utf-8")
    return {"status": "ok", "message": "Learning content cleared."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
