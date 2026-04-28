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
- what: A beginner-friendly explanation of what the concept IS and how it works mechanically. Go beyond a definition — explain what happens under the hood. 2-4 sentences.
- why: Why THIS specific code uses it, what problem it solves, and what the key line(s) are actually doing. Be specific to the code, not generic. 2-3 sentences.
- snippet: A short representative code snippet from the file showing the concept (3-10 lines)
- highlight_lines: An array of 1-based line numbers within the snippet that are the most important lines — the ones that directly implement or demonstrate the concept. Usually 1-3 lines. Example: [1] if the first line is the key one.

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
          "what": "A higher-order function takes other functions as arguments or returns a function. When called, it doesn't execute the inner logic immediately — it returns a new function that closes over the argument, deferring execution until the returned function is invoked.",
          "why": "requireAuth wraps any route handler with an auth check without modifying the handler itself. Line 1 accepts the handler as an argument; line 2 returns a new async function that runs the check first, then calls the original handler — keeping auth logic in one place.",
          "snippet": "const requireAuth = (handler) => {\n  return async (req, res) => {\n    return handler(req, res)\n  }\n}",
          "highlight_lines": [1]
        }
      ]
    }
  ],
  "global_summary": "One paragraph describing overall patterns and sophistication level across all files."
}

---

## Generating Learning Content

When a user asks to generate flashcards or quiz questions (from a conversation, code analysis, or any topic), use the `write_learning` tool with this JSON structure:

{
  "generated_at": "<ISO timestamp>",
  "title": "Short descriptive title for this learning set",
  "description": "One sentence describing what this content covers",
  "source": "cc-export",
  "flashcards": [
    {
      "front": "What is a higher-order function?",
      "back": "A function that takes other functions as arguments or returns a function as its result. Example: map(), filter(), reduce()."
    }
  ],
  "quiz": [
    {
      "question": "What will the following code output?",
      "snippet": "const double = x => x * 2\nconsole.log([1,2,3].map(double))",
      "choices": ["[1, 2, 3]", "[2, 4, 6]", "[double, double, double]", "undefined"],
      "correct_index": 1,
      "explanation": "map() applies the double function to each element, multiplying each by 2."
    }
  ],
  "fill_in_the_blank": [
    {
      "instruction": "Complete the higher-order function that wraps a route handler with auth checking",
      "code": "const requireAuth = (______) => {\n  return async (req, res) => {\n    if (!req.headers.______) {\n      return res.status(401).json({ error: 'Unauthorized' })\n    }\n    return ______(req, res)\n  }\n}",
      "blanks": ["handler", "authorization", "handler"],
      "explanation": "Higher-order functions take other functions as arguments. Here, handler is the function being wrapped."
    }
  ]
}

Guidelines:
- Generate at least 5 flashcards and 3 quiz questions unless the topic is very narrow
- Flashcard fronts should be concise questions or prompts
- Flashcard backs should be complete, clear answers with examples where helpful
- Quiz questions should test genuine understanding, not just memorization
- Quiz snippets are optional — only include when a code example genuinely helps the question
- Every quiz question must have exactly 4 choices
- correct_index is zero-based (0 = first choice)
- Explanations should teach, not just confirm the answer
- Generate 3-5 fill-in-the-blank exercises per analysis unless the topic is very narrow
- Blanks should target the most conceptually important tokens — function names, keywords, operators — not trivial punctuation
- Use exactly 6 underscores (______) for every blank regardless of the length of the answer
- The blanks array must list answers in the exact order they appear in the code string
- The instruction should name the concept being tested
- Snippets should be short enough to be readable — 5-12 lines maximum
