# Data contract

The template renders a single JSON object embedded in `visual.html`. The agent **copies facts** from `spec.yaml` and `plan.md` into this object; the page's JavaScript derives everything else — coverage, the traceability matrix, uncovered requirements, progress bars, checkpoints, task nesting, and the warnings panel.

## Rules

- **Copy, never compute.** No counts, percentages, coverage flags, or "is uncovered" markers. If a value can be derived from other fields, leave it out.
- **Copy text verbatim.** Keep backticks for inline code (the page renders them). Collapse YAML folded scalars (`>-`) to a single line; keep blank-line paragraph breaks in notes and the plan approach.
- **Copy inconsistencies as they are.** A task citing an ACID that doesn't exist, a task with no ACID, a sub-requirement without its parent — copy them faithfully. The page reports them; the agent never fixes or hides them.
- **Omit what the source doesn't have.** Absent optional keys stay absent; use `[]` or `null` only where marked.
- **Escape for HTML embedding.** After `JSON.stringify`, replace every `<` with `\u003c` so no value can close the `<script>` tag.

## Shape

```jsonc
{
  "generatedAt": "2026-09-23T14:05:00Z",        // ISO 8601, time of generation

  "spec": {                                      // from spec.yaml `feature`
    "name": "my-feature",
    "version": "0.1.0",                          // optional
    "status": "draft",                           // draft | ready | in-progress | done
    "description": "…",
    "created": "2026-08-27",
    "updated": "2026-08-27",
    "requires": [],                              // spec names
    "prerequisites": []                          // strings
  },

  "groups": [                                    // `components` first, then `constraints`, in file order
    {
      "key": "LOGIN",                            // UPPER_SNAKE group key
      "kind": "component",                       // component | constraint
      "name": "…",                               // optional
      "description": "…",                        // optional
      "requirements": [
        { "id": "1", "text": "…" },
        { "id": "1-1", "text": "…" },
        { "id": "2", "text": "…", "note": "…" }  // `2-note` entries fold into `note` of requirement 2
      ]
    }
  ],

  "plan": null,                                  // null when plan.md doesn't exist
  // or:
  "plan": {
    "approach": "…",                             // the strategy paragraph(s) under the plan title
    "acceptanceCriteria": ["…"],                 // optional
    "verification": ["…"],                       // optional
    "scope": "…",                                // optional, the "Estimated scope" text
    "sections": [                                // one per `###` heading under "Task List", in order
      {
        "title": "1. Schema cleanup",            // heading text without `###`
        "tasks": [                               // one per checkbox line, in order
          {
            "id": "1.1",                         // leading number; "" when the line has none
            "text": "…",                         // text after the id, without the trailing ACID tag
            "done": true,                        // `[x]`
            "optional": false,                   // `[ ]*` or `[x]*`
            "acids": ["NO_PERSISTENCE.3"],       // from `_(…)_`, `<GROUP_KEY>.<ID>` form; [] if none
            "files": ["src/schema/Foo.ts"]       // repo-relative paths cited in the task text; [] if none
          }
        ]
      }
    ]
  },

  "flow": null,                                  // null when no flow is evident (see below)
  // or:
  "flow": {
    "nodes": [
      {
        "id": "select",                          // unique, stable within the file
        "label": "Select device-only candidates",
        "stage": 1,                              // column, 0-based, left to right
        "kind": "step",                          // entry | step | external | exit
        "acids": ["ITEM_SELECTION.1"]            // every node cites at least one requirement
      }
    ],
    "edges": [
      { "from": "select", "to": "eligibility", "label": "candidates" }   // label optional
    ]
  },

  "noteFiles": [],                               // paths cited only in technical_notes / development_notes
  "nonGoals": [],                                // from `non_goals`
  "openQuestions": [                             // from `open_questions`; [] when absent
    { "question": "…", "blockedBy": "…", "affects": "LOGIN.1", "deferredOn": "2026-08-27" }
  ],
  "technicalNotes": "…",                         // optional
  "developmentNotes": "…"                        // optional
}
```

## Field notes

- **ACIDs** are always `<GROUP_KEY>.<ID>`. A task tag like `_(API.1, API.2)_` becomes `["API.1", "API.2"]`. Strip a leading `<spec-name>.` if present.
- **Tasks outside a `###` heading** go in a section whose `title` is `"Tasks"`.
- **Appended plans**: when `plan.md` holds several dated plans (the `/spec-plan` append mode), copy `approach`, `acceptanceCriteria`, `verification` and `scope` from the most recent one, and the task sections of all of them in file order.
- **Checkpoints** need no flag: the page treats a task as a checkpoint when its text, or its section title, starts with "Checkpoint".
- **Files**: only paths the plan text actually names (usually in backticks) — never guessed from context. A path already listed on a task can also appear in `noteFiles` when the notes cite it too.

## Inferring the flow

The flow is the only derived content, so it carries its evidence:

- Build it from the order of `components`, `technical_notes`, and the requirements themselves — typically: who calls in (`entry`), the ordered steps (`step`), upstream services (`external`), and short-circuits (`exit`, e.g. "no candidates → return").
- Every node cites the ACIDs it is drawn from. A step you can't tie to a requirement doesn't belong in the flow.
- Assign `stage` so data flows left to right; nodes that run in parallel or converge share a stage. Exits sit in the stage after the step that triggers them.
- Keep it small — up to about 15 nodes. Merge fine-grained steps rather than drawing every line of code.
- When the spec has no evident flow (a schema-only change, a config tweak), set `"flow": null`. Never force one.
