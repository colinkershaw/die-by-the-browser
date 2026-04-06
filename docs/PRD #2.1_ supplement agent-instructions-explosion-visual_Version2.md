# Agent Instructions: Explosion Glow Borders & Clean Math Display

## Branch
`copilot/copilotadvanced-dice-mechanics`  
File: `die-by-the-browser.html`

---

## Context

Explosion rolling and rendering are already implemented and working. The changes
required are:

1. Update CSS variables (`--clamp-floor`, add glow variables, add two new chip classes)
2. Remove `!` and `!!` characters from rendered result output (chip values and math
   detail strings) — the formula header in `.result-formula` is the ONE place these
   characters must be preserved as-is
3. Apply the new glow border classes to exploded chips instead
4. Render compound-exploded die values in italic in the "show the math" part of results (not in the chip).

Grid column alignment must be preserved throughout — chip widths are controlled via
`min-width` in `ch` units and must not be disrupted. Also account for the math formula, as we had been up until the introduction of ! and !! in this branch/PR.

---

## 1. CSS Changes

### 1a. Update `:root`

Find the existing `:root` block and make these changes:

- Change `--clamp-floor` from `#7FD3FF` to `#FFFFFF`
- Add all explosion glow variables

The updated `:root` block should be:

```css
:root {
    --placeholder-text: "e.g., 3d6 4d12";
    --mono-font: ui-monospace, SFMono-Regular, Menlo, "Cascadia Mono", Consolas, "Roboto Mono", "Liberation Mono";

    /* Clamp indicators */
    --clamp-floor: #FFFFFF;
    --clamp-ceil:  #FFD166;

    /* Standard explosion glow (!) — cyan */
    --glow-core:      42, 227, 243;
    --glow-mid:        0, 180, 255;

    /* Compound explosion glow (!!) — magenta */
    --glow2-core:     220, 139, 249;
    --glow2-mid:      213, 142, 249;

    /* Shared glow geometry */
    --inner-spread:   6px;
    --inner-opacity:  0.50;
    --outer-spread:   10px;
    --outer-opacity:  0.80;
    --border-opacity: 0.70;
}
```

### 1b. Add explosion chip classes

Add these three new CSS classes immediately after the `.die-clamp-ceiling` block:

```css
/* Standard explosion chip: cyan glow border (!) */
.die-explode-standard {
    border-color: rgba(var(--glow-core), var(--border-opacity)) !important;
    box-shadow:
        0 0 var(--inner-spread) rgba(var(--glow-core), var(--inner-opacity)),
        0 0 var(--outer-spread) rgba(var(--glow-mid),  var(--outer-opacity));
}

/* Compound explosion chip: magenta glow border (!!) */
.die-explode-compound {
    border-color: rgba(var(--glow2-core), var(--border-opacity)) !important;
    box-shadow:
        0 0 var(--inner-spread) rgba(var(--glow2-core), var(--inner-opacity)),
        0 0 var(--outer-spread) rgba(var(--glow2-mid),  var(--outer-opacity));
}

/* Compound summed value: italic to indicate it is a chain sum, not a raw roll */
.die-compound-val {
    font-style: italic;
}
```

The `!important` on `border-color` overrides the base `.die-game` and `.roll-chunk`
default low-opacity border without restructuring those base classes.

---

## 2. JavaScript — Renderer Changes

All changes are inside `renderResults()` in the `ui` object. Do not touch the engine
(roll logic, computeResult, buildFormula). The formula string passed to
`.result-formula` already contains `!` / `!!` from `buildFormula()` — leave it alone.

### 2a. Locate all places where `!` or `!!` are currently appended to rendered values

Search the renderer for any string concatenation or template literal that appends
`!` or `!!` to a die value or raw math string. This includes:

- The chip value (what appears inside `.die-game-val` or `.roll-val`)
- The raw math string (what appears inside `.die-raw` / `die-raw-val`)
- Any math detail string (e.g. the `=8!!+1` pattern visible in the screenshot)

Remove all such appended `!` and `!!` characters from these output strings.

### 2b. Apply glow class to exploded chips

