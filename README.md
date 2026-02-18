# 🎲 Die! By the Browser

### *Velocity-First Dice Rolling*
A free (in all senses), lightweight, zero-dependency, single-file web utility designed for tabletop RPG players who prioritize speed over 3D animations. [Seeing](https://colinkershaw.github.io/die-by-the-browser/) is believing!

---

## 🚀 The Vision: Why this exists

**Die! By the Browser** was born from a vision of a "simple HTML app" that solves the "Input Velocity" problem. By utilizing a custom-built virtual keypad designed specifically for dice notation on small touchscreen devices, it acts like a calculator for your tabletop sessions — getting you the results as fast as your thumbs can move. Physical keyboards are also supported for maximum utility on the maximum number of devices.  

## ✨ Key Features

* **Custom Virtual Keypad**: Optimized for mobile devices by using a "text input that isn't a text input" strategy. This prevents the native mobile keyboard from popping up, allowing for rapid-fire entry of number of dice, "d", and die size on a custom calculator-style keypad.
* **Deep-Link State**: The app synchronizes your input with the URL hash whenever you roll the dice. You can bookmark favourite combinations or share a link to a specific configuration with your party.
* **Zero Dependencies**: Written in pure vanilla JavaScript, CSS, and HTML. No frameworks, no trackers, and no external requests.
* **Offline by Design**: As a single self-contained file, it is naturally offline-compatible. It works in basements, on planes, or in convention centers with zero connectivity. It's also a Progressive Web App (PWA) so downloading on mobile devices is seamless.
* **User Agency (View-Mode Overrides)**: Includes a manual override menu to force "Mobile Mode" on tablets or "Desktop Mode" on phones, ensuring the user — not the device — can choose the interface.
* **Integrated Test Suite**: Features a built-in headless test runner to ensure logic integrity and state persistence across all platforms.

## 🛠 Technical Highlights

* **Namespace Architecture**: Organized as a modular `DiceApp` object to ensure clean separation of concerns between state management, UI rendering, and parsing logic.
* **State-to-URL Sync**: A bidirectional synchronization logic that ensures the UI, the internal state, and the browser's navigation history stay aligned.
* **Tokenizer-Parser-Validator-Executor Architecture**: DiceCore implements a robust multi-stage pipeline for dice notation processing (PRD#1).
* **Dual-Input Sync**: Sophisticated event handling maintains cursor position and string integrity whether using a physical keyboard or the custom virtual keypad.

## 🧪 DiceCore API (PRD#1 Implementation)

DiceCore is a comprehensive dice notation engine supporting batching, aggregation/distribution, modifiers, and limits. It exposes a clean functional API using the Result/Either pattern.

### API Functions

```javascript
// Tokenize input into tokens with position tracking
DiceCore.tokenize(input) → Result(tokens)

// Parse input/tokens into Abstract Syntax Tree
DiceCore.parse(input) → Result(AST)

// Validate AST with business rules (Symmetry Rule, caps, etc.)
DiceCore.validate(input) → Result(validatedAST)

// Execute validated AST to roll dice
DiceCore.execute(input, rng?) → Result(executionResult)

// Result helpers
DiceCore.Ok(value)           // Create success result
DiceCore.Err(error, meta)    // Create error result
DiceCore.isOk(result)        // Check if result is Ok
DiceCore.isErr(result)       // Check if result is Err
DiceCore.andThen(result, fn) // Chain result operations
```

### Supported Notation (PRD#1)

| Notation | Example | Description |
|----------|---------|-------------|
| Simple dice | `3d6` | Roll 3 six-sided dice |
| Distributed modifier | `3d6+2` | Add 2 to each die (no space before +) |
| Aggregated modifier | `3d6 +2` | Add 2 to total sum (space before +) |
| Distributed with floor | `3d4-2-0` | Subtract 2 from each die, minimum 0 |
| Aggregated with ceiling | `3d6 +5+20` | Add 5 to sum, maximum 20 |
| Batching | `3 3d6` | Roll 3d6 three separate times |
| Batched distributed | `2 3d4-2` | Repeat "3d4-2" twice |
| Batched aggregated | `2 3d6 +5` | Repeat "3d6 +5" twice |
| Multiple collections | `3d6 2d10` | Roll multiple groups |

**Symmetry Rule**: Limits must match modifier operator (e.g., `-2-0` valid, `-2+0` invalid)

### Running Tests

**Browser Console:**
```javascript
window.runDiceCoreTests()
// Returns: { total: 34, passed: 34, failed: 0, results: [...] }
```

**Node.js:**
```bash
node tests/run-dicecore-tests.mjs
```

**Playwright CI:**
```javascript
const results = await page.evaluate(() => window.runDiceCoreTests());
expect(results.failed).toBe(0);
expect(results.passed).toBe(34);
```

### Example Usage

```javascript
// Simple roll
const result1 = DiceCore.execute('3d6');
// result1.value = { collections: [...], totalValue: 10, ... }

// Aggregated with ceiling
const result2 = DiceCore.execute('4d6 +5+20');
// result2.value = { collections: [...], absoluteRange: {...}, effectiveRange: {...} }

// Batching
const result3 = DiceCore.execute('3 3d6');
// result3.value.collections[0].groups = [3d6 result, 3d6 result, 3d6 result]

// Custom RNG for testing
const seedRng = () => 0.5;  // Always return 0.5
const deterministicResult = DiceCore.execute('3d6', seedRng);
```

## 📜 License: AGPLv3 (The "Pay It Forward" Shield)

This project is licensed under the **GNU Affero General Public License v3**.

I chose this license specifically to ensure that this tool remains a shared community resource. It follows a **Reciprocity** model:

1.  **Free to use**: Anyone can use, host, and share this tool.
2.  **Free to modify**: Anyone can modify this tool, and share those modifications with the community. 
3.  **Pay It Forward**: Whether hosting it on a network or distributed via other means, modifications to this code are legally required to be shared back with the community.
4.  **No "Closed" Commercialization**: This prevents the logic from being locked away in a proprietary "Pro" version without contributing to the open-source original.

---
*Created with the philosophy that utility should never be sacrificed.*
