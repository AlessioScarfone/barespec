---
spec-name: spec-name
created: YYYY-MM-DD
updated: YYYY-MM-DD
---

```markdown
## Implementation Plan: [Feature/Project Name]

Describe the technical strategy in 2–5 sentences. 
Be specific: name the files, patterns, and mechanisms. 
Not "add an endpoint" but "add a POST /api/x handler in src/api/x.ts following the pattern in src/api/y.ts". 
If a key file or location is unknown, say so explicitly — e.g. "the middleware will be mounted in the app entry point (location TBD — see Q1)"_

**Acceptance criteria:**
- [Specific, testable condition mapped to a spec.yaml requirement ID, e.g. THEME.1]
- [Specific, testable condition]

**Verification:**
- Tests pass: `npm test -- --grep "feature-name"`
- Build succeeds: `npm run build`
- Manual check: [description of what to verify]

**Estimated scope:** [Small: 1-2 files likely touched | Medium: 3-5 files likely touched | Large: 5+ files likely touched]

---

## Task List

### 1. Theme Infrastructure
- [ ] 1.1 Create ThemeContext with light/dark state. _(THEME.1)_
- [ ] 1.2 ...
- [ ] 1.3 Checkpoint: run unit test
- [ ] 1.4 Checkpoint: build succeeded

### 2. UI Components
- [ ]* 2.1 Create ThemeToggle component _(THEME.2)_
- [ ] 2.2 ...
- [ ] 2.X Checkpoint: ...

### Checkpoint: Complete
- [ ] Unit tests passed
- [ ] Build succeeded

```