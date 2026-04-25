"""CoderIQ MCP server — filesystem bridge for Claude Code.

Exposes two tools that let Claude Code read source files and write the
resulting analysis to disk. All analysis is performed by Claude Code
itself; this server no longer calls the Anthropic API.
"""

import json
from datetime import datetime, timezone
from pathlib import Path

from mcp.server.fastmcp import FastMCP

ANALYSIS_PATH = Path(__file__).resolve().parent.parent / "analysis.json"

mcp = FastMCP("coderiq")


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

    files = data.get("files") or []
    file_count = len(files)
    concept_count = sum(len(f.get("concepts") or []) for f in files)
    return (
        f"CoderIQ analysis written. {file_count} files, "
        f"{concept_count} concepts identified. "
        f"Report updated at localhost:5173."
    )


if __name__ == "__main__":
    mcp.run()
