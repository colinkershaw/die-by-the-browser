# **PRD 2.7: AST & OO Refactor**

### Keep / Drop Refactor

#### Towards OO

Alan Kay would probably **stop asking “what branch should this helper use?”** and instead ask:

> **What object should know this?**

Right now, `filterAction` and `filterDirection` are inert strings, so some distant helper has to interpret their combined meaning. That’s the clunkiness. The knowledge is smeared across the code.

An Alan Kay-ish move would be to make the **filter rule** into a small object/message receiver that can answer questions like:

- “Which dice do you drop?”
- “Which dice do you keep?”
- “What direction should retained dice be presented?”
- “What default sort should the UI use?”

In other words, don’t make the sort helper reason about `keep/drop + high/low`. Let the **filter policy** answer.

Conceptually:

```javascript
const filter = FilterRule.fromNotation(filterAction, filterDirection, filterCount);

const sortState = filter.defaultSortState();
```


Then the rule itself contains the meaning:

```javascript
class FilterRule {
  constructor(action, targetDirection, count) {
    this.action = action;
    this.targetDirection = targetDirection;
    this.count = count;
  }

  hasFilter() {
    return Boolean(this.action && this.targetDirection && this.count);
  }

  retainedDirection() {
    if (!this.hasFilter()) return 'original';

    return this.action === 'keep'
      ? this.targetDirection
      : Direction.opposite(this.targetDirection);
  }

  defaultSortState() {
    return Direction.toSortState(this.retainedDirection());
  }
}
```


With tiny direction behavior:

```javascript
const Direction = {
  opposite(direction) {
    return direction === 'high' ? 'low' : 'high';
  },

  toSortState(direction) {
    if (direction === 'high') return 'desc';
    if (direction === 'low') return 'asc';
    return 'original';
  }
};
```


The key idea is to rename the current `filterDirection` mentally as something more precise:

> `filterDirection` is not “sort direction”.  
> It is the **target direction** of the filter action.

So:

| Notation | Action | Target direction | Retained direction | Default sort |
|---|---|---|---|---|
| `++` | keep | high | high | desc |
| `+-` | keep | low | low | asc |
| `--` | drop | low | high | desc |
| `-+` | drop | high | low | asc |

That’s the clean universal rule:

> **Default sort follows retained direction.**

If you don’t want a class yet, a lighter version is to at least make the domain concept explicit:

```javascript
_getDefaultSortState(filterAction, filterTargetDirection, filterCount) {
  if (!filterAction || !filterTargetDirection || !filterCount) return 'original';

  const retainedDirection = this._getRetainedDirection(filterAction, filterTargetDirection);
  return this._directionToSortState(retainedDirection);
},

_getRetainedDirection(filterAction, filterTargetDirection) {
  return filterAction === 'keep'
    ? filterTargetDirection
    : this._oppositeDirection(filterTargetDirection);
},

_oppositeDirection(direction) {
  return direction === 'high' ? 'low' : 'high';
},

_directionToSortState(direction) {
  return direction === 'high' ? 'desc' : 'asc';
},
```


That’s probably the pragmatic “today” version.

The more Kay-ish “objects all the way down” version would be:

```javascript
filter.defaultSortState()
```


Because the filter knows what it means. The dice engine shouldn’t keep asking strings what they are. It should send messages to little objects that know how to answer.

#### Symmetry

The better abstraction: 

**Keep/Drop are not two fundamentally different operations.** They’re two ways (like addition vs subtraction) of naming the same partition:

> Choose one side of a sorted set as **active/kept**, and mark the other side as **dropped**.

So instead of thinking:

```plain text
action = keep/drop
direction = high/low
```


think:

```plain text
selected side = high/low
selected count = N
selected side meaning = kept or dropped
```


Then normalize everything into one internal concept:

> **Which side is kept?**

Once you know the **kept side**, default sorting is trivial:

```plain text
kept high → desc
kept low  → asc
```


That means notation parsing can keep the user-facing concepts, but compute logic should canonicalize them.

#### Canonical filter model

| Notation | User phrase | Equivalent canonical meaning | Default sort |
|----------|-------------|------------------------------|--------------|
| `++N`    | keep N high | keep high                    | desc         |
| `+-N`    | keep N low  | keep low                     | asc          |
| `--N`    | drop N low  | keep remaining high          | desc         |
| `-+N`    | drop N high | keep remaining low           | asc          |

