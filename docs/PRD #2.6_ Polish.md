# **PRD 2.6: Polish**

### Dynamic Explosion Range Notation

**Objective**
Communicate the potential for variable outcomes in exploding dice rolls without cluttering the UI with astronomical theoretical maximums.

**Requirement: Visual Notation**
The Range display (e.g., `10 - 60`) must dynamically append the appropriate explosion suffix based on the active dice notation:
* **Recursive Explosion (`!`):** Append a single `!` to indicate dice can trigger additional rolls.
* **Compounding Explosion (`!!`):** Append `!!` to indicate multiple explosions are summed into a single result.
* **None:** No suffix for standard rolls.

**Styling & Precision**
* **Target:** Append the mark to the maximum value of the range (e.g., `10 - 60!!`).
* **Visuals:** Use the theme’s accent color for the suffix to highlight the specialized mechanic.
* **Constraint:** Do **not** calculate the theoretical maximum (based on the 100-explosion cap). The notation represents the *mechanic* rather than a fixed upper bound.

**User Interaction**
* **Tooltip:** (Optional) Add a title attribute to the suffix:
    * `!` : "Dice explode on max value."
    * `!!` : "Dice explode and compound into a single total."


### Range Symbol

- Change the Range symbol from "-" to ".." to make negative ranges readable. eg: `10d6-8`: `Range:
-70–-20 (Mod)  10–60 (Abs)` vs `Range:
-70..-20 (Mod)  10..60 (Abs)`


### Hamburger Menu Navigation

- Make Tabbing in Hamburger menu items work - currently there is no way to navigate the actual menu with the tab key. Is this regression? Are there tests for this? Esc key was supposed to close Hamburger menu when open etc. See: PRD #2.3_ Keypad focus.md


### Default Sorting for Keep/Discard

- Default keep N highest (++) results to sort descending
- Default keep N lowest (+-) results to sort ascending
- Default discard N lowest (--) results to sort ascending
- Default discard N highest (-+) results to sort descending


### Bug with Ceiling (and Floor?)

- Ceiling display bug with "--"; although it filters properly (eg X out of Y lowest) so seems to be visual only? eg input `20 1000d6!!4--990-1-2+4`"` (see screenshot)


