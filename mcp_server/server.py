"""CoderIQ MCP server — analyzes source code files using Claude."""

import json
from datetime import datetime, timezone
from pathlib import Path

import anthropic
from mcp.server.fastmcp import FastMCP

ANALYSIS_PATH = Path(__file__).resolve().parent.parent / "analysis.json"

SYSTEM_PROMPT = """You are CoderIQ, an expert programming educator and code analyst.

Your job is to analyze source code files and identify every programming concept, pattern, paradigm, and technique present.

For EACH file, identify ALL relevant concepts such as:
- Programming paradigms: functional programming, OOP, procedural, declarative, reactive
- Design patterns: singleton, factory, observer, decorator, strategy, MVC, etc.
- CS fundamentals: recursion, memoization, closures, higher-order functions, currying, composition
- OOP principles: polymorphism, inheritance, encapsulation, abstraction, interfaces
- Architectural patterns: dependency injection, event-driven, pub/sub, middleware
- Data structures: linked lists, trees, graphs, stacks, queues, hash maps
- Algorithms: sorting, searching, dynamic programming, divide and conquer, greedy
- Language features: generators, async/await, decorators, metaprogramming, reflection
- Code quality: SOLID principles, DRY, separation of concerns, pure functions, immutability

For each concept, provide:
1. The concept name
2. A clear beginner-friendly explanation of what it IS (1-2 sentences)
3. WHY this specific code is using it and what problem it solves (1-2 sentences)
4. A short representative code snippet from the file (3-10 lines showing the concept clearly)
5. Difficulty level: exactly one of "Beginner", "Intermediate", or "Advanced"
6. Category: exactly one of "Paradigm", "Pattern", "OOP", "Algorithm", "Data Structure", "Language Feature", "Architecture", or "Principle"

Respond ONLY with valid JSON. No markdown, no backticks, no explanation outside the JSON.

JSON structure:
{
  "generated_at": "<ISO timestamp>",
  "files": [
    {
      "filename": "example.py",
      "language": "Python",
      "summary": "One sentence describing what this file does",
      "concepts": [
        {
          "name": "Higher-Order Functions",
          "category": "Paradigm",
          "difficulty": "Intermediate",
          "what": "A higher-order function takes other functions as arguments or returns a function as its result.",
          "why": "Used here to abstract the transformation logic, making the code reusable without repetition.",
          "snippet": "def apply_twice(f, x):\\n    return f(f(x))\\n\\nresult = apply_twice(lambda x: x * 2, 3)"
        }
      ]
    }
  ],
  "global_summary": "One paragraph describing the overall patterns and sophistication level across all files"
}"""

mcp = FastMCP("coderiq")


@mcp.tool()
def analyze_files(file_paths: list[str]) -> str:
    """Analyze source code files and identify programming concepts, patterns, and paradigms.

    Reads each file, sends contents to Claude with a structured analysis prompt,
    writes the resulting JSON report to analysis.json at the project root, and
    returns a short success or error message.

    Args:
        file_paths: One or more absolute or relative paths to source files.

    Returns:
        A plain-text status message.
    """
    try:
        sections = []
        for path_str in file_paths:
            path = Path(path_str)
            header = f"=== FILE: {path.name} ==="
            try:
                contents = path.read_text(encoding="utf-8", errors="replace")
                sections.append(f"{header}\n{contents}")
            except Exception as e:
                sections.append(f"{header}\n[ERROR reading file: {e}]")

        user_message = "\n\n".join(sections)

        client = anthropic.Anthropic()
        response = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=8096,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_message}],
        )

        text = next((b.text for b in response.content if b.type == "text"), "").strip()

        # Strip optional ```json ... ``` fencing in case the model adds it.
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            if text.endswith("```"):
                text = text.rsplit("```", 1)[0]
            text = text.strip()

        analysis = json.loads(text)

        if not analysis.get("generated_at"):
            analysis["generated_at"] = datetime.now(timezone.utc).isoformat()

        ANALYSIS_PATH.write_text(json.dumps(analysis, indent=2), encoding="utf-8")

        files = analysis.get("files", [])
        total_concepts = sum(len(f.get("concepts", [])) for f in files)
        return (
            f"CoderIQ analysis complete. {len(files)} files analyzed, "
            f"{total_concepts} concepts identified. Report updated."
        )
    except json.JSONDecodeError as e:
        return f"CoderIQ error: Claude returned invalid JSON ({e}). Analysis not saved."
    except anthropic.APIError as e:
        return f"CoderIQ error: Claude API error: {e}"
    except Exception as e:
        return f"CoderIQ error: {type(e).__name__}: {e}"


if __name__ == "__main__":
    mcp.run()
