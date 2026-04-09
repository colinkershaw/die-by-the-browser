# ![icon_readme_80.png](icon_readme_50.png) Die! By the Browser

A free, open-source dice roller for tabletop RPGs. Single HTML file — no frameworks, no dependencies, no internet required.

**[▶ Try it live (GitHub Pages)](https://colinkershaw.github.io/die-by-the-browser/die-by-the-browser.html#dice=3d6+2+4d8+3d20%2B1%2B17+3d100+-2-10+3d6%21+3d10%21%21+3d6%21%2B1%2B2+3d10%21%21%2B%2B2+3d6%2B-1+3d6%21%21--2+3d6-%2B1+100d100)**

**[⬇ Download die-by-the-browser.html](https://github.com/colinkershaw/die-by-the-browser/raw/main/die-by-the-browser.html)** *(Right-click → Save As)*

---

## 🌈 The Vision: Why this exists
_Die! By the Browser_ is a free (in all senses), lightweight, zero-dependency, single-file web application designed for tabletop RPG players who prioritize speed, volume, and privacy over 3D animations.  

A self-contained, single-file web application built with plain HTML, CSS, and vanilla JavaScript, there are no server calls, no tracking, no ads, no fees, and no external dependencies. You can download the file, save it to your filesystem or put it on a USB stick, and open it in a browser on your devices while offline: computers, tablets, phones. _Die! By the Browser_ will still be yours a decade from now.

A custom onscreen keypad optimizes entering dice notation on mobile devices without the native onscreen keyboard slowing down your typing by forcing you to switch between letters, numbers, and symbols screens. A custom dice notation is used to maximize features from this minimal keypad.

The URL stores your *input* on each roll (the dice notation you typed, not the roll results) so you can use normal bookmarks to quickly access various predefined setups any time. The browser's Backwards and Forwards history takes you through your input history in the current session.

---

## 🎲 Roll With It!

**Option 1 — Use it in a browser directly ([GitHub Pages](https://colinkershaw.github.io/die-by-the-browser/die-by-the-browser.html))** No setup. The input state is saved in the URL hash, so bookmarking a URL preserves your dice configuration.

**Option 2 — Download the HTML file** *(recommended)*  Save `die-by-the-browser.html` to your filesystem and open it locally. Works completely offline. The URL-based state persistence still works when opened as a `file://` URL, including bookmarking. PWA features (service worker, manifest) are intentionally disabled on `file://` — they're not needed.

**Option 3 — Install as a PWA**

When accessed via GitHub Pages (or any HTTPS host), the app can be installed as a Progressive Web App from your browser's menu. This is mainly provided as a convenience on mobile where saving an HTML file to the filesystem can be awkward for people who aren't power users. 
>Note: PWA responsiveness on iOS can be sluggish due to WebKit running single-threaded in PWA mode — the keypad in particular may feel slower than in a regular browser tab. Saving the HTML file to the filesystem remains the superior option where practical. Android devices seem much more responsive with PWAs.

---

## ✨ Features

- **Custom virtual keypad**: Optimized for entering dice notation on mobile without the native keyboard covering the screen. Uses a custom pseudo-input so the native keyboard never appears.
- **Physical keyboard support**: Full text input with cursor navigation for desktop use.
- **Auto-detection with manual override**: Automatically selects keypad or keyboard mode based on your device, but you can force either from the ☰ menu.
- **Fit to Width**: Removes padding and maximises screen use, accessible from the ☰ menu.
- **URL state persistence**: Your dice input is saved to the URL hash on each roll. Bookmark the URL to save a configuration. The results are not stored.
- **Batch rolls**: Roll the same expression multiple times in one go.
- **Distributed and aggregated modifiers**: Apply a modifier to each individual die, or to the final sum; controlled by whitespace.
- **Floors and ceilings**: Clamp individual die results or totals to a minimum or maximum value.
- **Exploding dice**: Standard (`!`) and compound (`!!`) explosions, with optional custom threshold.
- **Keep/drop filters**: Keep or drop the highest or lowest N dice from a roll (e.g. for advantage/disadvantage or D&D attribute generation).
- **Critical success/failure highlighting**: Maximum and minimum die results are visually highlighted.
- **Limits:** up to 100,000 dice, up to 1,000,000 sides, modifiers up to ±1,000,000.
> **Note About Thresholds**
> 
> The app does impose limits on input: up to 100,000 dice, up to 1,000,000 sides, and modifiers up to ±1,000,000. These simply exist to provide some upper bound on resource use, not to protect against "unresponsive page" warnings on all devices. The theory is you can push your device to its limit within these limits.  
> 
> Observed real-world performance (iPhone 12 mini, WebKit):
>
> - `100000d6` — roll completes in under 2 seconds
> - `10000d6+mod+limit` — roll completes in under 2 seconds
> - `100000d6+mod+limit` — crashes (DOM rendering of per-die modifier output is the bottleneck, not the computation)
> 
> Whereas a computer with 64 GB of RAM can easily load `100000d6+mod+limit` — and even larger results.
> 
>At the absolute maximums, a single browser tab can consume 1.3–1.5 GB of memory, and this is not artificially blocked by the app code — the limits are high enough that they serve as a reasonable ceiling rather than being lower and a barrier.
>
>The input field is the natural throttle: if a roll is too large for your device, type a smaller one. No separate user configuration setting for "max dice" exists because the input itself already provides that functionality.

---

## 🔣 Notation Reference

The input field accepts one or more space-separated dice expressions. Whitespace is a functional operator — it controls whether a modifier applies to each die individually or to the group total.

### Basic Roll

| Notation | Meaning |
|---|---|
| `NdX` | Roll N dice with X sides |
| `3d6` | Roll 3 six-sided dice |
| `1d20` | Roll one twenty-sided die |

### Multiple Groups

Separate expressions with a space to roll multiple independent groups in one go.

| Notation | Meaning |
|---|---|
| `3d6 4d12` | Roll 3d6 and 4d12 as separate results |
| `1d20 2d6 1d4` | Three independent rolls |

### Batch Rolls

A leading integer before a space repeats the expression that many times, showing each as a separate result.

| Notation | Meaning |
|---|---|
| `B NdX` | Roll `NdX` B times |
| `3 3d6` | Roll 3d6 three times (e.g. rolling three D&D attributes) |
| `6 3d6` | Roll 3d6 six times |

### Modifiers

**The whitespace rule:** No space before the modifier = *distributed* (applied to every die). Space before the modifier = *aggregated* (applied to the group total).

#### Distributed (no space — modifier applied to each die individually)

| Notation | Meaning |
|---|---|
| `NdX-M` | Subtract M from every die result |
| `NdX+M` | Add M to every die result |
| `3d4-2` | Roll 3d4, subtract 2 from each die |
| `3d4+1` | Roll 3d4, add 1 to each die |

#### Aggregated (space before modifier — modifier applied to the total)

| Notation | Meaning |
|---|---|
| `NdX -M` | Subtract M from the sum of all dice |
| `NdX +M` | Add M to the sum of all dice |
| `3d6 +5` | Roll 3d6, then add 5 to the total |
| `2d10 -3` | Roll 2d10, then subtract 3 from the total |

### Floors and Ceilings (Limits)

A third parameter clamps the result. The limit sign must match the modifier sign (the **Symmetry Rule**) — mixing signs is a notation error.

- Negative modifier (`-`) → floor (minimum value)
- Positive modifier (`+`) → ceiling (maximum value)

| Notation | Meaning |
|---|---|
| `NdX-M-F` | Distributed: each die result cannot go below F |
| `NdX+M+C` | Distributed: each die result cannot exceed C |
| `NdX -M-F` | Aggregated: the total cannot go below F |
| `NdX +M+C` | Aggregated: the total cannot exceed C |

**Examples:**

| Notation | Meaning |
|---|---|
| `3d4-3-1` | Roll 3d4; subtract 3 from each die; each result has a floor of 1 |
| `3d4+2+6` | Roll 3d4; add 2 to each die; each result has a ceiling of 6 |
| `3d4 -3-0` | Roll 3d4, then subtract 3 from total; total has a floor of 0 |
| `4d6 +5+20` | Roll 4d6, add 5 to total; total capped at 20 |

Results that were clamped to the floor are underlined; results clamped to the ceiling have an overline.

> **Symmetry Rule:** `3d6-5-1` is valid. `3d6+5-1` is a notation error (mixed signs).

### Exploding Dice

When a die rolls its maximum value (or meets a threshold), it is re-rolled and the extra roll is added. Results are displayed with a glow effect.

| Notation | Meaning |
|---|---|
| `NdX!` | Standard explode on max value |
| `NdX!!` | Compound explode on max value (all extra rolls sum into one die value) |
| `NdX!Y` | Standard explode when result ≥ Y (Y must be ≥ 2 and ≤ X) |

**Examples:**

| Notation | Meaning |
|---|---|
| `2d6!` | Roll 2d6; a 6 triggers another d6 |
| `2d6!!` | Roll 2d6; compound explode on 6 |
| `2d10!8` | Roll 2d10; explode on 8, 9, or 10 |

### Keep / Drop Filters

Keep or drop the highest or lowest N results from a roll. Uses a two-operator syntax (`++`, `+-`, `-+`, `--`).

| Notation | Action |
|---|---|
| `NdX++Y` | Keep the Y highest results |
| `NdX+-Y` | Keep the Y lowest results |
| `NdX-+Y` | Drop the Y highest results |
| `NdX--Y` | Drop the Y lowest results |

**Examples:**

| Notation | Meaning |
|---|---|
| `4d6--1` | Roll 4d6, drop the lowest — standard D&D attribute roll |
| `2d20++1` | Roll 2d20, keep the highest — advantage |
| `2d20+-1` | Roll 2d20, keep the lowest — disadvantage |
| `5d10-+2` | Roll 5d10, drop the 2 highest |

### Combining Features

Modifiers, limits, explosions, and filters can be combined. The order of evaluation is: **explode → filter → modifier → limit**.

| Notation | Meaning |
|---|---|
| `4d6--1 +2` | Roll 4d6, drop lowest, add 2 to total |
| `3 4d6--1` | Roll 3 sets of 4d6-drop-lowest |
| `2d6! -1-0` | Roll 2 exploding d6, subtract 1 from total, floor 0 |

### Placeholder / Input Hint

The input field shows `e.g., 3d6 2 3d4-2-0 4d6 +5+20` when empty.

---

## ⌨️ Input Modes

The ☰ (hamburger) menu gives access to:

| Setting | Description |
|---|---|
| **Auto (Responsive)** | Default. Uses onscreen keypad on touch devices, keyboard input on desktop. |
| **External Keyboard** | Forces text area input regardless of device. |
| **Onscreen Keypad** | Forces the custom keypad regardless of device. Useful on tablets. |
| **Fit to Width** | Removes container padding and fills the screen width. |

The onscreen keypad includes: digits 0–9, `d`, space (␣), `-`, `+`, `!`, left/right cursor navigation, backspace, Roll, and Clear.

---

## 🛠 Technical Notes

- **Architecture:** Single `DiceApp` namespace object with clean separation between state, UI, parsing, and rendering. All dice logic lives in a separate `DiceNotation` object (no DOM access).
- **Parser:** Tokenises input into an AST, then evaluates. Handles all notation variants described above.
- **URL sync:** Input state is stored in the URL hash (`#input=...`) and synchronised on each roll. Results are never stored in the URL.
- **PWA:** Service worker and manifest are included for HTTPS deployments. Both are automatically disabled when opening as a `file://` URL.
- **Built-in tests:** A headless test suite is embedded in the app. Run `DiceApp.tests.run()` from the browser console to execute it.
- **External tests:** Playwright UI tests are in the `tests/` directory in the GitHub repository.


---

## 📜 License: AGPLv3 (The "Pay It Forward" Shield)

This project is licensed under the **GNU Affero General Public License v3**.

I chose this license specifically to ensure that this tool remains a shared community resource. It follows a **Reciprocity** model:

1.  **Free to use**: Anyone can use, host, and share this tool.
2.  **Free to modify**: Anyone can modify this tool, and share those modifications with the community.
3.  **Pay It Forward**: Whether hosting it on a network or distributed via other means, modifications to this code are legally required to be shared back with the community.
4.  **No "Closed" Commercialization**: This prevents the logic from being locked away in a proprietary "Pro" version without contributing to the open-source original.

---