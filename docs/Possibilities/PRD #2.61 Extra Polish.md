# _**ON HOLD**_ PRD 2.61: Extra Polish

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

# This may not be a good change?

Is it worth implementing at this time?
Copilot finished thinking

Copilot said: **Yes, it's worth implementing — and it
Yes, it's worth implementing — and it actually fixes a live bug.

Looking at the current implementation in die-by-the-browser.html:

colinkershaw / die-by-the-browser / die-by-the-browser.html
v1
_getDefaultSortState(filterAction, filterDirection, filterCount) {
if (!filterAction || !filterDirection || !filterCount) return 'original';
return filterDirection === 'high' ? 'desc' : 'asc';
},

This ignores filterAction entirely. That means it produces the wrong default sort for drop notations:

Notation	filterAction	filterDirection	Current result	Correct result
++3 (keep high)	keep	high	desc ✅	desc
+-3 (keep low)	keep	low	asc ✅	asc
--3 (drop low)	drop	low	asc ❌	desc
-+3 (drop high)	drop	high	desc ❌	asc
drop low keeps the high dice and should sort descending, but the current code returns asc because it only sees filterDirection: 'low'. The PRD's _getKeptDirection() helper is the direct fix for this.

Verdict: Implement it. It's a small, well-scoped change that corrects incorrect sort behaviour for all drop filter variants, and it's already well-designed in the PRD.

Uploaded image: image.png
die-by-the-browser.html
You said: Is this a bug? See screenshot
Is this a bug? See screenshot
Copilot said: Yes, this is exactly the bug identified
Yes, this is exactly the bug identified in the previous analysis. The screenshot confirms it perfectly:

Notation	Meaning	Expected Sort	Actual Sort	Status
10d6++5	keep 5 high	▼ desc	▼ desc	✅
10d6+-5	keep 5 low	▲ asc	▲ asc	✅
10d6--5	drop 5 low → keeps high	▼ desc	▲ asc	❌
10d6-+5	drop 5 high → keeps low	▲ asc	▼ desc	❌
The root cause is the current _getDefaultSortState in die-by-the-browser.html:

colinkershaw / die-by-the-browser / die-by-the-browser.html
v2
_getDefaultSortState(filterAction, filterDirection, filterCount) {
if (!filterAction || !filterDirection || !filterCount) return 'original';
return filterDirection === 'high' ? 'desc' : 'asc';
},

It only looks at filterDirection and completely ignores filterAction. For drop operations, the sort should follow the retained side, not the targeted side. The PRD's _getKeptDirection() fix directly resolves this. Would you like me to open a PR to implement it?

You said: I think the "bug" has perhaps been
I think the "bug" has perhaps been resolved by the separation of sorting Kept vs Dropped rolls? Look at the screenshot UI I'd attached and assess the overall UX going on. This is straight up default sorting following a Roll Dice - no user sorting yet.
Copilot said: Looking carefully at the screenshot, the kept/dropped
Looking carefully at the screenshot, the kept/dropped separation does partially save the UX — kept dice always appear first regardless. But the sort arrows are still misleading for the drop cases:

Notation	Sort arrow shown	What you see first	Arrow implies...	User likely expects...
10d6++5	▼ desc	High kept dice	Highest first	✅ Makes sense
10d6+-5	▲ asc	Low kept dice	Lowest first	✅ Makes sense
10d6--5	▲ asc	High kept dice	Lowest first	❌ Arrow contradicts what's shown
10d6-+5	▼ desc	Low kept dice	Highest first	❌ Arrow contradicts what's shown
So the bug isn't "dice shown in wrong order" — the kept-first separation rescues that. The bug is that the sort indicator arrow is lying about the sort applied to the kept group. A user glancing at 10d6--5 sees high dice with an ▲ arrow and has to mentally reconcile why ascending order starts with 5s.

The PRD fix still has value, but the framing shifts: it's no longer a correctness bug in the dice display, it's a misleading sort indicator for drop operations. The fix would align the arrow with the retained direction, so the arrow always truthfully describes what the user sees at the top of the list.

Worth fixing, but lower severity than originally assessed.

