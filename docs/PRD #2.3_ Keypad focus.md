Certainly — here’s a tighter rewrite that makes the **actual change**, **no-change items**, and **open questions** explicit.

## PRD: Keyboard Activation and Focus Behavior for Keypad Mode

### Summary

Improve keypad-mode usability so it behaves as closely as practical to keyboard mode with the native input, while preserving the app’s shortcut conventions:

- **Enter** always triggers **Roll**
- **Escape** always triggers **Clear** (except if Hamburger Menu is open)
- **Space** activates focused buttons using standard browser behavior.
- Tab order remains unchanged and follows the current DOM order

This is primarily an accessibility and interaction refinement, not a redesign.

---

## Problem Statement

Keypad mode is already partly keyboard-friendly, but it is missing one key behavior:

- Tab navigation across keypad buttons works
- The pseudo input behaves as the editing surface
- But **Space does not currently activate a focused keypad button**

Additionally, the hamburger menu is usable with Tab, but it should also support standard keyboard activation and closing behavior.

---

## Goals

1. Make keypad mode behave more like the native-input keyboard mode from a user’s perspective.
2. Preserve the app’s global shortcut semantics:
  - Enter = Roll
  - Escape = Clear
3. Ensure keypad buttons behave like standard keyboard-accessible buttons.
4. Improve menu keyboard accessibility without changing the existing layout or tab order.

---

## Non-Goals

- Replacing the pseudo input with a native textarea
- Changing dice notation behavior
- Reworking keypad layout
- Changing Tab order
- Changing Enter or Escape semantics
- Adding new dice-entry features

---

## Proposed Behavior

### Keyboard Mode
**No Changes:**
- Real textarea receives focus
- Native text-entry behavior applies
- Enter triggers Roll
- Escape triggers Clear

### Keypad Mode
- Pseudo input remains the primary focus target for editing in keypad mode
- Space activates the currently focused keypad button
- Tab order remains unchanged and follows keypad button DOM order
- Enter continues to trigger Roll
- Escape continues to trigger Clear

### Hamburger Menu
- Tab can move to the hamburger menu button
- Space activates the hamburger menu button
- When the menu is open, Tab moves through menu items only
- Add a keyboard-focusable close button in the upper-right corner of the open menu
- When the menu is closed, only the hamburger button can receive Tab focus.
- When the menu is open, tabbing is limited to menu controls
- The close button is the first focusable item in the menu, which should occur by default because of DOM layout
- Esc closes menu: Escape normally clears the dice input, but if the menu is open, it closes the menu instead.
- 
---

## Detailed Requirements

### 1) Keypad Mode Focus
- When keypad mode is active, the pseudo input must be focusable.
- When keypad mode is entered, focus should move to the pseudo input by default.
- Focus should not be forcibly pulled away from a focused keypad button after activation.

### 2) Keypad Button Activation
- Keypad buttons must remain real focusable buttons.
- When a keypad button has focus, Space must activate it.
- Enter must not be repurposed as a button-activation key; Enter remains the app default action.

### 3) Tab Order
- Tab order must remain the same as it is now.
- Focus should move through keypad buttons in DOM order.
- Tabbing should not alter the current input state or cursor position.

### 4) App-Level Key Conventions
- Enter always means Roll.
- Escape always means Clear.
- These rules apply consistently regardless of whether focus is on:
  - the pseudo input
  - a keypad button
  - the hamburger menu
  - or elsewhere in the app

### 5) Hamburger Menu Accessibility
- The hamburger menu should support standard keyboard behavior:
  - Tab to focus
  - Space to open/select/activate
- When the menu is closed, Tab should not move through hidden menu items.
- When the menu is open, Tab should move only through the menu’s focusable controls.
- Add a small close button in the upper-right corner of the menu that is reachable by Tab.

### 6) Accessibility Semantics
- The pseudo input should communicate that it is the active editing surface.
- Keypad buttons should preserve native button semantics.
- The menu and its close control should be keyboard understandable and visibly focusable.

---

## Questions and Decisions

### 1) Should focus return to the last active keypad button after activation?
**No.**  
Focus should stay where it is.

If the user tabs to a keypad button, presses Space, and activates it, focus should remain on that same button. That is the most predictable behavior and feels closest to native button interaction.

### 2) Should Enter roll even when a keypad button is focused?
**Yes.**  
Enter should always roll, regardless of focus state.

This keeps the app’s default action consistent and avoids mode-specific exceptions.

### 3) Should the pseudo input expose stronger textbox-like semantics?
**Yes — expose textbox-like semantics where practical.**  
That means the pseudo input should present itself to assistive technologies as an editable text-entry surface, not just as a generic focusable region.

In plain terms:
- a custom focusable surface says “you can focus me”
- textbox-like semantics say “this is where text is entered”

That better matches the user’s mental model in keypad mode.

---

## Acceptance Criteria

- Add: Pseudo input focus
- Add: Accessibility semantics to pseudo input 
- Add: Space activates focused keypad buttons in keypad mode
- Add: Hamburger menu is keyboard-usable, including close access from the keyboard with addition of "X" close button
- Tab order remains unchanged
- Enter still rolls everywhere
- Escape still clears everywhere
- Keypad mode feels closer to keyboard mode without changing the underlying UI model


This gives the biggest usability win with the smallest behavior change.