The only wrinkle is that `drop N low` is not exactly `keep N high`; it is:

```plain text
drop N low === keep totalCount - N high
```


So the canonical form may need the roll count to fully normalize the count. But for default sorting, you don’t need the count — only the kept side.

#### Practical implementation idea

Instead of `_getDefaultSortState(filterAction, filterDirection, filterCount)`, use a helper that speaks the domain:

```javascript
_getKeptDirection(filterAction, filterDirection, filterCount) {
  if (!filterAction || !filterDirection || !filterCount) return null;

  const keepsTargetDirection = filterAction === 'keep';
  if (keepsTargetDirection) return filterDirection;

  return this._oppositeDirection(filterDirection);
},

_getDefaultSortState(filterAction, filterDirection, filterCount) {
  const keptDirection = this._getKeptDirection(filterAction, filterDirection, filterCount);
  if (!keptDirection) return 'original';

  return keptDirection === 'high' ? 'desc' : 'asc';
},

_oppositeDirection(direction) {
  return direction === 'high' ? 'low' : 'high';
},
```


That is less clunky because the special case is no longer “drop sort is reversed.” The rule is:

> **Drop targets the side to remove; Keep targets the side to retain. Normalize both to the retained side.**

#### Even cleaner naming

If you’re willing to rename internals over time:

```javascript
filterAction       → filterOperator
filterDirection    → filterTargetDirection
```


Because `direction` alone is ambiguous. It is **not** the display direction. It is the direction being operated on.

So:

```javascript
filterOperator: 'keep' | 'drop'
filterTargetDirection: 'high' | 'low'
```


Then:

```javascript
_getKeptDirection(filterOperator, filterTargetDirection, filterCount)
```


reads beautifully.

#### Kay-ish object version

The small-object version would be:

```javascript
const filter = FilterSelection.from(filterAction, filterDirection, filterCount, rollDetails.length);

filter.applyTo(rollDetails);
const sortState = filter.defaultSortState();
```


Where the object internally normalizes:

```javascript
class FilterSelection {
  keptDirection() {
    return this.operator === 'keep'
      ? this.targetDirection
      : Direction.opposite(this.targetDirection);
  }

  defaultSortState() {
    return Direction.toSortState(this.keptDirection());
  }
}
```

### But Not Now

That would be the direction to evolve toward. **But for now, extracting `_getKeptDirection()` is probably the best small refactor: it captures your insight without dragging the whole dice engine into a class rewrite.**

## Assessment and Thoughts

This assessment is excellent. You have correctly identified the "code smell" (logic smeared across the system) and proposed a solution that moves the architecture from **procedural data processing** to **true object-oriented messaging**.

Here is an assessment of your proposal across three dimensions: Philosophical, Domain Logic, and Practical Implementation.

### 1. The Philosophical Assessment: "Messaging over Inspection"
Your reference to Alan Kay is highly appropriate. In the current `die-by-the-browser.html` code, the UI or the engine has to "interrogate" the state: *"Are you a drop? Are you high? Okay, then I will do X."*

By moving to a `FilterRule` object, you shift the responsibility. Instead of the system asking the data what it is, the system tells the object what it wants: *"Give me the default sort state."*


This reduces **coupling**. If you later add a new filter type (e.g., "Cap at value" or "Explode values"), you only modify the Filter object, not the branching logic in the UI renderers or the dice engine.

### 2. The Domain Logic: The "Kept Direction" Insight
The most valuable part of your assessment is the **normalization of Keep and Drop**.

In most dice systems, "Drop Low" and "Keep High" are treated as distinct logic branches. However, as you noted, they both describe the same outcome: **The high values are the ones the user cares about.**

| Notation | Action | Target | **Kept Side** | **Logic** |
|:---------|:-------|:-------|:--------------|:----------|
| `kh`     | Keep   | High   | **High**      | Direct    |
| `dl`     | Drop   | Low    | **High**      | Inverse   |
| `kl`     | Keep   | Low    | **Low**       | Direct    |
| `dh`     | Drop   | High   | **Low**       | Inverse   |

