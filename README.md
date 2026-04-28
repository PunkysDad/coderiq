# CoderIQ

CoderIQ scans source code files and generates a live interactive report in your browser — identifying the programming concepts, paradigms, and patterns present in your code and turning them into an interactive learning experience.

## What You Get

- **Report view** — every concept identified in your code (paradigms, patterns, algorithms, language features, and more), each with a plain-language explanation, syntax-highlighted snippet, and the key line highlighted
- **Learning Center** — auto-generated flashcards, multiple choice quiz, and fill-in-the-blank exercises based on the concepts in your code
- **Session history** — every analysis is saved locally; browse and reload any past session from the sidebar
- **Fully local** — no accounts, no cloud UI; your code only leaves your machine for the Claude API call

## How It Works

1. Start the CoderIQ servers with ./start.sh
2. From a Claude Code conversation, ask CoderIQ to analyze one or more files
3. The report appears instantly in your browser at http://localhost:5173
4. Ask Claude Code to generate learning content and it populates the Learning Center tab automatically

## Setup

### 1. Install Python 3.12+

```bash
brew install python@3.12  # macOS — or use your preferred method
```

### 2. Create and activate a virtual environment

```bash
python3.12 -m venv .venv
source .venv/bin/activate  # macOS/Linux
# .venv\Scripts\activate   # Windows
```

### 3. Install Python dependencies

```bash
pip install -r requirements.txt
```

### 4. Install React dependencies

```bash
cd react_app && npm install && cd ..
```

### 5. Set your Anthropic API key

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 6. Register the MCP server with Claude Code

```bash
claude mcp add coderiq -- /path/to/coderiq/.venv/bin/python /path/to/coderiq/mcp_server/server.py
```

Replace /path/to/coderiq with the absolute path to your coderiq project folder.
Run pwd from inside the coderiq directory to get the full path.

### 7. Start CoderIQ

```bash
./start.sh
```

This starts the API server on port 4000 and the React app on port 5173. Open http://localhost:5173 in your browser.

## Usage

With CoderIQ running, open a Claude Code conversation and ask:

> Analyze auth.js and utils.py with CoderIQ

CoderIQ will read the files, identify all programming concepts, and write the report to your browser automatically.

To generate learning content after an analysis:

> Generate flashcards and quiz questions for this analysis with CoderIQ

### Supported Languages

JavaScript, TypeScript, Python, Java, C, C++, C#, Go, Rust, Ruby, Swift, Kotlin, PHP, HTML, CSS, SCSS, JSX, TSX, Vue, Svelte, Bash, Zsh, PowerShell, Makefile, Dockerfile, Haskell, Elixir, Erlang, Clojure, Scala, F#, OCaml, Lua, R, Julia, SQL, GraphQL, and Jupyter notebooks.

## Architecture

| Layer | What it does |
|---|---|
| MCP server (`mcp_server/`) | Registered with Claude Code; reads files, writes analysis and learning content to disk and SQLite |
| API server (`api_server/`) | FastAPI server on port 4000; serves analysis data and manages the SQLite session database |
| React app (`react_app/`) | Vite + Tailwind app on port 5173; polls for new analysis, renders report and Learning Center |
| Database (`api_server/coderiq.db`) | Local SQLite database storing all sessions, concepts, flashcards, quiz questions, and attempt history |
