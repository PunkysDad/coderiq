# CoderIQ — Claude Code Instructions

When a user asks to analyze files with CoderIQ, follow these steps:

## Step 1 — Read the files
Use the `read_files` tool to load the requested files from disk.

## Step 2 — Analyze the code
For each file, identify ALL relevant programming concepts including:
- Programming paradigms: functional programming, OOP, procedural, declarative, reactive
- Design patterns: singleton, factory, observer, decorator, strategy, MVC, etc.
- CS fundamentals: recursion, memoization, closures, higher-order functions, currying, composition
- OOP principles: polymorphism, inheritance, encapsulation, abstraction, interfaces
- Architectural patterns: dependency injection, event-driven, pub/sub, middleware
- Data structures: linked lists, trees, graphs, stacks, queues, hash maps
- Algorithms: sorting, searching, dynamic programming, divide and conquer, greedy
- Language features: generators, async/await, decorators, metaprogramming, reflection
- Code quality: SOLID principles, DRY, separation of concerns, pure functions, immutability

For each concept provide:
- name: the concept name
- category: exactly one of "Paradigm", "Pattern", "OOP", "Algorithm", "Data Structure", "Language Feature", "Architecture", "Principle"
- difficulty: exactly one of "Beginner", "Intermediate", "Advanced"
- what: a beginner-friendly explanation of what the concept IS (1-2 sentences)
- why: why THIS code is using it and what problem it solves (1-2 sentences)
- snippet: a short representative code snippet from the file showing the concept (3-10 lines)

## Step 3 — Write the analysis
Use the `write_analysis` tool with the completed JSON in this exact structure:

{
  "generated_at": "<ISO timestamp>",
  "files": [
    {
      "filename": "example.js",
      "language": "JavaScript",
      "summary": "One sentence describing what this file does",
      "concepts": [
        {
          "name": "Higher-Order Functions",
          "category": "Paradigm",
          "difficulty": "Intermediate",
          "what": "A higher-order function takes other functions as arguments or returns a function as its result.",
          "why": "Used here to wrap route handlers with auth checks, keeping concerns separated.",
          "snippet": "const requireAuth = (handler) => {\n  return async (req, res) => {\n    return handler(req, res)\n  }\n}"
        }
      ]
    }
  ],
  "global_summary": "One paragraph describing overall patterns and sophistication level across all files."
}
