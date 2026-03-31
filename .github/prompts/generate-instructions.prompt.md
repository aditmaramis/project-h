---
description: 'Generate a concise .instructions/*.md file documenting a layer of architecture or coding standards, and update AGENTS.md to reference it.'
agent: 'Instructions Generator'
argument-hint: "Architecture layer or coding standard details to document (optionally include a filename like 'my-file.md')"
---

You are generating a concise `.instructions/*.md` file for the Hibah project.

## Input

The user will provide:

- Information about an architecture layer, coding standard, or development pattern to document
- Optionally, a `.md` filename to use (e.g., `api-routes.md`)

If no information is provided, ask the user:

1. What layer of architecture or coding standard should be documented?
2. What specific patterns, rules, or conventions apply?
3. Is there a preferred filename?

## Steps

1. **Determine filename**: Use the provided filename, or derive a kebab-case name from the topic (e.g., `auth-patterns.md`, `database-access.md`).
2. **Review existing context**: Read [AGENTS.md](../../AGENTS.md) and any existing files in `/.instructions/` to avoid duplication and stay consistent with project conventions.
3. **Generate the instructions file**: Create the file at `/.instructions/<filename>` with:
   - A clear title and brief purpose statement
   - Concise, actionable rules and patterns (use bullet points and short code examples)
   - Keep it focused — one concern per file, no redundant content already in AGENTS.md
4. **Update AGENTS.md**: Add a reference to the new file under the existing instructions note near the top:

   > `Agent-specific workflow instructions live in /.instructions/*.md files.`

   If no list of instruction files exists yet, add a brief bullet list after that line referencing the new file.

## Constraints

- Keep the generated file **concise** — aim for under 80 lines
- Do not duplicate content already in [AGENTS.md](../../AGENTS.md)
- Follow project naming conventions (kebab-case filenames)
- Use code examples from the actual codebase where possible
