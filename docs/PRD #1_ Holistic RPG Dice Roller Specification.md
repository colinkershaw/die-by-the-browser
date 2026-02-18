# **PRD \#1: RPG Dice Roller – Batching, Modifiers, and Limits**

## **1\. Objective**

Provide a mathematically symmetric and transparent system for calculating and displaying dice results. This system handles **Batching** plus **Aggregation and Distribution** with **Mathematical Limits** (Floors and Ceilings) using a compact notation where whitespace serves as a functional operator.

## **2\. The "Whitespace Parentheses" Logic**

To simplify the user's mental model and the developer's parser logic, whitespace is explicitly defined as a grouping mechanism that mimics parentheses.

### i. **No Space (Distributed):**
The modifier is "inside" the dice expression, applied to every die.
* `3d4-2-0` is interpreted as: `3(d4 - 2 [floor 0])`
    * Precise math notation: `Σ[1..3](d4 - 2 [floor 0])`
    * or fully expanded `(d4 - 2 [floor 0]) + (d4 - 2 [floor 0]) + (d4 - 2 [floor 0])`

### ii. **With Space (Aggregated):**
The whitespace acts as a set of parentheses around the dice group
* `3d4 -2-0` is interpreted as: `(3d4) - 2 [floor 0]`
    * Precise math notation: `(Σ[1..3]d4) - 2 [floor 0]`
    * or fully expanded `(d4 + d4 + d4) - (2 [floor 0])`

### iii. **With Space (Batching):**
The whitespace acts as a set of parentheses around the dice group; the whole is a collection
* `3 3d6` is interpreted as: `3(3d6)`
    * or fully expanded the collection is composed of 3 groups:
        * group 1 `(d6 + d6 + d6)`
        * group 2 `(d6 + d6 + d6)`
        * group 3 `(d6 + d6 + d6)`

### iv. **With Space and No Space (Batching and Aggregated):**
The whitespace acts as a set of parentheses around the dice group; the whole is a collection
* `2 3d4-2-0` is interpreted as: `2(3d4 - 2 [floor 0])`
    * Precise math notation: `Repeat(2, Σ[1..2](d4 - 2 [f0]))`
    * or expanded the collection is 2 groups:
        * group 1 `(d4 - 2 [floor 0]) + (d4 - 2 [floor 0]) + (d4 - 2 [floor 0])`
        * group 2 `(d4 - 2 [floor 0]) + (d4 - 2 [floor 0]) + (d4 - 2 [floor 0])`

### v. **With Space (Batching and Distributed):**
The whitespace acts as a set of parentheses around the dice group; the whole is a collection
* `2 3d4 -2-0` is interpreted as: `2(3d4 - 2 [floor 0])`
    * Precise math notation: `Repeat(2, (Σ[1..3]d4) - 2 [f0])`
    * or expanded the collection is 2 groups:
        * Group 1: `(d4 + d4 + d4) - 2 [floor 0]`
        * Group 2: `(d4 + d4 + d4) - 2 [floor 0]`

### vi. **Collections:**
The whitespace acts as a set of parentheses around the dice group; there are multiple collections
* `3 3d6 2 3d4 -2-0 3d4-2-0 2d10` is interpreted as 3 collections:
    * `3 3d6` collection 1 interpretted as`3(3d6)`
        * composed of 3 groups:
            * group 1.1 `3d6`
            * group 1.2 `3d6`
            * group 1.3 `3d6`
    * `2 3d4 -2-0` collection 2 interpretted as `2((3d4) - 2 [floor 0])`
        * composed of 2 groups:
            * group 2.1 `(3d4) - 2 [floor 0]`
            * group 2.2 `(3d4) - 2 [floor 0]`
    * `3d4-2-0` collection 3 interpretted as `3(d4 - 2 [floor 0])`
        * composed of 1 group:
            * group 3.1 `3(d4 - 2 [floor 0])`
    * `2d10` collection 4
        * composed of 1 simple group:
            * `2d10`

### Summary Table for Parser Logic

| Input Style | Example  | Logic Name    | Math Equivalent    |
|-------------|----------|---------------|--------------------|
| AdX-K       | 3d4-2    | Distributed   | `∑i=1A(dXi−K)`     |
| AdX -K      | 3d4 -2   | Aggregated    | `(∑i=1AdXi)−K`     |
| N AdX-K     | 2 3d4-2  | Batched Dist. | `N×[∑i=1A(dXi−K)]` |
| N AdX -K    | 2 3d4 -2 | Batched Aggr. | `N×[(∑i=1AdXi)−K]` |

## **3\. Input Notation & Validation**

### **A. Core Patterns**

* **Batching (N \[Roll\]):** A leading integer followed by a space performs the subsequent roll string N times.
    * *Example:* 3 3d4 (Rolls 3d4 three separate times).
