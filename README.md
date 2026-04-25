# CoderIQ

CoderIQ is a developer tool that scans source code files and generates a live interactive report in your browser, identifying the programming concepts, paradigms, and patterns present in your code.

## How It Works

1. Run `coderiq file1.js file2.py` from inside any project folder
2. CoderIQ analyzes your files using Claude AI
3. An interactive report opens automatically in your browser

## Setup

### 1. Install dependencies
```bash
pip install -r requirements.txt
```

### 2. Set your Anthropic API key
```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

### 3. Register the MCP server with Claude Code
```bash
claude mcp add coderiq -- python /path/to/coderiq/mcp_server/server.py
```

### 4. Start the React app
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
