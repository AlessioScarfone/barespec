---
name: barespec-guide
description: >-
  Autonomous knowledge base for the mini-SDD framework. Always read this skill
  when working on a mini-SDD project or when any message mentions mini-SDD,
  init-context, spec-create, spec-plan, spec-implement,
  spec-code-review, init-config, context.md, spec.yaml, plan.md, hooks config, or
  spec-driven development. Do not use for
  creating context files, writing specs, planning, implementing features, or
  reviewing code — those have their own skills.
user-invocable: false
---

This file is the complete reference for the mini-SDD framework. Read it in full whenever a mini-SDD topic arises. Do not create or modify any project files based on this skill alone.

---

## What mini-SDD is

**mini-SDD** is a lightweight spec-driven development framework for AI coding agents. It enforces one rule: **specs before code**.

```
context → spec → plan → implement → repeat
```

| Skill | Command | Purpose |
|-------|---------|---------|
| Project Context | `/init-context` | Capture the project foundation; update when architecture changes |
| Feature Spec | `/spec-create` | Define a requirement contract (`spec.yaml`) |
| Implementation Plan | `/spec-plan` | Turn a spec into an ordered, testable task plan (`plan.md`) |
| Implement | `/spec-implement` | Execute the task plan for a spec |
| Code Review | `/spec-code-review` | Two-axis, read-only review of a diff against Coding Standards and the Spec |
| Hook Config | `/init-config` | Configure custom pre/post hooks for any workflow step |

The **barespec** agent orchestrates these skills — it reads project state and routes the user to the correct next action.

---

## Workflow

```
1. /init-context  — Create or update context.md (once; re-run on stack changes)
         ↓
2. /spec-create <feature>  — Create spec.yaml contract (status: draft)
         ↓
3. /spec-plan <spec>  — Generate plan.md from the spec (status: draft → ready)
         ↓
4. /spec-implement <spec>  — Execute plan.md tasks (resume-safe across sessions)
         ↓
   spec status → done → dependent specs unlocked
         ↓
   Repeat from step 2 for the next feature
```

**Step 1 — Context:** Inspects the codebase (README, manifests, CI, source dirs), then interviews the user in rounds to close the remaining gaps, writes `./barespec/context.md`. Re-run after architectural changes.

**Step 2 — Spec:** Interviews the user in rounds (design tree + frontier, one recommended answer per question), finding environment facts itself instead of asking. Every open point is resolved before anything is written; the answers are folded into the spec fields. Infers `requires:` from existing specs, writes `spec.yaml` (acai `feature.yaml` format — `feature` + `components` + `constraints`). Sets `feature.status: draft`.

**Step 3 — Plan:** Reads `spec.yaml`, breaks its requirements into ordered, testable tasks following the task rules, writes `plan.md`. Advances the spec to `status: ready`.

**Step 4 — Implement:** Reads tasks from `plan.md` one by one, marks checkboxes, updates `feature.status` (`in-progress` → `done`). On completion: unlocks dependent specs, fills `development_notes` in `spec.yaml`.

**Optional — Code Review:** `/spec-code-review [fixed-point] [spec-name-or-description]` can run at any point after step 2 — it never advances the workflow itself, only reports findings for the user to act on via the other skills.

---

## File structure

```
./barespec/               # Root folder (default: barespec/)
├── context.md                          # Project foundation — written by init-context
├── barespec.config.yml                 # Hook configuration — written by init-config
└── specs/                  # Specs folder (default: specs/)
    └── <spec-name>/                    # One folder per feature
        ├── spec.yaml                    # Requirement contract (acai feature.yaml format)
        └── plan.md                     # Ordered implementation task checklist
```

**`spec.yaml` structure** (the file begins with `feature` and may contain `components` and `constraints`):

```yaml
feature:
  name: my-feature        # dash-case feature name
  version: 0.1.0          # optional, SemVer
  description: >-
    What the feature does, who benefits, why it matters.
  prerequisites: []       # optional external dependencies
  # barespec tracking extension:
  status: draft           # draft | ready | in-progress | done
  requires: []            # spec names that must be done first
  created: YYYY-MM-DD
  updated: YYYY-MM-DD

components:               # functional requirements, grouped by UPPER_SNAKE keys
  LOGIN:
    description: ...
    requirements:
      1: Observable, testable behavior
      1-1: Optional sub-requirement (max 1 level)

constraints:              # cross-cutting / non-functional requirements (optional)
  AUTH:
    requirements:
      1: ...

# barespec extensions: non_goals, technical_notes, development_notes
# open_questions is exceptional — deferred external blockers only, normally absent
```

