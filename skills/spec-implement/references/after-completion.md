# After completion

> **Important:** this step must run every time implementation ends — including after any post-completion fixes requested by the user. If the user asks for changes after the completion summary, apply them and then re-run this step before closing the workflow.

Ask the user:
> "Do you want to update `context.md` to reflect the completed feature?"

If the user declines, skip this step entirely and end the workflow. If the user agrees, proceed with the following:

**Auto-update `context.md`**:
- Read `./barespec/context.md`.
- Based on the completed spec and the changes made, identify which sections of `context.md` are affected (e.g., new tech stack entries, updated architecture components, changed project status, new key features).
- Update **only** the relevant sections — do not rewrite unaffected content.
- Set `Last updated` to today (`YYYY-MM-DD`).
- Confirm to the user:
   > "✅ Updated `./barespec/context.md` to reflect the completed feature."
