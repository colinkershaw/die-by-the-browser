# **PRD 2.61: Extra Polish**

## Keep / Drop Sorting Change

This step focuses on **Logic Normalization**. It transitions the codebase from interpreting "Keep/Drop" as two separate behaviors to a single, unified concept of "Retained Direction."

### Unified Filter Logic Normalization

**1. Objective** Centralize the domain logic for dice filtering to eliminate "clunky" branching in the UI and engine. Instead of the system asking "Is this a keep or a drop?", it will ask "Which side are we keeping?"

**2. Problem Statement** Currently, the logic for determining default sort order and result highlighting is "smeared" across the engine. The system manually calculates that `drop low` requires a `descending` sort and `keep high` also requires a `descending` sort. This redundancy makes the engine harder to maintain and prone to "off-by-one" logic errors when adding new filter types.



**3. Proposed Solution: The "Kept Direction" Helper** Extract a core helper function, `_getKeptDirection()`, to serve as the single source of truth for all filter-related display and calculation logic.

* **Logic Rule:** * If `Action` is **Keep**: The Kept Direction is the Target Direction.
  * If `Action` is **Drop**: The Kept Direction is the *Opposite* of the Target Direction.
* **UI Consequence:** Default sort always follows the Kept Direction (High = Descending, Low = Ascending).

**4. Functional Requirements**
* **Engine Refactor:** Implement `_getKeptDirection(action, target)` and `_oppositeDirection(dir)` within the `DiceApp` utility scope.
* **UI Integration:** Update the result renderer to call `_getKeptDirection` to determine the default sort state rather than checking `filterAction` directly.
* **Consistency:** Ensure that notation parsing (e.g., `++` vs `--`) remains user-facing, while the internal processing immediately canonicalizes the input.

**5. Success Criteria**
* Elimination of ternary operators or `if/else` blocks that check both `filterAction` and `filterDirection` simultaneously in the UI render loop.
* All filter-based sorting behavior is derived from a single function call.
* Zero change to the end-user's notation experience (it remains a "behind-the-hood" structural improvement).

### Why this is the "Best Small Refactor"
This approach follows the **Open-Closed Principle**. You aren't changing *what* the code does; you are changing *how it knows what to do*. By extracting this logic into a helper now, you make the eventual transition to a full "Alan Kay-ish" Object-Oriented model (`filter.defaultSortState()`) trivial, as the logic is already isolated and ready to be moved into a class method.

## Summary of Changes

This PRD (Product Requirement Document) step focuses on **Logic Normalization**. It transitions the codebase from interpreting "Keep/Drop" as two separate behaviors to a single, unified concept of "Retained Direction."

### PRD Step: Unified Filter Logic Normalization

**1. Objective** Centralize the domain logic for dice filtering to eliminate "clunky" branching in the UI and engine. Instead of the system asking "Is this a keep or a drop?", it will ask "Which side are we keeping?"

**2. Problem Statement** Currently, the logic for determining default sort order and result highlighting is "smeared" across the engine. The system manually calculates that `drop low` requires a `descending` sort and `keep high` also requires a `descending` sort. This redundancy makes the engine harder to maintain and prone to "off-by-one" logic errors when adding new filter types.



**3. Proposed Solution: The "Kept Direction" Helper** Extract a core helper function, `_getKeptDirection()`, to serve as the single source of truth for all filter-related display and calculation logic.

* **Logic Rule:** * If `Action` is **Keep**: The Kept Direction is the Target Direction.
  * If `Action` is **Drop**: The Kept Direction is the *Opposite* of the Target Direction.
* **UI Consequence:** Default sort always follows the Kept Direction (High = Descending, Low = Ascending).

**4. Functional Requirements**
* **Engine Refactor:** Implement `_getKeptDirection(action, target)` and `_oppositeDirection(dir)` within the `DiceApp` utility scope.
* **UI Integration:** Update the result renderer to call `_getKeptDirection` to determine the default sort state rather than checking `filterAction` directly.
* **Consistency:** Ensure that notation parsing (e.g., `++` vs `--`) remains user-facing, while the internal processing immediately canonicalizes the input.

**5. Success Criteria**
* Elimination of ternary operators or `if/else` blocks that check both `filterAction` and `filterDirection` simultaneously in the UI render loop.
* All filter-based sorting behavior is derived from a single function call.
* Zero change to the end-user's notation experience (it remains a "behind-the-hood" structural improvement).

### Why this is the "Best Small Refactor"
This approach follows the **Open-Closed Principle**. You aren't changing *what* the code does; you are changing *how it knows what to do*. By extracting this logic into a helper now, you make the eventual transition to a full "Alan Kay-ish" Object-Oriented model (`filter.defaultSortState()`) trivial, as the logic is already isolated and ready to be moved into a class method.