The result object carries explosion state per die. Find where the renderer
determines which CSS class to apply to each die chip (`.die-game` for distributed
mode, `.roll-chunk` for basic/none mode).

For each die result that is flagged as having exploded:

- If `explodeMode === 'standard'` and the die (or bonus die) is part of an explosion
  chain: add class `die-explode-standard` to its chip element. 
- all dice slots in a standard explosion chain receive .die-explode-standard — both the triggering die and any 
  bonus dice it generated
- If `explodeMode === 'compound'` and `didExplode === true` for that die: add class
  `die-explode-compound` to its chip element
- Non-exploded dice: no glow class, existing styling unchanged

The class is applied to the outermost chip wrapper (`.die-game` in distributed mode,
`.roll-chunk` in none mode), not to the inner value span.

### 2c. Apply italic to compound-exploded values

For compound mode (`explodeMode === 'compound'`), when `didExplode === true` for a
die, wrap the value NOT in the chip with `.die-compound-val`:

```html
<span class="die-compound-val">10</span>
```

This applies to the value span inside the raw math portion only — not to the chip.

Non-exploded compound dice (those that did not trigger a chain) render normally
without italic.

### 2d. Grid alignment — chip width must not change

The existing `min-width` in `ch` units on value spans controls column alignment.
These must remain unchanged. Specifically:

- Do not add or remove characters from the value string itself — width is calculated
  from digit count only
- The removal of `!` and `!!` from the value string is actually a width improvement
  (fewer characters), but `min-width` is set from the theoretical max digit width
  (e.g. `String(sides).length` for raw, or the game result range for distributed),
  not from the actual character string — so no `min-width` recalculation is needed
- For compound mode, the chip value is a summed integer — its `min-width` must be
  calculated from the theoretical maximum compound value:
  `String(sides * MAX_EXPLOSION_ITERATIONS).length` in `ch` units, where
  `MAX_EXPLOSION_ITERATIONS` is `DiceNotation.MAX_EXPLOSION_ITERATIONS`
  This ensures all compound chips in a result are the same width regardless of
  whether they exploded
- For compound mode, the .die-raw-val span that displays the raw summed value inside .die-raw must also use 
  String(sides * DiceNotation.MAX_EXPLOSION_ITERATIONS).length as its min-width in ch units — replacing the standard 
  String(sides).length used for non-exploding dice — so the raw math column aligns consistently across all dice in the 
  result regardless of whether any individual die's chain ran long.

---

## 3. Summary of What Must NOT Change

- `.result-formula` content — preserve `!` and `!!` as typed by the user
- Engine methods: `roll()`, `rollWithOptions()`, `rollExploding()`, `computeResult()`,
  `buildFormula()` — no changes
- `min-width` calculation logic for non-exploding dice — no changes
- Any existing CSS class not listed above — no changes
- Test suite — no changes

---

## 4. Verification Checklist

After implementation, verify the following visually and via the test suite:

- [ ] No chip value (inside .die-game or .roll-chunk) is ever rendered in italic regardless of explosion mode
- [ ] 3d6!! roll: compound chips show magenta glow; the raw math total for exploded dice is italic (eg,
      current display: "10!!=8!!+2" -> new display: "<glow-border>10</glow-border>=<italic>8</italic>+2" NOTE: you are not using these literal tags;
      chip values are not italic; no `!!` appears anywhere in the chip or math detail
- [ ] `3d6!` roll: exploded bonus chips show cyan glow; no `!` appears in chip or
      math detail
- [ ] `3d6!4` threshold roll: chips that triggered threshold explosion show cyan glow
- [ ] Non-exploded dice in an exploding collection have no glow border
- [ ] All chips in a Rolls row are the same width (grid alignment preserved)
- [ ] Compound chips that did NOT explode have no glow
- [ ] Compound raw math results that did NOT explode are not italic
- [ ] `.result-formula` still shows `3d6!!`, `3d6!`, `3d6!4` correctly
- [ ] Clamp floor decoration (underline) is now white (`#FFFFFF`) not cyan
- [ ] Clamp ceiling decoration (overline) is still amber (`#FFD166`)
- [ ] All existing tests pass