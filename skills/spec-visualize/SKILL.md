---
name: spec-visualize
description: >-
  Generate a self-contained, interactive HTML view of a barespec spec and its
  plan — requirement tree, requirement-to-task traceability, plan progress, an
  inferred flow diagram, touched files, non-goals and notes — so a human can
  review a spec without reading raw YAML and Markdown. Use when asked to
  visualise, render, preview, or review a spec or plan visually, or to "open
  the spec in a browser". Do not use for writing or editing specs (use
  spec-create), generating plans (use spec-plan), implementing code, or
  reviewing diffs (use spec-code-review).
disable-model-invocation: true
---

Render `./barespec/specs/<spec-name>/visual.html`: one offline HTML file, no external dependencies, that shows a spec and its plan for human review.

The work is split on purpose. The agent **extracts facts** from `spec.yaml` and `plan.md` into a JSON object; the page's own JavaScript **derives** coverage, progress, and inconsistencies from it. The agent never counts, and never draws — the template does both, identically every time.

> **Note:** This skill is read-only on the spec. It never modifies `spec.yaml`, `plan.md`, or `context.md`, and never changes `feature.status`. Its only output is `visual.html`.

---

## Hook execution

Check `./barespec/barespec.config.yml` for `hooks.visualize.pre` and `hooks.visualize.post` entries. Run pre-hooks before the Entry point; run post-hooks after the full workflow completes. See [references/hooks.md](./references/hooks.md) for the full execution rules.

---

## Entry point

1. Determine which spec to visualise:
   1.1 If a spec name is provided in the input (e.g., `/spec-visualize user-authentication`), use it.
   1.2 If no name is provided, scan spec folders in `./barespec/specs/` and read each `spec.yaml` `feature` block.
      - Exactly one spec → use it.
      - Several → list them all and ask the user to choose:
        > `<spec-name>` → status `<status>`
      - None → inform the user:
        > "No specs found in `./barespec/specs/`. Use `/spec-create` to create one first."
2. Once a spec is selected, output:
   > "Selected spec: `<spec-name>`"
3. Read `./barespec/specs/<spec-name>/spec.yaml` in full, and `plan.md` if it exists. A missing plan is not an error — the page shows a "No plan yet" banner.

---

## Workflow

### 1. Extract the data

Build the JSON object defined in [references/data-contract.md](./references/data-contract.md). Follow its rules strictly:

- Copy facts verbatim; never add counts, percentages, or coverage flags.
- Copy inconsistencies as they are — the page reports them.
- Set `"plan": null` when `plan.md` is missing.
- Infer the flow only as that file describes: every node cites its ACIDs, and `"flow": null` when no flow is evident.
- Set `generatedAt` to the current time.

### 2. Write the file

1. Copy `assets/visual.template.html` **unchanged** to `./barespec/specs/<spec-name>/visual.html`, overwriting any previous version. Prefer a file copy (e.g. `cp`) over retyping the template.
2. Serialise the JSON object, replace every `<` with `\u003c`, and substitute the result for the single `__BARESPEC_DATA__` placeholder in the copied file. Change nothing else in the file.

### 3. Report

Output the summary, then run post-hooks:

```
✅ Generated barespec/specs/<spec-name>/visual.html

Spec: <spec-name> v<version> — status <status>
Requirements: N across G groups
Plan: D/T tasks done | no plan yet
Flow: K inferred steps | none inferred

Open it in a browser to review. Re-run /spec-visualize <spec-name> after editing spec.yaml or plan.md.
```

Do not open the browser yourself unless a hook asks for it.

---

## Output rules

- **Asset path resolution**: Any `assets/`, `scripts/`, or `references/` paths in this skill are relative to the directory where this SKILL.md is installed — not the user's workspace. Derive the full absolute path from the path where this skill was loaded from.
- One `visual.html` per spec, alongside `spec.yaml`. Every run regenerates it from scratch.
- Never edit the template's HTML, CSS, or JavaScript in the output — only the data placeholder.
- Never add `visual.html` to `.gitignore` or commit it — whether it is versioned is the user's choice.
- Never modify `spec.yaml`, `plan.md`, or `context.md`.

## Error handling

- **Spec not found**: list available specs and ask the user to choose, or tell them to run `/spec-create` first.
- **`spec.yaml` has no requirements**: generate the file anyway — the page states the spec has no requirements — and point the user to `/spec-create`.
- **`plan.md` is missing**: generate with `"plan": null` and point the user to `/spec-plan <spec-name>`.
- **Malformed `spec.yaml` or `plan.md`** that can't be read reliably: report the parse problem with the offending location and stop. Don't guess at the content.
- **Spec folder not writable**: report the error; don't write the file elsewhere.