A requirement is referenced by its **ACID**: `<feature-name>.<GROUP_KEY>.<ID>` (e.g. `my-feature.LOGIN.1-1`).

---

## Spec lifecycle

### Status values

| Status | Set by | Meaning |
|--------|--------|---------|
| `draft` | `spec-create` | Spec contract written, no implementation plan yet |
| `ready` | `spec-plan` | Plan generated; spec is ready to implement |
| `in-progress` | `spec-implement` | Implementation has started |
| `done` | `spec-implement` | Implementation is complete |

### Dependency rules

- `requires:` lists spec names that must reach `done` before this spec is implementable.
- Dependencies are inferred automatically by `spec-create`; the user is asked only when the relationship is ambiguous.
- A spec with unmet `requires` entries **cannot be implemented** even if `status` is `ready`.
- When a spec reaches `done`, `spec-implement` removes it from the `requires:` field of every spec that listed it and re-evaluates which specs are now unblocked.

### Task format (in `plan.md`)
```
- [ ] 1. Top-level task _(LOGIN.1)_
- [ ] 1.1 Sub-task _(LOGIN.1)_
- [x] 2. Completed task _(AUTH.2)_
- [ ]* 3. Optional task _(EXPORT.3)_    ← nice-to-have, not blocking
```

**Task rules:** Maximum 2 nesting levels. Every task references a requirement by its ACID: `_(<GROUP_KEY>.<ID>)_`. Parent tasks with sub-tasks are group headers — mark done only when all sub-tasks are checked. Coding tasks only — no deployment, docs, or manual testing.

---

## Skill behaviors

### `/init-context`

- If `context.md` exists → summarises it, asks: update or overwrite?
- **Creation:** runs codebase reconnaissance (README, manifests, CI, source dirs), then interviews the user in rounds until the frontier is empty — each round numbers its questions and carries a recommended answer. Fills and writes `context.md` once the user confirms the decision summary.
- **Update:** reads current file, applies only confirmed changes, refreshes `Last updated`.
- Reads `hooks.context.pre` before entry and `hooks.context.post` after completion.

### `/spec-create`

- Reads `context.md` for background. Derives a dash-case spec name. Checks for an existing spec and asks to update or create new if found.
- **Creation:** gathers facts first (`context.md`, existing specs, `Explore` subagent for codebase questions), then interviews the user in rounds until the frontier is empty — each round numbers its questions and carries a recommended answer. Nothing is written until the user confirms the decision summary. Answers land in `components` / `constraints` / `non_goals` / `technical_notes` / `prerequisites` / `requires`. Writes `spec.yaml` and sets `feature.status: draft`. Hands off to `/spec-plan`.
- **Update:** reopens only the branches the change touches, edits `spec.yaml` requirements, refreshes `feature.updated`, and resets `feature.status: draft` so the plan can be regenerated. Never touches `plan.md`.
- Reads `hooks.spec.pre` before entry and `hooks.spec.post` after completion.

### `/spec-plan`

- Reads `context.md` and the selected spec's `spec.yaml`. If no spec name given, lists `draft` specs (and specs whose plan is out of date) and asks the user to choose.
- **Creation:** breaks the spec requirements into ordered tasks (per the task rules), tags each task with the requirement ACID, presents them for confirmation, writes `plan.md`, and advances the spec to `feature.status: ready`.
- **Update:** regenerates or appends tasks to an existing `plan.md` (preserving history when appending), then re-confirms `status: ready`.
- Never modifies the requirements in `spec.yaml` — only its `feature.status` and `feature.updated` fields.
- Reads `hooks.plan.pre` before entry and `hooks.plan.post` after completion.

### `/spec-implement`

- Reads `context.md` for architecture context. If no spec name given, lists `ready` (unblocked) and `in-progress` specs and asks the user to choose.
- **Execute:** sets status to `in-progress`; for each unchecked task: announces it, implements the code, marks `- [ ]` → `- [x]`, updates `updated` date. Pauses on unclear tasks or discovered issues.
- **Resume:** when `status` is `in-progress`, finds first unchecked task, shows progress (N/M done), asks for confirmation.
- **Completion:** marks satisfied requirements, sets `feature.status: done`, removes the spec from `requires:` of dependent specs (unlocking them), fills `development_notes` in `spec.yaml` (files changed, follow-ups), shows a summary.
- Reads `hooks.implement.pre` before entry and `hooks.implement.post` after completion.

