# CoderIQ

CoderIQ is a developer tool that scans source code files and generates a live interactive report in your browser, identifying the programming concepts, paradigms, and patterns present in your code.

## How It Works

1. Run `coderiq file1.js file2.py` from inside any project folder
2. CoderIQ analyzes your files using Claude AI
3. An interactive report opens automatically in your browser

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

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set your Anthropic API key
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 5. Register the MCP server with Claude Code
```bash
claude mcp add coderiq -- /path/to/coderiq/.venv/bin/python /path/to/coderiq/mcp_server/server.py
```

> Replace /path/to/coderiq with the absolute path to your coderiq project folder.
> Tip: run `pwd` from inside the coderiq directory to get the full path.

### 6. Start the React app
```bash
cd react_app && npm install && npm start
```

## Usage

From inside any project folder:
```bash
coderiq file1.js file2.py
```

Or from within a Claude Code conversation:
> "Analyze these files with CoderIQ: auth.js, utils.py"