Uploaded image: image.png
You said: "10d6--5 ▲ asc High kept dice Lowest first ❌ Arrow contradicts
"10d6--5	▲ asc	High kept dice	Lowest first	❌ Arrow contradicts what's shown"
Does it? What is it showing? It shows the lowest KEPT dice first because the request (--5) was to DISCARD the lowest 5. See new screenshot.

Ditto -+5 which is sorting showing the highest KEPT dice.

Reason and let's see if you can convince me something is wrong.
Copilot said: You're right, and I'll reason it through
You're right, and I'll reason it through properly.

For 10d6--5 (drop lowest 5):

Kept dice displayed: 5 5 5 6 6 — in ▲ ascending order. The arrow is truthful.
Dropped dice: 1 3 3 3 4 — also ascending, visually separated.
For 10d6-+5 (drop highest 5):

Kept dice displayed: 5 4 4 4 1 — in ▼ descending order. The arrow is truthful.
Dropped dice: 6 6 5 5 5 — also descending.
The arrow is not lying in either case. I was wrong to say it was.

So is there anything wrong? The only remaining argument for the PRD fix is a consistency of intent one:

++5 (keep high) → ▼ desc — highest kept die first
--5 (drop low, same kept set) → ▲ asc — lowest kept die first
Both operations ultimately retain the same "side," yet default to opposite sort orders. A user who understands that --5 ≈ keep high 5 might find that surprising.

But that's a philosophical preference, not a bug. The current sort is truthful, the arrows are accurate, and the kept/dropped visual separation makes the result immediately readable.

Verdict: No bug. PRD 2.61 is now a nice-to-have consistency improvement, not a fix.

You said: Yes, it's hard to say if they're
Yes, it's hard to say if they're EXACLTY equals. when it's 10 rolls, yes they are. If it's 20d6--5 vs 20d6++5 then it's not an equal "5 retained 5 discarded", it's "drop 5, keep the rest" or "keep 5, drop the rest"
Copilot said: Exactly — this is the key insight
Exactly — this is the key insight that resurrects the PRD's argument.

With 10d6--5: drop 5, keep 5. Symmetric. The current ▲ asc on the kept group is fine — both groups are the same size and the split is obvious.

With 20d6--5: drop 5, keep 15. Now the kept group is the dominant result, and it's sorted ▲ asc — meaning the lowest of your retained dice appear first. Contrast with 20d6++5 which keeps 5 and sorts ▼ desc, showing the highest kept dice first.

The asymmetry becomes a real UX problem at scale:

++5 — "I want the best 5" → sees highest first ✅
--5 — "I want everything except the worst 5" → sees the near-worst of the kept group first ❌
In both cases the user's interest is in the high end of what they retained, but the default sort only serves that intent for ++.

So PRD 2.61 is justified — not for the symmetric case, but precisely because keep and drop are not mirror operations. The sort should follow the retained direction (what side am I keeping?), not the target direction (what side did I operate on?). That's exactly what _getKeptDirection() computes.

You said: "--5 — "I want everything except the
"--5 — "I want everything except the worst 5" → sees the near-worst of the kept group first ❌"
Asked to drop the worst of the worst, first sees the best of the worst... that could make some sense.
Copilot said: That's a fair counter. With `20d6--5` sorted
That's a fair counter. With 20d6--5 sorted ▲ asc:

Code
KEPT:    3 3 4 4 4 5 5 5 5 6 6 6 6 6 6   ← cutoff boundary is visible immediately
DROPPED: 1 1 1 2 2
The ascending sort actually exposes the cut point — you see exactly where the drop threshold landed. The boundary between "barely kept" and "dropped" is right in front of you. That's arguably informative, not wrong.

Versus 20d6++5 sorted ▼ desc:

Code
KEPT:    6 6 6 5 5   ← you see the best first
DROPPED: 4 4 3 3 3...
These are genuinely different user intents producing different but defensible displays:

++5 — "give me the elite picks" → show best first makes sense
--5 — "cull the failures" → showing the surviving boundary makes sense
So I'd now say: the PRD's premise that both should default to the same "retained direction" sort may itself be wrong. The current behaviour could be the correct behaviour for different reasons per operation type.

The honest conclusion: this needs a real user to tell you which they find more natural, because the code isn't broken — it's just making a different UX tradeoff than the PRD assumed.