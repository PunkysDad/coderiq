"""CoderIQ API server — serves analysis.json and learning.json to the React app."""

import json
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

import uvicorn
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import get_connection, init_db

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANALYSIS_PATH = PROJECT_ROOT / "analysis.json"
LEARNING_PATH = PROJECT_ROOT / "learning.json"


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


app = FastAPI(title="CoderIQ API", lifespan=lifespan)

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
        raise HTTPException(status_code=500, detail="Invalid JSON in analysis.json")
    if _is_empty(data):
        return {"status": "empty"}
    return data


@app.get("/api/learning")
def get_learning():
    data, err = _read_json(LEARNING_PATH)
    if err == "missing":
        return {"status": "empty"}
    if err == "invalid":
        raise HTTPException(status_code=500, detail="Invalid JSON in learning.json")
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
        raise HTTPException(status_code=400, detail="Uploaded file is not valid UTF-8.")

    try:
        data = json.loads(text)
    except json.JSONDecodeError as e:
        raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    if not isinstance(data, dict):
        raise HTTPException(status_code=400, detail="Uploaded JSON must be an object at the top level.")

    if not any(k in data for k in ("flashcards", "quiz", "fill_in_the_blank")):
        raise HTTPException(
            status_code=400,
            detail="JSON must contain at least one of: flashcards, quiz, fill_in_the_blank",
        )

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


class SessionCreate(BaseModel):
    title: str
    source_files: list[str]


class ConceptIn(BaseModel):
    filename: str
    name: str
    category: Optional[str] = None
    difficulty: Optional[str] = None
    what: Optional[str] = None
    why: Optional[str] = None
    snippet: Optional[str] = None


class FlashcardIn(BaseModel):
    front: str
    back: str


class QuizQuestionIn(BaseModel):
    question: str
    snippet: Optional[str] = None
    choices: list[str]
    correct_index: int
    explanation: Optional[str] = None


class FillInTheBlankIn(BaseModel):
    instruction: str
    code: str
    blanks: list[Any]
    explanation: Optional[str] = None


class LearningBundle(BaseModel):
    flashcards: list[FlashcardIn] = []
    quiz: list[QuizQuestionIn] = []
    fill_in_the_blank: list[FillInTheBlankIn] = []


class AttemptIn(BaseModel):
    session_id: int
    question_id: int
    question_type: str
    was_correct: bool


class StudySessionCreate(BaseModel):
    content_types: list[str]


class StudySessionEnd(BaseModel):
    score: int
    total_questions: int


def _now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _session_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "created_at": row["created_at"],
        "title": row["title"],
        "source_files": json.loads(row["source_files"]),
    }


def _require_session(conn, session_id: int) -> None:
    if conn.execute("SELECT id FROM sessions WHERE id = ?", (session_id,)).fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")


@app.post("/api/sessions")
def create_session(payload: SessionCreate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO sessions (created_at, title, source_files) VALUES (?, ?, ?)",
        (_now(), payload.title, json.dumps(payload.source_files)),
    )
    session_id = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    return _session_to_dict(row)


@app.get("/api/sessions")
def list_sessions():
    conn = get_connection()
    rows = conn.execute("SELECT * FROM sessions ORDER BY created_at DESC").fetchall()
    conn.close()
    return [_session_to_dict(r) for r in rows]


@app.get("/api/sessions/{session_id}")
def get_session(session_id: int):
    conn = get_connection()
    row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")

    concepts = [dict(r) for r in conn.execute(
        "SELECT * FROM concepts WHERE session_id = ?", (session_id,)
    ).fetchall()]

    flashcards = [dict(r) for r in conn.execute(
        "SELECT * FROM flashcards WHERE session_id = ?", (session_id,)
    ).fetchall()]

    quiz_questions = []
    for r in conn.execute(
        "SELECT * FROM quiz_questions WHERE session_id = ?", (session_id,)
    ).fetchall():
        d = dict(r)
        d["choices"] = json.loads(d["choices"])
        quiz_questions.append(d)

    fill_in_the_blank = []
    for r in conn.execute(
        "SELECT * FROM fill_in_the_blank WHERE session_id = ?", (session_id,)
    ).fetchall():
        d = dict(r)
        d["blanks"] = json.loads(d["blanks"])
        fill_in_the_blank.append(d)

    conn.close()

    result = _session_to_dict(row)
    result["concepts"] = concepts
    result["flashcards"] = flashcards
    result["quiz_questions"] = quiz_questions
    result["fill_in_the_blank"] = fill_in_the_blank
    return result


@app.delete("/api/sessions/{session_id}")
def delete_session(session_id: int):
    conn = get_connection()
    _require_session(conn, session_id)
    cur = conn.cursor()
    for table in ("concepts", "flashcards", "quiz_questions", "fill_in_the_blank", "quiz_attempts"):
        cur.execute(f"DELETE FROM {table} WHERE session_id = ?", (session_id,))
    cur.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"status": "ok"}


