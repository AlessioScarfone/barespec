# Sub-agent Briefs

Both sub-agents are read-only reviewers. Neither edits files, and neither sees the other's context — everything they need must be pasted into their prompt.

## Coding Standards sub-agent

Include in the prompt:

- The diff command (`git diff <fixed-point>...HEAD`) and the commit list.
- The paths of the standards sources found (always `./barespec/context.md` when it exists, plus any repo standards docs).
- The full text of `references/smell-baseline.md` — the sub-agent has no other access to it.

Brief:

> "Review the diff produced by `<diff command>`. Report — per file and hunk where relevant — (a) every place the diff violates a documented convention: cite the source file and the rule, quoting `context.md` where it applies; and (b) any baseline smell you spot: name it and quote the hunk. Distinguish hard violations from judgement calls — documented-convention breaches can be hard, baseline smells are always judgement calls, and a documented project convention overrides the baseline. Skip anything linters, formatters, or type checkers already enforce. Do not modify any file. Under 400 words."

## Spec sub-agent

Include in the prompt:

- The diff command and the commit list.
- The full contents of the spec's `spec.yaml` (`feature`, `components`, `constraints`, `non_goals`, `technical_notes`).
- The full contents of the spec's `plan.md`, including checkbox state.

Brief:

> "Review the diff produced by `<diff command>` against the spec below. Report: (a) requirements that are missing or only partially implemented — cite the ACID `<feature-name>.<GROUP_KEY>.<ID>`; (b) behaviour in the diff that no requirement asked for (scope creep), flagging anything that matches a `non_goals` entry; (c) requirements that look implemented but whose implementation looks wrong; (d) plan tasks marked `- [x]` with no corresponding change in the diff, and unchecked tasks that appear already implemented. Quote the requirement text or task line for each finding. Treat `- [ ]*` tasks as optional. Do not modify any file. Under 400 words."

### Description-only variant

When no spec file exists and the user supplied an intent description, include the diff command, the commit list, and that description verbatim, then use this brief instead:

> "Review the diff produced by `<diff command>` against the stated intent below. There is no spec file — the description is the only requirement source. Report: (a) parts of the stated intent that are missing or only partially implemented; (b) behaviour in the diff the description did not ask for (scope creep); (c) parts that look implemented but whose implementation looks wrong. Quote the diff hunk for each finding and the phrase of the description it relates to. State explicitly that findings are inferred from an informal description, not a spec. Do not modify any file. Under 400 words."

If neither a spec nor a description is available, skip this sub-agent and record that the Spec axis was not run.
