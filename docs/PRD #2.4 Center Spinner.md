## PRD Addendum: Non-janky Rolling UX + Stronger Keep/Drop De‑emphasis

**Document scope:** This addendum updates the PRD to cover (1) rolling UI behavior to prevent layout/scroll “center shift” and (2) stronger visual de-emphasis for filtered dice in Keep/Drop.  
**Implementation note:** Requirements are written to be testable. The app currently uses `state.isRolling` and `ui.renderAll()`; for large rolls (≥ 5000 dice) the current behavior clears results early, causing layout jump. This PRD changes that.

---

## Feature A — Rolling Spinner Without Layout/Scroll Jank

### Problem statement
When the user triggers a roll (especially large rolls), the app clears results immediately. This collapses the results area, changes page height/layout, and can cause the browser scroll position/viewport to shift. The spinner may appear to “move” because the viewport moved, not because the spinner isn’t fixed.

### Goals
1. Spinner appears centered in the **visible viewport** while rolling.
2. Existing results remain visible and stable while a new roll is being computed.
3. Results update is atomic: the UI swaps from old results to new results without an “empty flash”.

### Non-goals
- Changing dice math/logic.
- Changing the 5000-dice threshold behavior (unless separately specified).
- Reworking overall app layout beyond what is required to prevent layout jump.

---

### Requirements (Functional)

#### A1. Spinner visibility and position
- When a roll begins and `isRolling` becomes `true`, a “Rolling” spinner/overlay **must be visible**.
- The spinner/overlay must be centered relative to the **viewport** (not document), i.e., it remains centered regardless of scroll position.
- Spinner visibility must end when the roll is complete (`isRolling` becomes `false`).

#### A2. Results persistence during rolling (no early clear)
- When a roll is initiated, the app **must not clear** existing results content as a side-effect of entering the rolling state.
- Specifically:
  - The previous results must remain rendered while `isRolling === true`.
  - The results area must not collapse to empty solely because a roll is in progress.

#### A3. Atomic results swap
- New results must be computed into a temporary structure (e.g., `nextResults`) and only committed once fully ready.
- Once computation is complete:
  - Replace the displayed results in a single UI update (atomic swap).
  - Then set `isRolling` to `false`.
- There must be no user-visible intermediate state where results are empty (unless the user explicitly pressed Clear).

#### A4. Error behavior
- If the notation is invalid:
  - Show the error message.
  - Results behavior must be consistent and non-janky:
    - Either keep previous results visible, or replace with an error-only view (choose one behavior and test it).
  - **Requirement for this PRD:** keep previous results visible when a parse/validation error occurs (so errors don’t cause layout jump), unless a future PRD revision changes this.

---

### Requirements (UX / Layout Stability)

#### A5. No layout-driven scroll jump
- Entering rolling state must not change the page layout in a way that causes scroll repositioning.
- Practically, this means: no clearing/collapsing results container on roll-start; and the results container should maintain its height until swapped.

#### A6. Button behavior
- While rolling:
  - Roll button must be disabled.
  - Clear button must be disabled (or if allowed, must cancel rolling cleanly—**not in scope** here).
- After rolling:
  - Buttons return to normal enabled/disabled state based on existing rules.

---

### Test Requirements (Must implement tests first)

**Policy:** Add/adjust tests to confirm current behavior and enforce new behavior **before** implementing the change.

#### A7. Test cases — spinner + persistence + atomicity
Add tests that cover both the synchronous and asynchronous roll paths:

1) **Large roll shows spinner**
- Input: a roll at/above the “large roll” threshold (e.g., `5000d6`)
- Assert: `isRolling === true` shortly after triggering roll, then `false` after completion.

2) **Large roll does not clear existing results while rolling (NEW)**
- Setup: seed `state.rollResults` with a known non-empty sentinel result (or render results and snapshot DOM).
- Trigger: `5000d6` roll.
- Assert during rolling window:
  - `state.rollResults` is unchanged **OR** the rendered results DOM still contains the sentinel output.
- Assert after completion:
  - results are replaced with new results.

3) **Large roll swaps results only when ready (NEW)**
- Assert that the results change occurs only once computation is complete (no interim empty results DOM state).
- Recommended assertion: results container never becomes empty between roll-start and completion unless it was already empty.

4) **Small roll behavior remains correct**
- Input: `4999d6` (or any below threshold)
- Assert: no spinner / `isRolling === false` throughout (per existing intended behavior), results produced.

---

## Feature B — Keep/Drop (Filter) De-emphasis: Make Filtered-Out Dice More Grayed Out

### Problem statement
Keep/Drop filtering currently indicates dropped dice, but the de-emphasis is not strong enough. Users want filtered-out dice to be visually “more grayed out” so kept dice stand out.

### Goals
- Dropped (or otherwise filtered-out) dice are clearly de-emphasized relative to kept dice.
- Kept dice remain prominent and readable.

### Requirements (Visual)

#### B1. Stronger de-emphasis for filtered-out dice
- Any die result that is **filtered out** by Keep/Drop must be styled to be more muted than current styling.
- Styling must meet the following:
  - Reduced emphasis via **lower opacity** and/or **grayer color**.
  - Must remain readable (avoid extremely low contrast).
  - Must still preserve any essential markers (e.g., strike-through may remain).
- For the Strikeout styling for filtered results, make sure the strikout is more prominent than currently (BUT still muted overall per our overarching goal). Currently it is hard to see in some text.
  - perhaps thicker strikeout marker? 
  - Maybe a different colour than the text being struckout?

#### B2. Consistency
- The de-emphasis styling must apply consistently wherever individual dice results are displayed for filter scenarios:
  - inline die chips
  - wrapped lines/chunks
  - any “rolls” display variants used by the UI

#### B3. No ambiguity with other states
- If a die is both filtered-out and has other styling (e.g., explosion glow, crit markers), the filtered-out styling must still make it obviously de-emphasized (e.g., dim glow intensity via opacity inheritance or override).

---

### Test Requirements (UI/DOM-level where possible)

#### B4. Styling is applied to filtered-out dice
- When a Keep/Drop expression is rolled (e.g., drop-low or keep-high syntax as implemented), verify that filtered-out dice have the expected CSS class (e.g., `.die-dropped` or equivalent).
- Add a test that checks at least one filtered-out die renders with the de-emphasis class and at least one kept die does not.

---

## Acceptance Criteria (Definition of Done)

1. For large rolls, initiating a roll does **not** remove/clear existing results until the new results are ready.
2. No visible “empty flash” in the results area during rolling (unless the user pressed Clear).
3. Spinner appears centered in the viewport during rolling and does not appear to “shift” due to layout collapse.
4. Keep/Drop filtered-out dice are noticeably more grayed out than before and remain readable.
5. Tests are added first, and the final implementation passes all tests.

---

## Notes / Implementation Guidance (Non-binding but recommended)
- Use a “double buffer” approach: compute `nextResults` and only assign to `state.rollResults` at the end.
- Avoid calling `ui.renderAll()` in a state where `rollResults` has been cleared unless that is explicitly the desired UX (it is not for this PRD).
- If needed, ensure results container maintains minimum height to reduce reflow, but primary fix is “don’t clear early.”