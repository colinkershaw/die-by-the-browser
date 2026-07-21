# To Do

## Now
- Dropped rolls styling
- Fix flaky tests

## Done

- Rerun "PRD 2.3 Keypad focus" to determine how we've drifted from the keyboard tab navigation we had implemented. Eg, tab is not working with hamburger menu in Onscreen Keyboard mode; space doesn't press the keys on the onscreen keyboard in that mode either... etc.
- Change the Range symbol from "-" to ".." to make negative ranges readable. eg: `10d6-8`: `Range:
-70–-20 (Mod)  10–60 (Abs)` vs `Range:
-70..-20 (Mod)  10..60 (Abs)`
- Make Tabbing in Hamburger menu items work - currently there is no way to navigate the actual menu with the tab key. Is this regression? Are there tests for this? Esc key was supposed to close Hamburger menu when open etc. See: PRD #2.3_ Keypad focus.md
- Default keep N highest (++) results to sort descending
- Default keep N lowest (+-) results to sort ascending
- Default discard N lowest (--) results to sort ascending
- Default discard N highest (-+) results to sort descending
- Ceiling display bug with "--"; although it filters properly (eg X out of Y lowest) so seems to be visual only? eg input `20 1000d6!!4--990-1-2+4`"` (see screenshot)

- Make rolls sortable via tap/click: default (as rolled), high to low, low to high
- Make Rolling spinner NOT wipe the results and pull focus at top.
- Make "filtered out" rolls more subtle so the retained ones stand out more.


## Later

- Cleanup output when running all unit and ui tests together via CLI (`npx playwright test`)
- Methods seem to be getting insanely long param lists, eg `return - this._computeDistributionResult(formula, rollDetails, keptDetails, sides, modifier, floor, ceiling, explodeMode, sortState);` ; this needs to be looked at for possible object replacement.
- aria info from the menu may be lacking? Or lacking overall (eg, sorting)? Run an AI assessment.
