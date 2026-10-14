# AI Agent Instructions

# IMPORTANT

Always read this file completely before making any code changes.

If PROJECT.md or DECISIONS.md exist, read them before starting work.

These files define the project's architecture, rules, and long-term decisions.
## Goal

Help improve this project while keeping it simple, secure, and maintainable.

Understand the existing code before making changes.

---

## General Rules

- Think before coding.
- Prefer simple solutions.
- Preserve the current architecture.
- Reuse existing code whenever possible.
- Keep changes focused on the requested task.
- Never guess requirements. Ask when unsure.

---

## Code Style

- Write clean and readable code.
- Use descriptive variable and function names.
- Keep functions small.
- Avoid duplicated logic.
- Avoid unnecessary abstractions.
- Do not add comments unless they improve understanding.

---

## Architecture

- Keep reusable logic inside `/lib`.
- Keep API routes inside `/pages/api`.
- Do not reorganize the project unless requested.

---

## Security

- Never expose secrets.
- Never hardcode API keys.
- Always use environment variables.
- Never modify or create `.env` files.
- Never log sensitive information.

---

## Dependencies

Before adding a package, ask:

"Can this be implemented with existing tools?"

Only add dependencies when they provide clear value.

---

## Editing Rules

- Modify as little code as necessary.
- Do not rewrite working code without a reason.
- Do not change unrelated files.
- Preserve backwards compatibility whenever possible.

---

## Human Approval Required

Always ask before:

- changing project architecture
- deleting files
- performing destructive actions
- introducing major dependencies

---

## Definition of Done

A task is complete only if:

- it works correctly
- it follows the existing architecture
- it is readable
- it does not reduce security
- it does not introduce unnecessary complexity