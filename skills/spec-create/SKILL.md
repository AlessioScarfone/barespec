---
name: spec-create
description: 'Create or update a feature spec — define functional requirements and cross-cutting constraints for a single feature in a structured spec.yaml. Use when defining a new feature, capturing a requirement, writing a user story, drafting a spec, or refining an existing spec. Do not use for generating the implementation plan (use spec-plan) or implementing code.'
disable-model-invocation: true
---

Create or update a feature specification file in `./barespec/specs/`.

Each spec captures a single feature or requirement as a structured `feature.yaml`-style document with clear, testable requirements, serving as the contract between the user intent and the implementation. This skill produces **only** the `spec.yaml` contract — the implementation plan is generated separately by `spec-plan`.

---

## Hook execution

Check `./barespec/barespec.config.yml` for `hooks.spec.pre` and `hooks.spec.post` entries. Run pre-hooks before the Entry point; run post-hooks after the full workflow completes. See [references/hooks.md](./references/hooks.md) for the full execution rules.

---

## Entry point

1. Read `./barespec/context.md` if it exists — use it as background for all decisions.
2. Determine the user's intent from the input (e.g., `/spec-create user authentication`).
   - If no feature name or description is provided, ask: _"What feature or requirement do you want to spec?"_
3. Derive a **spec name** in dash-case from the feature description (e.g., `user-authentication`, `csv-export`, `dark-mode-toggle`).
4. Check for an existing spec by looking for `./barespec/specs/<spec-name>/spec.yaml` (exact match) and by scanning other spec folders for content similarity.
   - **If a match is found** → read its `feature.status` to get the current status, show a brief summary, and ask:
     > "A spec `<existing-spec-name>` already exists (status: <current-status>). Do you want to **update this spec** or **create a new one** with a different name?"
     - **Update** → proceed to **Update flow**
     - **New** → ask for a different name and proceed to **Creation flow**
   - **If no match is found** → output the derived name and proceed to **Creation flow**:
     > "📝 Spec name: `<spec-name>`"

---

## Creation flow

### 1. Gather the facts

Before asking the user anything, collect what the environment already knows:

- Mine the `./barespec/context.md` you read at entry for stack, architecture, and conventions.
- Read every `./barespec/specs/*/spec.yaml` and infer whether this spec depends on other specs being completed first. Populate `requires:` from that analysis — ask the user only when the relationship is genuinely ambiguous, and ask it as part of a round.
- Dispatch an `Explore` subagent for any codebase fact a question would otherwise depend on.

### 2. Run the round-based interview

Interview the user in rounds until every open point is resolved, following [references/interview.md](./references/interview.md). The five topics of the round-1 seed (behavior, user, functional requirements, cross-cutting constraints, technical notes) are a starting point, not a fixed questionnaire — later rounds follow from what the answers open up.

**Gate — do not write `spec.yaml` while the frontier is non-empty.** Close the interview with a decision summary and an explicit confirmation from the user that you have reached a shared understanding.

### 3. Generate the spec file

Read the template from `assets/spec.template.yaml` and fill it in using the gathered information, see the template header for the rules.

- Create the folder `./barespec/specs/<spec-name>/` if it does not exist.
- Write the spec to `./barespec/specs/<spec-name>/spec.yaml`.
- Fill the `feature` block: `name` = `<spec-name>` (lowercase, dashes/underscores); `description` = 2–3 sentences including who the user is; optional `version` and `prerequisites` (external dependencies).
- Group functional requirements into `components` with `UPPER_SNAKE` keys (e.g. `LOGIN`, `EXPORT`), unique across components and constraints. Number each requirement as an integer (`1`, `2`); use `<N>-<M>` for sub-requirements (max 1 level, never `-0`). A requirement's ACID is `<spec-name>.<GROUP_KEY>.<ID>`.
- Put non-functional / cross-cutting requirements under `constraints`; omit the section entirely if there are none.
- Keep each requirement an observable, testable (pass/fail) behavior. Be descriptive, not prescriptive.
- Map every settled decision to its destination field using the mapping table in [references/interview.md](./references/interview.md). Scope exclusions go to `non_goals`, technical choices and rationale to `technical_notes`.
- Omit `open_questions` entirely unless the user explicitly confirmed a deferral on an external blocker; in that case record `blocked_by` and the affected ACID.
- In the `feature` block set the barespec tracking fields: `requires: [<spec-name>, ...]` from the inferred dependencies, `created: YYYY-MM-DD`, `updated: YYYY-MM-DD`, and `status: draft`.
- Treat unmet `requires` as a derived blocking condition during implementation, not as a separate stored status.