By calculating the `keptDirection`, you create a "Source of Truth" for the UI. If `keptDirection === 'high'`, the UI should almost always default to `descending` (showing the "winners" first). This eliminates the "clunkiness" of the `+-` logic you identified.

### 3. Practical Implementation: "Today" vs. "The Future"

#### The "Pragmatic Today" Version
Your proposed helper functions (`_getKeptDirection`, `_directionToSortState`) are a significant upgrade over the existing logic. They create a **Domain Language** within the script. Even without a class, using these names makes the code self-documenting.

#### The "Kay-ish" Version (Recommended)
Given that `die-by-the-browser.html` is a self-contained tool, the `FilterRule` class (or even a factory function returning a literal) is actually more "pragmatic" than it looks.

Instead of passing three separate variables (`filterAction, filterDirection, filterCount`) through the call stack of `DiceApp.engine`, you would pass a single `filter` object.

**Refinement on your `FilterSelection` idea:**
Since the `filterCount` is needed to actually perform the filtering, but not to determine the *direction*, your object perfectly encapsulates that "knowledge."

```javascript
// A Kay-ish implementation for the current engine
const filter = {
  operator: action, // 'keep' | 'drop'
  target: direction, // 'high' | 'low'
  count: count,
  
  get keptDirection() {
    if (!this.operator) return null;
    return this.operator === 'keep' ? this.target : (this.target === 'high' ? 'low' : 'high');
  },
  
  get defaultSort() {
    const direction = this.keptDirection;
    if (direction === 'high') return 'desc';
    if (direction === 'low') return 'asc';
    return 'original';
  }
};
```

### 4. Naming: The Final Polish
Your suggestion to rename `filterDirection` to `filterTargetDirection` is vital. In the current codebase, "direction" is overloaded (it could mean sort direction, filter direction, or text direction).

* **`filterTargetDirection`**: Which side of the dice pool are we looking at?
* **`sortDirection`**: How are we displaying them?

### Conclusion
Your assessment is **Correct and High-Value**.

If you apply this, you move the app from a "calculator" mindset (processing numbers) to a "simulator" mindset (objects interacting with rules). It turns a 4-way conditional branch into a simple, elegant derivation: **"Sort follows the kept side."**

## Additional Filters Types Already Exist?

Based on the source code of `die-by-the-browser.html`, both **Explode values** and **Cap at value** (implemented as Floor/Ceiling) already exist in the application's logic.

### 1. Explode Values (`!` and `!!`)
The code already handles two types of "exploding" mechanics:
* **Standard Explosion (`!Y`)**: When a die rolls a value equal to or greater than the threshold `Y`, a new die is rolled and added to the pool.
* **Compound Explosion (`!!Y`)**: Similar to standard, but the additional rolls are added together into a single "compound" result for that die entry.
* **Thresholds**: Users can specify a threshold (e.g., `3d6!!3` explodes on a 3 or higher). If omitted (e.g., `2d6!`), it defaults to the maximum value of the die.
* **Safety Limits**: The engine includes a `MAX_EXPLOSION_ITERATIONS` (set to 20) to prevent infinite loops from exploding dice.

### 2. Cap at Value (Floor and Ceiling)
While not called a "filter," the "Cap at value" logic is implemented through **Floor and Ceiling limits** that can be applied to both individual dice and the total sum:
* **Floor (`-F`)**: Caps a value so it cannot fall below a certain number.
* **Ceiling (`+C`)**: Caps a value so it cannot exceed a certain number.
* **Visual Indicators**: The UI specifically supports these with CSS classes like `die-clamp-floor` (underlined) and `die-clamp-ceiling` (overlined) to show the user that a result was capped.
* **Example Notation**: `3d6-M-F+C` allows for a modifier (`M`) with both a floor (`F`) and a ceiling (`C`) limit.

### Current "Filter" Architecture
As you noted in your assessment, the code currently treats `keep` (`++`) and `drop` (`--`) as its primary "filter" actions. Your proposed refactor would be particularly useful if you wanted to move the "Explode" or "Cap" logic out of the core rolling/modifier loop and into a more formal "Policy" or "Filter" object that dictates how results are processed after the initial roll.

## Towards AST

The current code for `die-by-the-browser.html` **does not use an Abstract Syntax Tree (AST) model**.

Instead, it employs a **procedural, token-based parser** that produces a flat list of configuration objects. Here is a breakdown of how the current model compares to an AST:

