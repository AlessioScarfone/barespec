---
spec-name: user-auth
created: 2026-10-08
updated: 2026-10-14
---

## Implementation Plan: user-auth

Add a `POST /login` handler in `src/routes/login.ts` that looks up the user, verifies the password in `src/auth/password.ts`, and on success creates a session through `src/auth/session.ts`, which holds an in-memory session store with create, destroy and expiry. A `POST /logout` handler in `src/routes/logout.ts` destroys the session. Failed-login counting lives in `src/auth/rate-limit.ts` and is called from the login handler. The plugin is mounted from `src/app.ts`, following the pattern of the existing inventory routes. Tests go in `test/login.test.ts` and `test/session.test.ts` with Vitest.

**Acceptance criteria:**
- Valid credentials return a session cookie; a wrong password and an unknown email return the same error (LOGIN.1, LOGIN.1-1, LOGIN.2)
- The sixth failed attempt within 15 minutes returns 429 with a `Retry-After` header (LOGIN.3, LOGIN.3-1)
- Signing out invalidates the session; an idle session expires after 8 hours (SESSION.1, SESSION.2)
- Stored passwords are argon2id hashes and the cookie is `HttpOnly` and `Secure` (SECURITY.1, SECURITY.2)

**Verification:**
- Tests pass: `npm test`
- Build succeeds: `npm run build`
- Manual check: sign in with `curl -i`, confirm the `Set-Cookie` flags, then sign out and repeat the call with the old cookie

**Estimated scope:** Medium: 3-5 files likely touched

---

## Task List

### 1. Login endpoint
- [x] 1.1 Add POST /login handler. _(LOGIN.1)_
- [x] 1.2 Return a generic error on a wrong password. _(LOGIN.1-1)_
- [ ] 1.3 Checkpoint: run unit tests

### 2. Sessions
- [x] 2.1 Create the in-memory session store with create and destroy in `src/auth/session.ts`. _(SESSION.1)_
- [x] 2.2 Set the session cookie from `src/routes/login.ts` on success. _(LOGIN.2)_
- [ ] 2.3 Add POST /logout handler in `src/routes/logout.ts` that destroys the session. _(SESSION.1)_
- [ ] 2.4 Expire sessions after 8 hours without a request in `src/auth/session.ts`. _(SESSION.2)_
- [ ] 2.5 Checkpoint: run unit tests and build

### 3. Hardening
- [ ] 3.1 Hash passwords with argon2id in `src/auth/password.ts`. _(SECURITY.1)_
- [ ] 3.2 Mark the session cookie `HttpOnly` and `Secure` in `src/routes/login.ts`. _(SECURITY.2)_
- [ ] 3.3 Count failed attempts per email and reject with 429 in `src/auth/rate-limit.ts`. _(LOGIN.3)_
- [ ] 3.4 Add the `Retry-After` header to rejected attempts. _(LOGIN.3-1)_
- [ ]* 3.5 Cover the lockout and its reset in `test/login.test.ts`. _(LOGIN.3, LOGIN.3-1)_
- [ ] 3.6 Checkpoint: build succeeded