### 4. Confirm and hand off to the plan

Confirm to the user and point them to the next step:
> "✅ Created `<spec-name>/spec.yaml` (status: draft).
> Next: run `/spec-plan <spec-name>` to generate the implementation plan."

---

## Update flow

Use this when a spec already exists and the user chose to update it.

1. Read the current spec from `./barespec/specs/<spec-name>/spec.yaml`.
2. Ask: _"What needs to change? New requirements, updated constraints, scope change?"_
3. Run the round-based interview from [references/interview.md](./references/interview.md), scoped to the delta: reopen only the branches of the design tree the change touches, and never re-ask what the current spec already settles. The same gate applies — resolve everything, summarise the decisions, get confirmation, then write.
4. Apply the changes to the relevant `components` / `constraints` / `feature` fields of `spec.yaml`. When adding requirements, append new numbers (or `<N>-<M>` sub-requirements) so existing IDs/ACIDs stay stable.
5. Re-inspect the other specs in `./barespec/specs/` and re-infer `requires:` from the updated spec content.
6. In the `feature` block set: `requires: [<spec-name>, ...]`, `updated: YYYY-MM-DD`, `status: draft`.
   - Setting `status: draft` signals that no `plan.md` exists yet, or that it is out of date and must be regenerated by `spec-plan`.
   - If some `requires` are not yet `done`, keep that as a derived blocking condition for implementation.
7. Drop any `open_questions` entry the update has resolved; delete the section when it becomes empty.
8. Show a summary of what changed and which dependencies were inferred.
9. Confirm and point to the next step:
   > "✅ Updated `<spec-name>/spec.yaml` (status: draft).
   > The spec changed — run `/spec-plan <spec-name>` to (re)generate the implementation plan."

---

## Status lifecycle

This skill sets `status: draft` — the spec contract exists but has no implementation plan yet. `spec-plan` advances a spec to `ready` once the plan is generated. The `in-progress` and `done` statuses are managed exclusively by `spec-implement`. Whether a spec is currently implementable is also derived from `requires:` — if any dependency is not `done`, implementation must wait.

---

## Output rules

- **Asset path resolution**: Any `assets/`, `scripts/`, or `references/` paths in this skill are relative to the directory where this SKILL.md is installed — not the user's workspace. Derive the full absolute path from the path where this skill was loaded from.
- One spec per file, one feature per `spec.yaml`
- Keep specs concise — aim for something an AI agent can read and turn into a plan without ambiguity.
- Express requirements as observable, testable (pass/fail) behaviors with stable ACIDs (`<spec-name>.<GROUP_KEY>.<ID>`).
- Focus on functional behavior and key constraints; omit obvious or purely cosmetic requirements.
- Do **not** generate `plan.md` here — that is the responsibility of `spec-plan`.
- Resolve every open point during the interview and fold the answers into the spec fields. A written spec contains no unanswered questions.

## Error handling

- **Spec name conflict**: If the derived dash-case name collides with an existing unrelated spec, show both and ask the user to confirm or pick a different name.
- **No input provided**: Ask _"What feature or requirement do you want to spec?"_ before doing anything else.
- **Spec folder not writable / path missing**: Create the `./barespec/specs/<spec-name>/` directory if it does not exist before writing.
- **User abandons the interview mid-way**: Adopt your recommended answer for every remaining frontier question, list those adopted answers explicitly, and write a complete spec. Never leave template placeholders in `components` or `constraints`.
- **User defers a question**: Only accept the deferral when the answer depends on a party or fact outside this session and the user confirms it. Record it in `open_questions` with `blocked_by` and the affected ACID. Plain uncertainty is not a blocker — put the question back to the user and settle it.
