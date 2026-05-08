# **PRD 2.61: Extra Polish**

## Keep / Drop Sorting Change

This step focuses on **Logic Normalization**. It transitions the codebase from interpreting "Keep/Drop" as two separate behaviors to a single, unified concept of "Retained Direction."

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



## Negative Floor and Ceiling

### Background

The current limit system stores `floor` and `ceiling` as non-negative integers. When a distributed or aggregated modifier pushes results into negative territory — e.g. `1d12-14` yields -13 to -2 — there is no way to express a limit such as "no lower than -6". This PRD specifies the minimal, precise extension required.

---

### What the Code Actually Does Today

#### Token grammar (enforced by `_parseDiceToken`)

Parsing consumes a single whitespace-free token left-to-right in strict stage order:

```
NdX → [! | !!][threshold] → [filter] → [distMod]
```

Stage 3 (filter) fires when `token[idx]` **and** `token[idx+1]` are both operator characters (`+` or `-`). It consumes `++`, `+-`, `-+`, or `--` plus trailing digits and returns. It will not fire if `token[idx+1]` is a digit, so `-18` is never mistaken for a filter.

Stage 4 (distributed modifier) fires when `token[idx]` is `+`/`-` and `token[idx+1]` is a digit. It consumes a signed modifier, then up to two limit tokens in the form `([+-])(\d+)`. The limit value is **digits only** — no sign is accepted after the direction operator.

```javascript
floor: null,   // number | null  (currently always >= 0)
ceiling: null  // number | null  (currently always >= 0)
```

#### Aggregated modifier (space-separated, parsed in `_parseToAST`)

```javascript
const aggModRe = /^([+-])(\d+)(([+-])(\d+)(([+-])(\d+))?)?$/;
```

Limit groups are `(\d+)` — digits only, non-negative.

#### Clamping (already sign-agnostic)

```javascript
// _computeDistributedResult and _computeAggregatedResult both use:
if (floor !== null && total < floor)   { total = floor; ... }
if (ceiling !== null && total > ceiling) { total = ceiling; ... }
```

`Math.max` / `Math.min` semantics work correctly for any signed integers. **No clamping logic needs to change.**

#### Validation gap

```javascript
if ((group.floor !== null && group.floor > DiceApp.MAX_MODIFIER) || ...)
```

Uses `>` without `Math.abs()`. A large negative value would pass this guard undetected.

---

### Why There Is No Ambiguity

The filter stage fires **before** the modifier stage and only when both current and next characters are operators. Once a modifier like `-18` has been consumed, `idx` is past the modifier digits. Any subsequent `--6` or `+-3` cannot reach the filter branch — it has already been skipped. The proposed syntax therefore has zero ambiguous cases:

| Input | Parses as |
|---|---|
| `3d6--3` | filter: drop-low 3 (no modifier — filter fires) |
| `3d6+-3` | filter: keep-low 3 (no modifier — filter fires) |
| `3d6-18--6` | modifier -18, floor -6 (filter stage skipped — `token[idx+1]` was `1`, a digit) |
| `3d6-18+-3` | modifier -18, ceiling -3 (same) |
| `10d6-18--6+-3` | modifier -18, floor -6, ceiling -3 |

For the aggregated path: `3d6 -18--6+-3` — the regex must accept `-?\d+` for limit groups; the direction operator (`-` or `+`) still determines floor vs ceiling, and the optional leading `-` sets the sign of the limit value itself.

---

### Syntax Specification

A limit token is extended from `<directionOp><digits>` to `<directionOp><valueSign?><digits>`:

```
<directionOp>  ::= '+' | '-'     ('+' = ceiling, '-' = floor)
<valueSign>    ::= '-'           (optional; absence means positive)
<digits>       ::= [0-9]+
```

| Written | Direction | Value | Meaning |
|---|---|---|---|
| `-6` | floor | +6 | floor at 6 *(existing)* |
| `+6` | ceiling | +6 | ceiling at 6 *(existing)* |
| `--6` | floor | -6 | floor at -6 *(new)* |
| `+-3` | ceiling | -3 | ceiling at -3 *(new)* |

Both distributed and aggregated modifier forms accept negative limits. The existing constraint that limits require a modifier to be present is unchanged — standalone `3d6` cannot carry a limit.

---

### Required Code Changes

#### 1. `_parseDiceToken` — limit parsing loop

Where the current code reads a direction operator then a digit run, add an optional `-` sign capture between them:

```javascript
// For each limit token (up to two):
const dirOp = token[idx];           // '+' or '-'
idx++;
let limitNeg = false;
if (idx < token.length && token[idx] === '-') {
    limitNeg = true;
    idx++;
}
let limitDigits = '';
while (idx < token.length && /[0-9]/.test(token[idx])) {
    limitDigits += token[idx++];
}
if (!limitDigits) return { group: null, error: 'INVALID_FORMAT' };
let limitValue = parseInt(limitDigits, 10);
if (limitNeg) limitValue = -limitValue;

if (dirOp === '-') {
    if (group.floor !== null) return { group: null, error: 'INVALID_OPERATOR_FOR_LIMIT' };
    group.floor = limitValue;
} else {
    if (group.ceiling !== null) return { group: null, error: 'INVALID_OPERATOR_FOR_LIMIT' };
    group.ceiling = limitValue;
}
```

This applies twice — once for the first optional limit, once for the second.

#### 2. `_parseToAST` — aggregated modifier regex

Change the two limit capture groups from `(\d+)` to `(-?\d+)`:

