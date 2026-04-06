# **PRD: RPG Dice Roller Negative Modifiers & Floors / Positive Modifiers & Ceilings**

## **1\. Objective**

Provide a mathematically symmetric and transparent system for calculating and displaying dice results that involve modifiers and their respective limits (**Floors** for penalties, **Ceilings** for bonuses) using a compact, mobile-friendly notation.

---

## **2\. Input Notation & Validation**

The parser identifies logic based on whitespace (Aggregation vs. Distribution) and a third numerical parameter (The Limit).

**A. Core Patterns**

* **Distributed (NdX-M-F or NdX+M+C):** Limit applied to **each** individual die.  
* **Aggregated (NdX \-M-F or NdX \+M+C):** Limit applied to the **final sum**.

**B. Validation (The "Symmetry Rule")**

To prevent illogical or redundant inputs, the third parameter must match the operator of the second. Any "Mixed" notation is flagged as a **Notation Error**.

* **Valid:** 3d6-5-1 (Penalty with a Floor) or 3d6+5+10 (Bonus with a Ceiling).  
* **Error:** 3d6+5-1 or 3d6-5+10 (Throws "Invalid Operator for Limit").

---

**3\. Mathematical Logic**

| Mode | Notation | Calculation |
| :---- | :---- | :---- |
| **Penalty (Floor)** | 3d4-3-1 | ![][image1] |
| **Bonus (Ceiling)** | 3d4+3+5 | ![][image2] |

---

## **4\. UI/UX Requirements**

**A. The Hybrid "Rolls" Display**

To ensure transparency without extra menus, each die result in the "Rolls" box must show the **Game Result** and the **Raw Math**.

* **Format:** Result=\[Die Operator Modifier\]  
* **Indicators:**  
  * \* (Asterisk) \= Result was **raised** to the Floor.  
  * ^ (Caret) \= Result was **lowered** to the Ceiling.  
* **Example (Distributed 3d4-3-1 rolls 4, 1, 2):**

**Rolls:** 1=\[4-3\] 1\*=\[1-3\] 1\*=\[2-3\]

* **Example (Distributed 3d4+3+5 rolls 4, 1, 2):**

**Rolls:** 5^=\[4+3\] 4=\[1+3\] 5=\[2+3\]

**B. The Aggregated Math Summary**

For aggregated rolls (those with a space), show the calculation once near the **Total**.

* **Example (4d6 \+5+20):**

**Total: 20^**  
 **Math:** (17) \+ 5 \= 20^  
 **Rolls:** 6 5 4 2

**C. The Dual-Range Display**

Display both the "Game Reality" and the "Raw Math" for player context.

* **Range (Limit):** Potential outcomes after Floor/Ceiling application (e.g., 3–3).  
* **Range (Abs):** Pure mathematical potential (e.g., \-6 to 3).

---

**5\. Technical UI Standards**

* **High Density:** For large sets (e.g., 300d4), use a wrapping grid of math-units (e.g., 1\*=\[1-3\]).  
* **Visual Hierarchy:**  
  * **Primary Color:** The **Result** (the number that counts toward the total).  
  * **Muted Color:** The **\[Math\]** in brackets.

 

 

 

 

---

## **6\. Logic Summary Table**

| Input | Mode | Result Type | Visual Indicator |
| :---- | :---- | :---- | :---- |
| 3d4-5-1 | Distributed | Capped at 1 | 1\*=\[2-5\] |
| 3d4+5+8 | Distributed | Capped at 8 | 8^=\[4+5\] |
| 3d4 \-5-1 | Aggregated | Sum capped at 1 | Total: 1\* |
| 3d4 \+5+20 | Aggregated | Sum capped at 20 | Total: 20^ |

 

## **7\. Default Behavior (No Limit Specified)**

When the third parameter is omitted, the app defaults to **Raw Mathematical Totals** to support the widest variety of RPG systems (e.g., those using "Degrees of Failure" or "Unlimited Power").

* **Logic:** If no second hyphen exists (e.g., 3d6-5 or 3d6 \+10), the limit is set to   
* **Result Display:** Results are calculated and displayed using pure math, even if they result in negative numbers or extremely high totals.  
* **Visuals:** No indicators (\* or ^) or "Range (Limit)" fields are shown.

**Examples:**

| Input | Mode | Result | UI Display |
| :---- | :---- | :---- | :---- |
| **3d4-5** | Distributed | \-2, \-4, \-3 | Rolls: \-2=\[3-5\] \-4=\[1-5\] \-3=\[2-5\] |
| **3d4 \+10** | Aggregated | 17 | Total: 17 |

**This ensures the app remains a "Standard Calculator" first, and a "Rule-Specific Engine" only when explicitly commanded.**

## **8\. Keyboard Enhancement**


|           |   |       |
|:---------:|:-:|:-----:|
|     1     | 2 |   3   |
|     4     | 5 |   6   |
|     7     | 8 |   9   |
|     d     | 0 |  [_]  |
|     -     | + |   !   |
|     ←     | ⌫ |   →   |
| Roll Dice |   | Clear |

[image1]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAApJREFUeF5jYAAAAAIAAd6ej78AAAAASUVORK5CYII=>

[image2]: <data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABAQMAAAAl21bKAAAABlBMVEX///8AAABVwtN+AAAAAXRSTlMAQObYZgAAAApJREFUeF5jYAAAAAIAAd6ej78AAAAASUVORK5CYII=>