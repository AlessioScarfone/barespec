# Hook Execution

Hooks let users inject custom steps before and after any mini-SDD skill workflow via `./barespec/barespec.config.yml`.

## Pre-hooks

Run each instruction in order **before** the Entry point. Announce each one:
> "⚙️ Pre-hook: \<instruction\>"

## Post-hooks

Run each instruction in order **after** the full workflow completes (including the final summary). Announce each one:
> "⚙️ Post-hook: \<instruction\>"

## Rules

- If `barespec.config.yml` does not exist, skip hooks entirely.
- Pre and post hook lists are both optional. If absent or empty, skip silently.
- If a hook instruction is ambiguous or cannot be executed, inform the user and skip it — never block the main workflow.
