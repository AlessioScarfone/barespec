# Smell Baseline

A fixed set of code smells (Fowler, _Refactoring_, ch. 3) that applies even when the project documents no standards at all.

Two rules bind it:

- **The project overrides.** A convention documented in `./barespec/context.md` or in a repo standards file always wins. Where it endorses something the baseline would flag, suppress the smell.
- **Always a judgement call.** Each smell is a labelled heuristic ("possible Feature Envy"), never a hard violation. Skip anything linters, formatters, or type checkers already enforce.

Each entry reads *what it is* → *how to fix*. Match each one against the diff.

- **Mysterious Name** — a function, variable, or type whose name doesn't reveal what it does or holds. → rename it; if no honest name comes, the design is murky.
- **Duplicated Code** — the same logic shape appears in more than one hunk or file in the change. → extract the shared shape, call it from both.
- **Long Function** — a function doing several things at several levels of abstraction. → extract the steps into named functions.
- **Long Parameter List** — many parameters, several of which travel together or come from the same source. → pass an object, or move the function to where the data lives.
- **Global Data / Mutable Data** — state modifiable from anywhere, or an object mutated far from where it was built. → encapsulate behind accessors; prefer returning new values.
- **Divergent Change** — one file or module is edited for several unrelated reasons. → split so each module changes for one reason.
- **Shotgun Surgery** — one logical change forces scattered edits across many files in the diff. → gather what changes together into one module.
- **Feature Envy** — a function that reaches into another object's data more than its own. → move the function onto the data it envies.
- **Data Clumps** — the same few fields or params keep travelling together (a type wanting to be born). → bundle them into one type, pass that.
- **Primitive Obsession** — a primitive or string standing in for a domain concept that deserves its own type. → give the concept its own small type.
- **Repeated Switches** — the same `switch`/`if`-cascade on the same type recurs across the change. → replace with polymorphism, or one map both sites share.
- **Loops** — a hand-rolled loop doing filter/map/reduce work. → use the pipeline operation the language offers.
- **Lazy Element** — a class, module, or function that no longer earns its own existence. → inline it.
- **Speculative Generality** — abstraction, parameters, or hooks added for needs the spec doesn't have. → delete it; inline back until a real need shows.
- **Temporary Field** — a field set only in some circumstances and empty otherwise. → extract the circumstance into its own object.
- **Message Chains** — long `a.b().c().d()` navigation the caller shouldn't depend on. → hide the walk behind one method on the first object.
- **Middle Man** — a class or function that mostly just delegates onward. → cut it, call the real target direct.
- **Insider Trading** — modules trading internals across a boundary they shouldn't cross. → move the shared concern, or introduce an explicit interface.
- **Large Class** — a type carrying too many responsibilities or fields. → extract the cohesive subsets.
- **Alternative Classes with Different Interfaces** — interchangeable implementations with mismatched signatures. → align the interfaces.
- **Refused Bequest** — a subclass or implementer that ignores or overrides most of what it inherits. → drop the inheritance, use composition.
- **Comments** — comments used as deodorant for unclear code. → refactor until the comment is redundant, then delete it.
