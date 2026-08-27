# Hook Interview Script

Use this script to collect hook instructions from the user. Ask all ten questions **in a single numbered message** so the user can answer all at once. Pre-fill current values where a config already exists.

---

> Let's configure your hooks. Answer each question below — if you don't want any hook for an event, reply "none" or leave it blank. If you want multiple actions, list them (I'll split them into separate hook items).
>
> **context step**
> 1. **pre-context** — runs before `init-context` starts.
>    Current: `<current value or "none">`
>    What custom instruction should run before creating/updating the project context? (e.g. "Check if context.md already exists in a non-standard location")
>
> 2. **post-context** — runs after `init-context` completes.
>    Current: `<current value or "none">`
>    What should happen after the context file is written? (e.g. "Update root README with a summary of the new context")
>
> **spec step**
> 3. **pre-spec** — runs before `spec-create` starts.
>    Current: `<current value or "none">`
>    What should happen before creating or updating a spec? (e.g. "Check that the git working directory is clean")
>
> 4. **post-spec** — runs after `spec-create` completes.
>    Current: `<current value or "none">`
>    What should happen after a spec is written? (e.g. "Append an entry to CHANGELOG.md under Unreleased")
>
> **plan step**
> 5. **pre-plan** — runs before `spec-plan` starts.
>    Current: `<current value or "none">`
>    What should happen before generating or updating an implementation plan? (e.g. "Re-read the latest spec.yaml to ensure the plan matches the current contract")
>
> 6. **post-plan** — runs after `spec-plan` completes.
>    Current: `<current value or "none">`
>    What should happen after a plan is written? (e.g. "Summarize the task count and estimated scope back to the user")
>
> **implement step**
> 7. **pre-implement** — runs before `spec-implement` starts.
>    Current: `<current value or "none">`
>    What should happen before starting implementation? (e.g. "Run the existing test suite and confirm it is green")
>
> 8. **post-implement** — runs after `spec-implement` completes.
>    Current: `<current value or "none">`
>    What should happen after all implementation tasks are done? (e.g. "Run npm run lint && npm test and fix any failures")
>
> **review step**
> 9. **pre-review** — runs before `spec-code-review` starts.
>    Current: `<current value or "none">`
>    What should happen before reviewing a diff? (e.g. "Re-read the relevant spec and plan before reviewing")
>
> 10. **post-review** — runs after `spec-code-review` completes.
>     Current: `<current value or "none">`
>     What should happen after the review report is complete? (e.g. "Summarize the findings and action items in review-summary.md")

---

## Interpreting answers

- **Negative response** ("none", "no", "nothing", "n/a", blank, "-") → set that event to an empty list `[]`; omit the key from the generated YAML (cleaner output).
- **Single action** → one list item.
- **Multiple actions in one answer** (comma-separated, numbered list, "and then", newline-separated) → split into separate list items. Each item must be a single, atomic instruction.
- **Unchanged / "keep it"** → preserve the existing value from the current config.