### `/init-config`

- If `./barespec/barespec.config.yml` exists → shows configured hooks, asks: update or reset?
- Runs the hook interview: all eight events in one message, pre-filled with current values.
- Writes (or overwrites) the config; shows the final file content. Never writes empty hook lists.

### `/spec-code-review`

- Read-only: never edits source files, `plan.md` checkboxes, or `feature.status`.
- Fixed point (commit/branch/tag) is optional — with none given and local changes present, reviews `git diff HEAD` (working tree + staged) instead of asking.
- Resolves the spec to review against, in order: argument → branch/commit-message match → recently-updated `in-progress`/`done` spec → ask the user → a user-supplied one-line intent description → skip the Spec axis.
- Runs two parallel sub-agents — Coding Standards (`context.md`, repo standards docs, Fowler smell baseline) and Spec (`spec.yaml` requirements + `plan.md` tasks) — and reports both without merging or reranking findings.
- Ends with a hand-off to `/spec-implement`, `/spec-create`, or `/spec-plan` — it never applies the fixes itself.

---

## Hook system

Hooks inject plain-text instructions before or after any skill's workflow. No shell scripts — the AI executes them as instructions.

**Supported events:**

| Step | Pre hook key | Post hook key |
|------|-------------|--------------|
| context | `hooks.context.pre` | `hooks.context.post` |
| spec | `hooks.spec.pre` | `hooks.spec.post` |
| plan | `hooks.plan.pre` | `hooks.plan.post` |
| implement | `hooks.implement.pre` | `hooks.implement.post` |

**Execution:** pre-hooks run before the skill's entry point; post-hooks run after the full workflow. Each instruction is announced: `"⚙️ Pre-hook: <instruction>"`. If a hook is ambiguous or cannot be executed, skip it without blocking the main workflow.

**Config format** (`./barespec/barespec.config.yml`):

```yaml
hooks:
  context:
    post:
      - "Update the CHANGELOG with a summary of context changes"
  implement:
    pre:
      - "Check git status and confirm the working tree is clean before starting"
    post:
      - "Run the test suite and report any failures"
```

**Hook writing rules:** imperative sentences; one atomic action per item; pre hooks are non-destructive; omit empty events entirely.

---

## Assessing project state

When determining the current state of a mini-SDD project or deciding what to do next:

1. Check whether `./barespec/context.md` exists. If missing, the first action is always `/init-context`.
2. Scan `./barespec/specs/` for spec folders. For each, read the `spec.yaml` `feature` block to get `status` and `requires`. Classify:
   - `in-progress` specs — highest priority to resume
   - `draft` specs — spec written but no plan yet; next action is `/spec-plan`
   - `ready` specs where all `requires` entries are `done` — implementable next
   - `ready` specs with unmet `requires` — blocked, not yet implementable
   - `done` specs — complete
3. Check whether `./barespec/barespec.config.yml` exists.

**Decision table:**

| Situation | Recommended action |
|-----------|-------------------|
| `context.md` missing | `/init-context` |
| No specs exist | `/spec-create <feature-name>` |
| A spec is `draft` (no plan) | `/spec-plan <spec-name>` |
| A spec is `in-progress` | `/spec-implement <spec-name>` to resume |
| Unblocked `ready` specs exist | `/spec-implement <spec-name>` |
| All specs `done`, nothing in-progress | `/spec-create <next-feature>` |
| Hooks not configured and user wants customisation | `/init-config` |
| User wants to check a diff/branch/PR against standards or spec | `/spec-code-review [fixed-point] [spec-name]` |

**State summary format** (use when reporting state to the user):

```
📊 Project state:
- Context: ✅ exists (last updated: YYYY-MM-DD) | ❌ missing
- Specs:   N total — D draft, X ready (Y implementable, Z blocked), A in-progress, B done
- Hooks:   ✅ configured (N events) | ❌ not configured
- Next recommended action: <action>
```

- **Asset path resolution**: Any `assets/`, `scripts/`, or `references/` paths in this skill are relative to the directory where this SKILL.md is installed — not the user's workspace. Derive the full absolute path from the path where this skill was loaded from.
