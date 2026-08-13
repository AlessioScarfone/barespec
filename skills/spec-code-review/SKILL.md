---
name: spec-code-review
description: >-
  Reviews the changes since a fixed point (commit, branch, tag, or merge-base)
  along two independent axes: Coding Standards (does the code follow the
  conventions in barespec/context.md, the repo standards docs, and a code-smell
  baseline?) and Spec (does the code implement what the barespec spec.yaml
  requirements and plan.md tasks asked for?). Runs both axes as parallel
  sub-agents and reports them side by side without merging findings. Use when
  reviewing a branch, a PR, work-in-progress changes, an implemented spec, or
  when asked to review since a given ref. Do not use for creating specs,
  generating plans, implementing tasks, or applying fixes automatically.
disable-model-invocation: true
---
You are a Reviewer dispatched to review a diff against the spec that produced it.

Two-axis review of the changes between `HEAD` and a fixed point supplied by the user:

- **Coding Standards** — does the code conform to the project's conventions (`./barespec/context.md`, repo standards docs) and avoid the smell baseline?
- **Spec** — does the code faithfully implement the requirements in `spec.yaml` and the tasks in `plan.md`?

Both axes run as **parallel sub-agents** so they don't pollute each other's context; this skill then aggregates their findings.

> **Note:** This skill reports problems only. It never applies fixes, refactors, or writes code, never edits source files, never checks tasks in `plan.md`, and never changes `feature.status`.

---

## Entry point

### 1. Pin the fixed point

1. Take whatever the user supplied as the fixed point — a commit SHA, branch name, tag, `main`, `HEAD~5`.
2. If none was supplied, check for local changes first instead of asking:
   - `git status --porcelain` — if it reports any uncommitted (staged or unstaged) changes, treat this as a **local review**: the diff command is `git diff HEAD` (working tree + staged, two-dot form, no ref needed) and there is no commit list.
   - If the working tree is clean, fall back to asking the user for a fixed point — there is nothing local to review.
3. When a fixed point was supplied (or resolved from a prior turn), verify it resolves: `git rev-parse <fixed-point>`. Capture the diff command — `git diff <fixed-point>...HEAD` (three-dot, comparing against the merge-base) — and the commit list — `git log <fixed-point>..HEAD --oneline`.
4. Confirm the diff is non-empty. A bad ref, a clean working tree with no fixed point, or an empty diff stops here, before any sub-agent is spawned.

### 2. Identify the spec source

Resolve the spec in this order, stopping at the first hit:

1. A spec name passed as an argument (e.g. `/spec-code-review user-authentication main`).
2. A folder in `./barespec/specs/` whose name matches the current branch name or a spec name referenced in the commit messages.
3. Specs in `./barespec/specs/` with `feature.status` of `in-progress` or `done` whose `feature.updated` falls within the range of the reviewed commits — if several match, list them and ask the user to choose.
4. If nothing matches, ask the user which spec to review against.
5. As a last resort, when no spec file exists, use the intent description the user supplied when invoking the skill (e.g. `/spec-code-review main "adds rate limiting to the login endpoint"`) as the spec source. If no description was supplied either, skip the Spec axis without asking.

Once resolved, output:
> "Reviewing `<fixed-point>...HEAD` against spec `<spec-name>`" — or the described intent (no spec file) — or, for a local review: "Reviewing local changes (working tree + staged) against spec `<spec-name>`"

When a spec folder was resolved, read `./barespec/specs/<spec-name>/spec.yaml` and `./barespec/specs/<spec-name>/plan.md` in full. When falling back to a description, treat that text as the only requirement source and mark the review as unspecced.

### 3. Identify the standards sources

1. Read `./barespec/context.md` if it exists — it is the primary standards source (tech stack, architecture, conventions).
2. Collect any repo file documenting how code should be written: `AGENTS.md`, `CONTRIBUTING.md`, `CODING_STANDARDS.md`, `.github/copilot-instructions.md`, or equivalents.
3. Read [references/smell-baseline.md](./references/smell-baseline.md) — it always applies, even when the project documents nothing.

### 4. Spawn both sub-agents in parallel

Read [references/subagent-briefs.md](./references/subagent-briefs.md) and dispatch both sub-agents in a single batch. Each brief must carry every input it needs — the sub-agents share no context with each other or with this session.

Skip the Spec sub-agent only when neither a spec folder nor an intent description was resolved in step 2, and note the skip in the report.

### 5. Aggregate

Present the two reports under `## Coding Standards` and `## Spec` headings, verbatim or lightly cleaned. Do **not** merge, rerank, or deduplicate findings across axes — see [Why two axes](#why-two-axes).

End with the summary block:

```
📋 Review: <fixed-point>...HEAD | local changes — spec `<spec-name>` | described intent (no spec file)

Coding Standards: N findings — worst: <one line, or "none">
Spec:             M findings — worst: <one line, or "not run: no spec">
```

Do not pick a single worst issue across both axes — that is exactly the reranking the separation exists to prevent.

### 6. Hand off

The review ends with the report. Name the next actions, never perform them:

- Requirement gaps or wrong implementations → `/spec-implement <spec-name>` to address them.
- Scope creep that turns out to be wanted → `/spec-create <spec-name>` to update the requirements.
- Missing tasks in the plan → `/spec-plan <spec-name>` to regenerate it.
- Review run against a description only → `/spec-create` to turn that intent into a real spec.


---

## Why two axes

A change can pass one axis and fail the other:

- Code that follows every convention but implements the wrong requirement → **Coding Standards pass, Spec fail.**
- Code that satisfies every ACID but breaks the project's conventions → **Spec pass, Coding Standards fail.**

Reporting them separately stops one axis from masking the other.

---

## Error handling

- **Unresolvable fixed point**: report the failing `git rev-parse` output and ask for a valid ref. Do not guess a substitute.
- **Empty diff**: report that the diff (`<fixed-point>...HEAD` or the local working tree) contains no changes and stop.
- **Clean working tree, no fixed point**: report that there are no local changes to review and ask for a fixed point instead.
- **Not a git repository**: report it and stop — this skill requires a diff.
- **No specs folder**: state that `./barespec/specs/` is missing, fall back to the user's intent description, and only if none is available run the Coding Standards axis alone with the Spec axis marked "not run".
- **Spec without `plan.md`**: run the Spec axis against `spec.yaml` only, and note the missing plan.
- **Description-only review**: state in the report that the Spec axis ran against a user-supplied description, not a spec file, and suggest `/spec-create` to capture it.
- **Sub-agent failure**: report the axis that failed, present the surviving axis, and never substitute an inline review for the missing one.

---

## Output rules

- Review only what the diff contains — pre-existing issues outside the diff are out of scope.
- Quote the evidence for every finding: the file and hunk, the convention, the requirement text, or the plan task line.
- Reference requirements by ACID (`<feature-name>.<GROUP_KEY>.<ID>`) whenever a spec file was used, never by paraphrase alone.
- Skip anything linters, formatters, or type checkers already enforce.
- Report findings only: a finding may describe the fix in one line of prose, but no fix is ever applied.
- Never modify source files, `spec.yaml`, `plan.md`, or `context.md`.