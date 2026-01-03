---
applyTo: '**'
---
Provide project context and coding guidelines that AI should follow when generating code, answering questions, or reviewing changes.

# Testing Instructions

## Running Tests
- **Non-Interactive Mode**: Always run tests in non-interactive mode to prevent the process from hanging and waiting for user input.
  - Use `npm test -- --run` or `npx vitest run` instead of just `npm test` or `vitest`.
  - Ensure the test command exits automatically after execution.

## General Guidelines
- Write unit tests for new features.
- Ensure tests are deterministic and do not rely on external state if possible.