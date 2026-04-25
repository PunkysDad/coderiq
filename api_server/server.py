"""CoderIQ API server — serves analysis.json to the React app."""

import json
from pathlib import Path

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

ANALYSIS_PATH = Path(__file__).resolve().parent.parent / "analysis.json"

app = FastAPI(title="CoderIQ API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/api/analysis")
def get_analysis():
    if not ANALYSIS_PATH.exists():
        return {"status": "empty"}

    try:
        data = json.loads(ANALYSIS_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {"status": "error", "message": "Invalid JSON in analysis.json"}

    if data == {} or data is None:
        return {"status": "empty"}

    return data


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