@app.post("/api/sessions/{session_id}/concepts")
def add_concepts(session_id: int, concepts: list[ConceptIn]):
    conn = get_connection()
    _require_session(conn, session_id)
    cur = conn.cursor()
    cur.executemany(
        "INSERT INTO concepts (session_id, filename, name, category, difficulty, what, why, snippet)"
        " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
            (session_id, c.filename, c.name, c.category, c.difficulty, c.what, c.why, c.snippet)
            for c in concepts
        ],
    )
    conn.commit()
    conn.close()
    return {"status": "ok", "inserted": len(concepts)}


@app.post("/api/sessions/{session_id}/learning")
def add_learning(session_id: int, bundle: LearningBundle):
    conn = get_connection()
    _require_session(conn, session_id)
    cur = conn.cursor()
    cur.executemany(
        "INSERT INTO flashcards (session_id, front, back) VALUES (?, ?, ?)",
        [(session_id, f.front, f.back) for f in bundle.flashcards],
    )
    cur.executemany(
        "INSERT INTO quiz_questions (session_id, question, snippet, choices, correct_index, explanation)"
        " VALUES (?, ?, ?, ?, ?, ?)",
        [
            (session_id, q.question, q.snippet, json.dumps(q.choices), q.correct_index, q.explanation)
            for q in bundle.quiz
        ],
    )
    cur.executemany(
        "INSERT INTO fill_in_the_blank (session_id, instruction, code, blanks, explanation)"
        " VALUES (?, ?, ?, ?, ?)",
        [
            (session_id, f.instruction, f.code, json.dumps(f.blanks), f.explanation)
            for f in bundle.fill_in_the_blank
        ],
    )
    conn.commit()
    conn.close()
    return {
        "status": "ok",
        "inserted": {
            "flashcards": len(bundle.flashcards),
            "quiz": len(bundle.quiz),
            "fill_in_the_blank": len(bundle.fill_in_the_blank),
        },
    }


@app.post("/api/attempts")
def create_attempt(payload: AttemptIn):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO quiz_attempts (session_id, question_id, question_type, answered_at, was_correct)"
        " VALUES (?, ?, ?, ?, ?)",
        (
            payload.session_id,
            payload.question_id,
            payload.question_type,
            _now(),
            1 if payload.was_correct else 0,
        ),
    )
    attempt_id = cur.lastrowid
    conn.commit()
    row = conn.execute("SELECT * FROM quiz_attempts WHERE id = ?", (attempt_id,)).fetchone()
    conn.close()
    d = dict(row)
    d["was_correct"] = bool(d["was_correct"])
    return d


@app.get("/api/sessions/{session_id}/attempts")
def list_attempts(session_id: int):
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM quiz_attempts WHERE session_id = ? ORDER BY answered_at DESC",
        (session_id,),
    ).fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        d["was_correct"] = bool(d["was_correct"])
        out.append(d)
    return out


@app.get("/api/sessions/{session_id}/score")
def get_score(session_id: int):
    conn = get_connection()
    row = conn.execute(
        "SELECT COUNT(*) AS total, COALESCE(SUM(was_correct), 0) AS correct"
        " FROM quiz_attempts WHERE session_id = ?",
        (session_id,),
    ).fetchone()
    conn.close()
    total = row["total"]
    correct = row["correct"]
    incorrect = total - correct
    pct_correct = (correct / total * 100) if total > 0 else 0.0
    return {"total": total, "correct": correct, "incorrect": incorrect, "pct_correct": pct_correct}


@app.post("/api/study-sessions")
def create_study_session(payload: StudySessionCreate):
    conn = get_connection()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO study_sessions (started_at, content_types) VALUES (?, ?)",
        (_now(), json.dumps(payload.content_types)),
    )
    study_id = cur.lastrowid
    conn.commit()
    conn.close()
    return {"id": study_id}


@app.patch("/api/study-sessions/{study_id}/end")
def end_study_session(study_id: int, payload: StudySessionEnd):
    conn = get_connection()
    if conn.execute("SELECT id FROM study_sessions WHERE id = ?", (study_id,)).fetchone() is None:
        conn.close()
        raise HTTPException(status_code=404, detail="Study session not found")
    cur = conn.cursor()
    cur.execute(
        "UPDATE study_sessions SET ended_at = ?, score = ?, total_questions = ? WHERE id = ?",
        (_now(), payload.score, payload.total_questions, study_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM study_sessions WHERE id = ?", (study_id,)).fetchone()
    conn.close()
    d = dict(row)
    d["content_types"] = json.loads(d["content_types"])
    return d


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=4000)