### 1. Parsing Logic
An AST-based parser typically uses a formal grammar to build a recursive tree structure where nodes represent operations (e.g., an "AddNode" with two "DiceNodes" as children).

The current code:
* **Tokenizes** the input string by splitting it into space-separated strings (e.g., `"3d6 4d12"` becomes `["3d6", "4d12"]`).
* **Iterates** through these tokens linearly.
* **Scans** each token character-by-character using an index pointer (`idx`) and manual state checking to extract values like `count`, `sides`, and `modifiers`.

### 2. Output Data Structure
An AST would result in a nested tree. The current parser results in a **linear array of flat objects** called `collections`. Each object in this array is a "group" that contains all the parameters needed for that specific roll:

```javascript
// The current "flat" model for a token like "3d6!++2"
const group = {
  count: 3,
  sides: 6,
  explodeMode: 'standard',
  filterAction: 'keep',
  filterDirection: 'high',
  filterCount: 2,
  modifier: 0,
  // ...other flat properties
};
```


### 3. Execution (The "Rolling" Phase)
Because there is no tree, the engine does not "walk" the structure to evaluate results. Instead, it loops through the `collections` array and processes each group one by one in a strictly sequential manner.

### Summary
* **Current Model**: Procedural/Sequential. It treats the notation as a list of independent instructions.
* **AST Model**: Hierarchical/Recursive. It would treat the notation as a mathematical expression where the order of operations and relationships between nodes are defined by the tree structure.

The lack of an AST is why your earlier assessment regarding the "smeared knowledge" was so relevant; without a formal model (like an AST or the "Kay-ish" objects you proposed), the logic for interpreting these flat strings must be repeated or explicitly handled in various parts of the engine.

## Towards Both AST and OO

It is **both**, but they solve the "clunkiness" at different layers of the software's architecture.

The "direction" problem is a perfect intersection of **Structure** (how we represent the user's intent) and **Behavior** (how that intent calculates its own meaning).

### 1. The AST Question: Structure
The current parser is "flat." It reads `2d20++h` and fills out a checklist of variables: `count: 2, sides: 20, action: keep, direction: high`.

If you moved to an **AST (Abstract Syntax Tree)**, you would be changing the *structure* of how the app thinks. Instead of a list of variables, the parser would produce a tree. In an AST, "Direction" isn't just a string; it’s a node in a relationship.



* **Why an AST helps:** It would allow you to handle more complex "directions." For example, if you wanted to support `keep (high 2 + low 1)`, a flat parser would break. An AST would naturally represent that nesting.

### 2. The OO Question: Behavior (The "Kay-ish" Move)
Your proposal for a `FilterRule` object is a classic **Object-Oriented** solution. This addresses the "clunkiness" not by changing how the string is parsed, but by changing where the **knowledge** lives.

In the current code:
* **Knowledge is Smeared:** The Engine has to know the "Logic Table" of how `keep` + `high` affects the sort order.
* **The Engine is "God":** It inspects passive data and makes decisions.

In your OO proposal:
* **Knowledge is Encapsulated:** The `FilterRule` object is the only thing in the universe that knows how "direction" affects "sorting."
* **Messaging:** The Engine just says, "Hey Filter, what's the sort order?" It doesn't care *why* or *how* the filter decided.



### 3. Where they meet: The "Interpreter" Pattern
In the most elegant "Kay-ish" systems, the **AST nodes are the Objects.** If you combined both, your parser would create a `KeepFilter` object. That object wouldn't just hold data; it would possess the logic to:
1.  Filter the dice.
2.  Determine the display direction.
3.  Calculate the total.

### Summary: Which one is it?
* **The "Clunkiness" you feel is an OO problem.** You are tired of the Engine having to "reach inside" the data to figure out what to do. Moving that logic into a `FilterRule` object (even without an AST) fixes the clunkiness immediately.
* **The "Simplicity" of the current code is an AST limitation.** The current code can't do complex math or nested logic because it doesn't have a tree structure to hold it.

**Conclusion:** You are solving an **OO problem** (Behavior) to fix the immediate mess, but your intuition about "Keep/Drop being the same thing" is actually the first step toward building a better **AST** (Structure). You are identifying that "Filter" is a high-level concept that can be modeled as a single node in a tree.