```javascript
// Before
const aggModRe = /^([+-])(\d+)(([+-])(\d+)(([+-])(\d+))?)?$/;

// After
const aggModRe = /^([+-])(\d+)(([+-])(-?\d+)(([+-])(-?\d+))?)?$/;
```

The limit value is then parsed directly with `parseInt(aggMatch[5], 10)` and `parseInt(aggMatch[8], 10)` — the `-` is already embedded in the captured string. Remove the `parseInt(sign + digits)` pattern for limit groups.

**Note:** The modifier itself (`aggMatch[2]`) remains `(\d+)` — its sign is captured in `aggMatch[1]` and combined as `parseInt(modSign + aggMatch[2])`. This is unchanged.

#### 3. Validation — use `Math.abs` for limit bounds

```javascript
// Before
if ((group.floor !== null && group.floor > DiceApp.MAX_MODIFIER) ||
    (group.ceiling !== null && group.ceiling > DiceApp.MAX_MODIFIER))

// After
if ((group.floor !== null && Math.abs(group.floor) > DiceApp.MAX_MODIFIER) ||
    (group.ceiling !== null && Math.abs(group.ceiling) > DiceApp.MAX_MODIFIER))
```

Apply the same fix to the equivalent guard in the aggregated block of `_parseToAST`.

#### 4. New validation — limit order

If both floor and ceiling are set, `floor` must be `<=` `ceiling`. Add after both limits are resolved:

```javascript
if (group.floor !== null && group.ceiling !== null && group.floor > group.ceiling) {
    return { group: null, error: 'INVALID_LIMIT_ORDER' };
}
```

Same check in the aggregated path. This condition was previously impossible (both were non-negative and the `-`/`+` direction encoding kept them ordered by convention), but negative values break that assumption.

#### 5. Formula reconstruction

Where the formula string is assembled for display and URL hash encoding, the emitter must handle the sign of the limit value:

```javascript
if (collection.floor !== null) {
    formula += collection.floor < 0
        ? `--${Math.abs(collection.floor)}`
        : `-${collection.floor}`;
}
if (collection.ceiling !== null) {
    formula += collection.ceiling < 0
        ? `+-${Math.abs(collection.ceiling)}`
        : `+${collection.ceiling}`;
}
```

The aggregated (space-separated) formula emitter needs the same logic.

#### 6. Clamping logic — no change

`_computeDistributedResult` and `_computeAggregatedResult` already use `<` / `>` comparisons and `Math.max` / `Math.min`. These are correct for negative values without modification.

#### 7. `die-raw` display — no structural change

The raw display (`=1-3`) shows the unmodified roll value and the modifier. This is unaffected. The `.die-clamp-floor` and `.die-clamp-ceiling` CSS classes are applied based on whether clamping occurred — the sign of the limit is irrelevant to that logic.

---

### Error Codes

| Code | Condition |
|---|---|
| `INVALID_FORMAT` | Malformed limit token (e.g. `---6`, `+-`) |
| `MODIFIER_TOO_LARGE` | `Math.abs(floor or ceiling) > MAX_MODIFIER` |
| `INVALID_OPERATOR_FOR_LIMIT` | Same floor or ceiling direction specified twice |
| `INVALID_LIMIT_ORDER` *(new)* | Both limits set and `floor > ceiling` |

---

### Test Cases

#### Parser unit tests

| Input | Expected result |
|---|---|
| `1d12-14--6` | modifier=-14, floor=-6, mode=distributed |
| `1d12-14+-3` | modifier=-14, ceiling=-3, mode=distributed |
| `1d6-8--6+-3` | modifier=-8, floor=-6, ceiling=-3, distributed |
| `3d4+2--1` | modifier=+2, floor=-1, distributed |
| `3d6-5+-3--6` | modifier=-5, ceiling=-3, floor=-6, distributed (order-independent) |
| `3d6 -5--3` | modifier=-5, floor=-3, mode=aggregated |
| `3d6 +5+-3` | modifier=+5, ceiling=-3, mode=aggregated |
| `3d6 -5--3+2` | modifier=-5, floor=-3, ceiling=+2, aggregated |
| `1d6-5--3+-6` | error: `INVALID_LIMIT_ORDER` (floor -3 > ceiling -6) |
| `3d6--3` | filter: drop-low 3, no modifier *(existing behaviour unchanged)* |
| `3d6+-3` | filter: keep-low 3, no modifier *(existing behaviour unchanged)* |

#### Rolling / behavioural tests (deterministic mock)

| Input | Mock value | Raw | After modifier | Clamped to | Class applied |
|---|---|---|---|---|---|
| `1d12-14--6` | 0.45 → 6 | 6 | 6-14 = -8 | -6 | `die-clamp-floor` |
| `1d12-14--6` | 0.9 → 11 | 11 | 11-14 = -3 | — (−3 > −6) | none |
| `1d6-8--6+-3` | 0.0 → 1 | 1 | 1-8 = -7 | -6 (floor) | `die-clamp-floor` |
| `1d6-8--6+-3` | 0.99 → 6 | 6 | 6-8 = -2 | -3 (ceiling) | `die-clamp-ceiling` |
| `1d6-8--6+-3` | 0.5 → 4 | 4 | 4-8 = -4 | — (−6 ≤ −4 ≤ −3) | none |

#### Formula round-trip test

Parse `1d6-8--6+-3`, reconstruct formula, assert it equals `"1d6-8--6+-3"`. Parse reconstructed formula, assert collections are identical to original parse.

---

### Out of Scope

- Floating-point limits
- Limits without a modifier (e.g. a bare floor on a plain `3d6`)
- Using `floor > ceiling` as a "clamp to constant" mode
- Any changes to the keypad UI (the `-` key already exists)