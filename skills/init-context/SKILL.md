---
name: init-context
description: 'Create or update the project context document that captures product vision, architecture, and tech stack in a single file. Use when bootstrapping a new project with mini-SDD, onboarding AI agents to an existing codebase, or updating project context after completing a feature. Do not use for writing feature specs or implementing code.'
disable-model-invocation: true
---

Create or update the project context document at `./barespec/context.md`.

This file is the single source of truth read by every other mini-SDD skill. It merges product vision, architecture overview, and tech stack into one concise document.

---

## Hook execution

Check `./barespec/barespec.config.yml` for `hooks.context.pre` and `hooks.context.post` entries. Run pre-hooks before the Entry point; run post-hooks after the full workflow completes. See [references/hooks.md](./references/hooks.md) for the full execution rules.

---

## Entry point

1. Check whether `./barespec/context.md` already exists.
   - **If it exists** → read it, show a summary to the user, and ask:
     > "The project context already exists. Do you want to **update** it or **start fresh** (overwrite)?"
     - **Update** → proceed to **Step 2 — Update flow**
     - **Start fresh** → proceed to **Step 1 — Creation flow**
   - **If it does not exist** → proceed to **Step 1 — Creation flow**

---

## Step 1 — Creation flow

### 1a. Codebase reconnaissance

Inspect the project to gather as much context as possible before asking questions.

**Read and parse** (skip missing files silently):
- `README.md` at project root
- `package.json` / `Cargo.toml` / `pyproject.toml` / `go.mod` / build manifests
- `AGENTS.md`, `CONTRIBUTING.md`, `docs/`
- CI/CD config (`.github/workflows/`, `Dockerfile`, `docker-compose.yml`)
- Source structure (`src/`, `app/`, `lib/`, `server/`, `api/`)

**Derive**:
- Project type (web app, API, CLI, library, monorepo, etc.)
- Tech stack (languages, frameworks, databases, test runners, build tools)
- Entry points
- UI presence (yes/no, which framework)
- Test setup

Present a short summary:

```
📋 Reconnaissance

Project: <name>
Type: <type>
Stack: <languages>, <frameworks>, <database>
UI: <yes — framework / no>
Tests: <yes — runner / no>
```

Ask: _"Does this look correct? Anything to add or fix?"_

### 1b. Round-based interview

Interview the user in rounds until every gap left by the reconnaissance is closed, following [references/interview.md](./references/interview.md).

Seed the first round with the topics the reconnaissance could not settle:

1. **What does this project do?** — One or two sentences describing the product/tool and who it's for.
2. **Key features** — The main capabilities or modules.
3. **Architecture style** — Monolith, microservices, serverless, CLI, etc.
4. **Non-functional requirements** — Performance targets, security constraints, compliance needs.
5. **Current status** — What's already built vs. what's planned.

Drop any topic already answered by the reconnaissance, and let later rounds follow from what the answers open up.

**Gate — do not write `context.md` while the frontier is non-empty.** Close with a short decision summary and the user's confirmation.

### 1c. Generate context.md

Read the template from `assets/context.template.md` and fill it in using the gathered information.

- Write the file to `./barespec/context.md`
- Set `Last updated` to today's date (`YYYY-MM-DD`)
- Confirm to the user:
  > "✅ Created `./barespec/context.md`. You can review and edit it manually anytime."

---

## Step 2 — Update flow

Use this flow when the context file already exists and the user chose to update it.

1. Read the current `./barespec/context.md`.
2. Ask the user:
   > "What changed? For example: new feature completed, tech stack change, architecture update, status change."
3. Based on the answer, update only the relevant sections of `context.md`.
4. Update the `Last updated` date to today (`YYYY-MM-DD`).
5. Show a diff summary of what changed.
6. Confirm:
   > "✅ Updated `./barespec/context.md`."

---

## Output rules

- **Asset path resolution**: Any `assets/`, `scripts/`, or `references/` paths in this skill are relative to the directory where this SKILL.md is installed — not the user's workspace. Derive the full absolute path from the path where this skill was loaded from.
- Keep the document **concise** — aim for a single page that an AI agent can quickly consume.
- Use the structure from the template; do not invent new sections.
- Write in plain English, no marketing language.
- Resolve every open point during the interview; the written file contains no unanswered questions.

## Error handling

- **File not writable / path missing**: Create parent directories as needed before writing `context.md`.
- **User provides no answers**: Adopt your recommended answer for every remaining question, list the answers you adopted, and write a complete file. Do not leave `<!-- unknown -->` markers behind.
- **Codebase reconnaissance finds nothing**: Skip the summary step and start the interview at round 1.
- **Conflicting information**: Surface the conflict to the user and re-ask that single question before writing.
