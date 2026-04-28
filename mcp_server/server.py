"""CoderIQ MCP server — filesystem bridge for Claude Code.

Exposes two tools that let Claude Code read source files and write the
resulting analysis to disk. All analysis is performed by Claude Code
itself; this server no longer calls the Anthropic API.
"""

import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from mcp.server.fastmcp import FastMCP

PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANALYSIS_PATH = PROJECT_ROOT / "analysis.json"
LEARNING_PATH = PROJECT_ROOT / "learning.json"

sys.path.insert(0, str(PROJECT_ROOT))
from api_server.database import get_connection, init_db  # noqa: E402

init_db()

mcp = FastMCP("coderiq")

_latest_session_id: int | None = None
_latest_session_at: datetime | None = None
_LEARNING_SESSION_RECENCY = timedelta(minutes=5)


def _derive_title(filenames: list[str]) -> str:
    if not filenames:
        return f"Learning session — {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}"
    if len(filenames) == 1:
        return filenames[0]
    if len(filenames) == 2:
        return f"{filenames[0]} + {filenames[1]}"
    return f"{filenames[0]} + {len(filenames) - 1} more"


def _persist_analysis(data: dict) -> int:
    """Persist an analysis payload to the DB. Returns the new session_id."""
    global _latest_session_id, _latest_session_at

    files = data.get("files") or []
    filenames = [f.get("filename", "") for f in files]
    title = _derive_title(filenames)
    now = datetime.now(timezone.utc)

    conn = get_connection()
    try:
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO sessions (created_at, title, source_files) VALUES (?, ?, ?)",
            (now.isoformat(), title, json.dumps(filenames)),
        )
        session_id = cur.lastrowid

        concept_rows = []
        for f in files:
            filename = f.get("filename", "")
            for c in f.get("concepts") or []:
                concept_rows.append((
                    session_id,
                    filename,
                    c.get("name", ""),
                    c.get("category"),
                    c.get("difficulty"),
                    c.get("what"),
                    c.get("why"),
                    c.get("snippet"),
                ))
        if concept_rows:
            cur.executemany(
                "INSERT INTO concepts (session_id, filename, name, category, difficulty, what, why, snippet)"
                " VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                concept_rows,
            )
        conn.commit()
    finally:
        conn.close()

    _latest_session_id = session_id
    _latest_session_at = now
    return session_id


def _persist_learning(data: dict) -> int:
    """Persist learning content. Attaches to the latest session if recent, else creates one."""
    global _latest_session_id, _latest_session_at

    now = datetime.now(timezone.utc)
    conn = get_connection()
    try:
        cur = conn.cursor()

        if (
            _latest_session_id is not None
            and _latest_session_at is not None
            and now - _latest_session_at <= _LEARNING_SESSION_RECENCY
        ):
            session_id = _latest_session_id
        else:
            title = data.get("title") or f"Learning session — {now.strftime('%Y-%m-%d %H:%M UTC')}"
            cur.execute(
                "INSERT INTO sessions (created_at, title, source_files) VALUES (?, ?, ?)",
                (now.isoformat(), title, json.dumps([])),
            )
            session_id = cur.lastrowid
            _latest_session_id = session_id
            _latest_session_at = now

        flashcards = data.get("flashcards") or []
        quiz = data.get("quiz") or []
        fitb = data.get("fill_in_the_blank") or []

        if flashcards:
            cur.executemany(
                "INSERT INTO flashcards (session_id, front, back) VALUES (?, ?, ?)",
                [(session_id, f.get("front", ""), f.get("back", "")) for f in flashcards],
            )
        if quiz:
            cur.executemany(
                "INSERT INTO quiz_questions (session_id, question, snippet, choices, correct_index, explanation)"
                " VALUES (?, ?, ?, ?, ?, ?)",
                [
                    (
                        session_id,
                        q.get("question", ""),
                        q.get("snippet"),
                        json.dumps(q.get("choices") or []),
                        q.get("correct_index", 0),
                        q.get("explanation"),
                    )
                    for q in quiz
                ],
            )
        if fitb:
            cur.executemany(
                "INSERT INTO fill_in_the_blank (session_id, instruction, code, blanks, explanation)"
                " VALUES (?, ?, ?, ?, ?)",
                [
                    (
                        session_id,
                        f.get("instruction", ""),
                        f.get("code", ""),
                        json.dumps(f.get("blanks") or []),
                        f.get("explanation"),
                    )
                    for f in fitb
                ],
            )

        conn.commit()
    finally:
        conn.close()

    return session_id


