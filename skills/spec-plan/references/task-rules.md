# Task Rules

## The Planning Process

### Step 1: Enter Plan Mode

Before writing any code, operate in read-only mode:

- Read the spec and relevant codebase sections
- Identify existing patterns and conventions
- Map dependencies between components
- Note risks and unknowns

**Do NOT write code during planning.** The output is a plan document, not implementation.

### Step 2: Identify the Dependency Graph

Map what depends on what:

```
Database schema
    │
    ├── API models/types
    │       │
    │       ├── API endpoints
    │       │       │
    │       │       └── Frontend API client
    │       │               │
    │       │               └── UI components
    │       │
    │       └── Validation logic
    │
    └── Seed data / migrations
```

Implementation order follows the dependency graph bottom-up: build foundations first.

### Step 3: Slice Vertically

Instead of building all the database, then all the API, then all the UI — build one complete feature path at a time:

**Bad (horizontal slicing):**
```
Task 1: Build entire database schema
Task 2: Build all API endpoints
Task 3: Build all UI components
Task 4: Connect everything
```

**Good (vertical slicing):**
```
Task 1: User can create an account (schema + API + UI for registration)
Task 2: User can log in (auth schema + API + UI for login)
Task 3: User can create a task (task schema + API + UI for creation)
Task 4: User can view task list (query + API + UI for list view)
```

Each vertical slice delivers working, testable functionality.

### Step 4: Write Tasks
Each task follows the format strucuture defined in the [plan template](./plan.template.md) 

### Step 5: Order and Checkpoint

Arrange tasks so that:

1. Dependencies are satisfied (build foundation first)
2. Each task leaves the system in a working state
3. Verification checkpoints occur after every 2-3 tasks
4. High-risk tasks are early (fail fast)

Add explicit checkpoints task:

```markdown
- [ ] All tests pass
- [ ] Application builds without errors
```

## Plan File format

### Format
- `- [ ] 1.1 Pending task`
- `- [x] 1.1 Completed task`
- `- [ ]* 1.1 Optional task` (nice-to-have, not blocking)

### Numbering
- Top-level tasks: `1.`, `2.`, `3.`
- Sub-tasks: `2.1`, `2.2`, `2.3`
- Maximum 2 levels (no `2.1.1`)
- Parent tasks with sub-tasks are GROUP HEADERS — not directly executed
- Mark parent complete only when ALL sub-tasks are done
- Use sub-tasks when a feature has 3+ related implementation steps

### Requirement references
- Always tag each task with the `spec.yaml` requirement ID(s) it satisfies: `_(LOGIN.1)_` (or several: `_(LOGIN.1, AUTH.2)_`)
- The ID is `<COMPONENT_OR_CONSTRAINT_KEY>.<requirement-number>` as defined in `spec.yaml`
- Every requirement under `components` and `constraints` must be covered by at least one task

## Task content
Each task should include:
- **Clear objective** — what to implement
- **Implementation details** — sub-bullets with specifics
- **Requirement reference** — for traceability

## Guidelines
- Coding tasks ONLY — no deployment, user testing, or documentation tasks
- Incremental — each task builds on the previous
- Actionable by AI — specific enough for code generation
- Include checkpoints — periodic verification that tests pass
- Test-driven where appropriate — mark test tasks with `*` if optional

## Task Sizing Guidelines

| Size | Files | Scope | Example |
|------|-------|-------|---------|
| **XS** | 1 | Single function or config change | Add a validation rule |
| **S** | 1-2 | One component or endpoint | Add a new API endpoint |
| **M** | 3-5 | One feature slice | User registration flow |
| **L** | 5-8 | Multi-component feature | Search with filtering and pagination |
| **XL** | 8+ | **Too large — break it down further** | — |

If a task is L or larger, it should be broken into smaller tasks. An agent performs best on S and M tasks.

**When to break a task down further:**
- You cannot describe the requirement in 3 or fewer bullet points
- It touches two or more independent subsystems (e.g., auth and billing)
- You find yourself writing "and" in the task title (a sign it is two tasks)