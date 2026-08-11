# Testing Guidelines

Follow these rules whenever a task requires writing or updating tests.

## Test at the right level

```
Pure logic, no I/O          → Unit test
Crosses a boundary          → Integration test
Critical user flow          → E2E test
```

Test at the lowest level that captures the behavior. Prefer integration-style tests: exercise real interfaces rather than mocked internal parts. A test that wires your own modules together is worth more than one that mocks them apart.

## Write descriptive tests

```
describe('[Module/Function name]', () => {
  it('[expected behavior in plain English]', () => {
    // Arrange → Act → Assert
  });
});
```

The name describes WHAT the caller gets, never HOW the code does it.

- Good: `it('user can checkout with a valid cart')`
- Bad: `it('checkout calls paymentService.process')`

## Cover these scenarios

For every function or component:

| Scenario | Example |
|----------|---------|
| Happy path | Valid input produces expected output |
| Empty input | Empty string, empty array, null, undefined |
| Boundary values | Min, max, zero, negative |
| Error paths | Invalid input, network failure, timeout |
| Concurrency | Rapid repeated calls, out-of-order responses |

## What makes a good test

A good test:
- Tests behavior users or callers actually care about
- Uses only the public API
- Survives internal refactors without edits
- Describes WHAT, not HOW
- Makes one logical assertion
- Verifies results through the same interface used to produce them

```typescript
// GOOD: observable behavior through the public API
test("user can checkout with valid cart", async () => {
  const cart = createCart();
  cart.add(product);

  const result = await checkout(cart, paymentMethod);

  expect(result.status).toBe("confirmed");
});
```

## Anti-patterns to avoid

### Implementation-detail tests

Coupled to internal structure — they break on refactors that change no behavior.

```typescript
// BAD
test("checkout calls paymentService.process", async () => {
  const mockPayment = jest.mock(paymentService);
  await checkout(cart, payment);
  expect(mockPayment.process).toHaveBeenCalledWith(cart.total);
});
```

Red flags: mocking internal collaborators, testing private methods, asserting on call counts/order, test breaks on a pure refactor, test name describes HOW not WHAT.

### Verifying through a back channel

Don't bypass the interface to check the result.

```typescript
// BAD: reaches past the interface into the database
test("createUser saves to database", async () => {
  await createUser({ name: "Alice" });
  const row = await db.query("SELECT * FROM users WHERE name = ?", ["Alice"]);
  expect(row).toBeDefined();
});

// GOOD: verifies through the interface
test("createUser makes user retrievable", async () => {
  const user = await createUser({ name: "Alice" });
  const retrieved = await getUser(user.id);
  expect(retrieved.name).toBe("Alice");
});
```

### Tautological tests

The expected value is recomputed the way the code computes it, so the test passes by construction.

```typescript
// BAD
test("calculateTotal sums line items", () => {
  const items = [{ price: 10 }, { price: 5 }];
  const expected = items.reduce((sum, i) => sum + i.price, 0);
  expect(calculateTotal(items)).toBe(expected);
});

// GOOD: expected value is an independent, known literal
test("calculateTotal sums line items", () => {
  expect(calculateTotal([{ price: 10 }, { price: 5 }])).toBe(15);
});
```

## Mocking policy

Mock at **system boundaries** only: external APIs, databases (prefer a real test database when feasible), time and randomness, file system.

Never mock your own classes/modules, internal collaborators, or anything you control.

**Use dependency injection** — pass external dependencies in rather than constructing them internally:

```typescript
// Easy to mock
function processPayment(order, paymentClient) {
  return paymentClient.charge(order.total);
}

// Hard to mock
function processPayment(order) {
  const client = new StripeClient(process.env.STRIPE_KEY);
  return client.charge(order.total);
}
```

**Prefer SDK-style interfaces over generic fetchers** — one function per external operation, instead of a single generic call with conditional logic. Each mock then returns one specific shape, with no conditional logic in test setup.

## Prove-it pattern for bug fixes

When a task is fixing a bug:
1. Write a test that demonstrates the bug (must FAIL against the current code).
2. Confirm the test fails.
3. Implement the fix, then confirm the test now passes.

## Rules

1. Test behavior, not implementation details.
2. Each test verifies one concept.
3. Tests are independent — no shared mutable state between tests.
4. Avoid snapshot tests unless reviewing every change to the snapshot.
5. Mock at system boundaries (database, network), not between internal functions.
6. Every test name should read like a specification.
7. A test that never fails is as useless as a test that always fails.
8. Expected values are independent literals, never recomputed with the code's own logic.
9. Verify results through the same public interface that produced them.
10. If a test breaks during a pure refactor, the test was wrong — not the refactor.