@mcp.tool()
def read_files(file_paths: list[str]) -> str:
    """Read one or more source code files from disk and return their contents. Use this to load files before analyzing them with CoderIQ."""
    results = []
    for raw in file_paths:
        path = Path(raw).expanduser()
        absolute = str(path.resolve())
        entry = {"filename": path.name, "path": absolute}
        try:
            entry["content"] = Path(absolute).read_text(encoding="utf-8")
        except FileNotFoundError:
            entry["error"] = "File not found"
        except IsADirectoryError:
            entry["error"] = "Path is a directory, not a file"
        except PermissionError:
            entry["error"] = "Permission denied"
        except UnicodeDecodeError:
            entry["error"] = "File is not valid UTF-8"
        except OSError as e:
            entry["error"] = f"Read error: {e}"
        results.append(entry)
    return json.dumps(results, indent=2)


@mcp.tool()
def write_analysis(analysis: str) -> str:
    """Write a completed CoderIQ analysis to disk so the report UI updates. Call this after you have finished analyzing the files and have structured the results into the CoderIQ JSON format."""
    try:
        data = json.loads(analysis)
    except json.JSONDecodeError as e:
        return f"CoderIQ error: invalid JSON — {e}"

    if not isinstance(data, dict) or "files" not in data:
        return "CoderIQ error: analysis must be a JSON object containing a 'files' key."

    if not data.get("generated_at"):
        data["generated_at"] = datetime.now(timezone.utc).isoformat()

    try:
        ANALYSIS_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except OSError as e:
        return f"CoderIQ error: failed to write analysis.json — {e}"

    session_id = _persist_analysis(data)

    files = data.get("files") or []
    file_count = len(files)
    concept_count = sum(len(f.get("concepts") or []) for f in files)
    return (
        f"CoderIQ analysis written (session #{session_id}). {file_count} files, "
        f"{concept_count} concepts identified. "
        f"Report updated at localhost:5173."
    )


@mcp.tool()
def write_learning(learning: str) -> str:
    """Write flashcards and/or quiz questions to the CoderIQ learning center. Call this after generating learning content from a conversation or code analysis."""
    try:
        data = json.loads(learning)
    except json.JSONDecodeError as e:
        return f"CoderIQ error: invalid JSON — {e}"

    if not isinstance(data, dict):
        return "CoderIQ error: learning content must be a JSON object."

    if not any(k in data for k in ("flashcards", "quiz", "fill_in_the_blank")):
        return "Error: learning JSON must contain at least one of: flashcards, quiz, fill_in_the_blank"

    if not data.get("generated_at"):
        data["generated_at"] = datetime.now(timezone.utc).isoformat()
    if not data.get("source"):
        data["source"] = "cc-export"

    try:
        LEARNING_PATH.write_text(json.dumps(data, indent=2), encoding="utf-8")
    except OSError as e:
        return f"CoderIQ error: failed to write learning.json — {e}"

    session_id = _persist_learning(data)

    flashcard_count = len(data.get("flashcards") or [])
    quiz_count = len(data.get("quiz") or [])
    return (
        f"CoderIQ learning content written (session #{session_id}). "
        f"{flashcard_count} flashcards, {quiz_count} quiz questions ready at localhost:5173."
    )


if __name__ == "__main__":
    mcp.run()