* **Distributed (NdX-M-F or NdX+M+C):** No space before the operator. The modifier and limit are applied to **each** individual die.
* **Aggregated (NdX \-M-F or NdX \+M+C):** A space before the operator. The modifier and limit are applied to the **final sum**.

### **B. Validation (The "Symmetry Rule")**

To prevent illogical inputs, the third parameter (the Limit) must match the operator of the second (the Modifier).

* **Valid:** 3d6-5-1 (Penalty with a Floor) or 3d6+5+10 (Bonus with a Ceiling).
* **Error:** 3d6+5-1 or 3d6-5+10 (Throws "Invalid Operator for Limit").

## **4\. Mathematical Logic & Conversion**

The third parameter is a **Limit Value**, not a second modifier. The calculation is Result \= Clamp(Total \+ Modifier, Limit).

| Mode                    | Notation  | Math String Conversion    |
|:------------------------|:----------|:--------------------------|
| **Distributed Penalty** | 3d4-3-0   | Σ \[ max(0, die \- 3\) \] |
| **Aggregated Penalty**  | 3d4 \-3-0 | max(0, (Σ dice) \- 3\)    |
| **Distributed Bonus**   | 3d4+3+5   | Σ \[ min(5, die \+ 3\) \] |
| **Aggregated Bonus**    | 3d4 \+3+5 | min(5, (Σ dice) \+ 3\)    |

*Note: Limits (Floors/Ceilings) can be any integer, including 0 or negatives, provided they follow the Symmetry Rule.*

## **5\. UI/UX Requirements**

### **A. Visual Indicators**

* \* (Asterisk) \= Result was **raised** to the Floor.
* ^ (Caret) \= Result was **lowered** to the Ceiling.

### **B. The Hybrid Display (Distributed)**

Each die result must show the **Game Result** and the **Raw Math**.

* **Format:** Result=\[Roll+/-Modifier\]
* **Example (3d4-3-1 rolling 4, 1, 2):**
    * Rolls: 1=\[4-3\] 1\*=\[1-3\] 1\*=\[2-3\]

### **C. The Aggregated Math Summary & Range**

For aggregated rolls, show the calculation and the dual-range bounds.

* **Example (4d6 \+5+20):**
    * **Total: 20^**
    * **Math:** (17) \+ 5 \= 20^
    * **Range (Limit):** 3–20 (Effective outcomes after Floor/Ceiling)
    * **Range (Abs):** \-6 to 29 (Pure mathematical potential)
    * **Rolls:** 6 5 4 2

### **D. Batch Results Display**

When a Batch Command is used, results are stacked vertically. Batched rolls follow their respective Distributed or Aggregated display logic.

## **6\. Default Behavior (No Limit Specified)**

When the ceiling/floor parameter is omitted, the app defaults to **Raw Mathematical Totals**.

* **Logic:** If no second operator exists (e.g., 3d6-5), the limit is null.
* **Visuals:** Pure math is displayed. No indicators (\*, ^) or Range data are shown.

## **7\. Keyboard Enhancement**

The keypad is optimized for the high-frequency path (Numbers → d → Space).

**Layout:**

(ignore the empty header row)

|               |        |                      |
|:--------------|:-------|:---------------------|
| **1**         | **2**  | **3**                |
| **4**         | **5**  | **6**                |
| **7**         | **8**  | **9**                |
| **d**         | **0**  | **\[ \_ \] (Space)** |
| **\-**        | **\+** | **\!**               |
| **←**         | **⌫**  | **→**                |
| **Roll Dice** |        | **Clear**            |

* **Space Key:** Serves as the primary toggle for "Parentheses" (Aggregation) or "Batching".
* **Operators:** \-, \+, and \! are grouped together.


## **8\. Appendix: Naming Conventions**

### Grouping
There doesn't seem to be a community or gaming industry consensus on how to name groups of dice (eg, 3 x (6 x (3d6)) for 3 characters worth of D&D attributes). _**Die! By the Browser**_ uses the following hierarchy:

| Level | Name       | Precise Definition                                             | Example                                           | Eg                                           | 
|-------|------------|----------------------------------------------------------------|---------------------------------------------------|----------------------------------------------| 
| 1     | Die        | A single atomic geometric object.                              | `d6`                                              | base die                                     | 
| 2     | Group      | Two or more die treated as a single unit (technically "dice"). | `3d6` (or more complex `3d6+1`)                   | an attribute roll (or a roll with modifiers) |
| 3     | Collection | Two or more "Groups".                                          | `6 x (3d6)`                                       | a character                                  |
| 4     | Aggregate  | Two or more "Collections".                                     | `(6 x (3d6)), (6 x (3d6))` (or `3d6, 1d20, 2d10`) | a party (or just several dice rolls)         |

_The above acknowledges the fact that colloquially "dice" is used for both plural (correctly) and single die (incorrectly)._