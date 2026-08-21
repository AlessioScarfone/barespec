# Round-based context interview

Resolve every open point **before** writing `context.md`. The file is the source of truth every
other mini-SDD skill reads — it must not ship with unanswered questions or `unknown` markers.

---

## The design tree

Model the project as a **design tree**: every answer branches into the questions that hang off it
(architecture style opens deployment and boundaries; "there is a UI" opens framework and rendering
model).

The **frontier** is every question whose prerequisites are already settled — what you can ask *now*
without guessing at answers you have not heard yet. A question that depends on another question
still open in this round belongs to a **later** round.

---

## Reconnaissance comes first

Finding *facts* is your job, never the user's. The codebase reconnaissance (step 1a) is the
fact-finding phase: it settles stack, entry points, test setup, and CI before round 1 begins.

Dispatch an `Explore` subagent for anything the reconnaissance left unclear. Never ask the user
about something readable from the repository.

**Do not block on exploration.** Only the questions downstream of a running exploration wait for it;
ask the rest of the frontier now.

---

## Round format

Ask the whole frontier in one message. Number each question and give your recommended answer —
derived from the reconnaissance whenever possible — so the user can reply "ok to all".

```
❓ **Q1** — **<question title>**: <question body; may include options A/B/C>

➡️ <your recommended answer>

---

❓ **Q2** — **<question title>**: <question body>

➡️ <your recommended answer>
```

Wait for the answers, recompute the frontier, ask the next round.

Conduct the interview in the language the user is writing in.

---

## When to stop

Stop when the frontier is empty. Stop escalating when a new round would only produce detail that
does not change how an agent works in this codebase — `context.md` is a single page, not an
architecture dossier.

Show a short decision summary, get the user's confirmation, then write the file.

---

## Handling non-answers

- **"You decide" / no answer** → adopt your recommended answer, say so, and write it into the file.
- **User abandons the interview** → adopt the recommended answers for the whole remaining frontier,
  list them, and write a complete `context.md`.
- **Answer contradicts the reconnaissance** → surface the conflict and re-ask that single question;
  the user's answer wins, but record it only once the contradiction is resolved.
