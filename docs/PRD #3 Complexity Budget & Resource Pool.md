# PRD #3: Complexity Budget & Resource Pool

## 1. Objective

Replace the current hard-coded `MAX_DICE_COUNT` cap with a unified **Complexity Budget** — a total iteration pool that all dice operations draw from. This allows the engine to support large simple rolls (e.g. `100000d6`) and deep recursive rolls (e.g. `100d6!!`) within the same safety envelope, trading quantity for complexity rather than imposing blunt per-feature caps.

---

## 2. Motivation

The current `MAX_DICE_COUNT: 100000` cap handles non-exploding dice safely but is insufficient once exploding dice are introduced:

- `50000d6!!` passes the current N check but could consume catastrophically more iterations if explosions run hot
- `100d6!!` is well within N limits but could in theory iterate up to `100 × 1000 = 100,000` times — equivalent in compute cost to `100000d6`
- The existing per-feature caps (`MAX_DICE_COUNT`, explosion iteration limit of 20) are disconnected and do not reason about total system load

A unified pool ensures that **all sources of iteration draw from the same budget**, making the safety model coherent and consistent regardless of roll composition.

---

## 3. Scope

### In scope
- Replace `MAX_DICE_COUNT` with a unified `MAX_COMPLEXITY` pool
- Implement three-stage gate: Gatekeeper, UI Opt-Out (render mode), Circuit Breaker
- Raise explosion iteration cap from current 20 to 1000 (per die, per PRD #2 safety rules)
- Partial result behaviour on circuit breaker trigger
- Warning display on budget exceeded

### Out of scope
- Summary view / threshold-based render mode switching (future PRD)
- `MAX_DIE_SIDES` — remains as independent guard (not iterative)
- `MAX_MODIFIER` — remains as independent guard (not iterative)
- Keep/Drop mechanics — filters already-rolled results, not iterative
- Limits/clamps — applied post-roll, not iterative

---

## 4. The Complexity Budget

### 4.1 Definition

The **Complexity Score** is the total number of discrete roll operations performed or anticipated across an entire roll expression. Every base die roll and every explosion iteration counts as exactly **1 unit**.

### 4.2 Budget Cap

`MAX_COMPLEXITY: 100000`

This is equivalent in compute cost to the current `100000d6` maximum — empirically observed to consume approximately 1.5GB of browser memory at peak on reference hardware (laptop, 64GB RAM). The budget is intentionally set at this level:

- Simple rolls: `100000d6` costs exactly 100,000 units — uses the full budget
- Exploding rolls: `100d6!!` costs 100 base units + explosion units drawn in-loop
- The budget is a *total* across all collections in a single roll expression

### 4.3 What Draws From the Pool

| Source | Units drawn |
|:---|:---|
| Each base die roll | 1 per die |
| Each standard explosion iteration (`!`) | 1 per re-roll |
| Each compound explosion iteration (`!!`) | 1 per re-roll |
| Modifiers, limits, clamps | 0 (post-roll, not iterative) |
| Keep/Drop filtering | 0 (filters existing results) |
| Die sides (`MAX_DIE_SIDES`) | 0 (affects value, not count) |

### 4.4 Multi-Collection Rolls

The pool is **global across all collections** in a single roll expression. For example:

- `10d6!! 10d6!!` — both collections draw from the same 100,000-unit pool
- `50000d6 50000d6` — total base cost is 100,000 units, exhausts the pool at the base roll stage

---

## 5. The Three-Stage Gate

### Stage 1 — The Gatekeeper (Pre-flight, Deterministic)

**When:** At parse/validate time, before any rolling begins.

**What it checks:** The deterministic component of complexity — base dice count only.

**Calculation:**
```
deterministicCost = Σ (collection.count × collection.batchCount)
```

**Action:** If `deterministicCost > MAX_COMPLEXITY`, reject immediately with error `COMPLEXITY_EXCEEDED`. No rolling occurs.

**Note:** Explosion cost is *not* included here — it is probabilistic and handled optimistically (see Stage 3). The Gatekeeper only catches rolls that are guaranteed over-budget from base dice alone.

---

### Stage 2 — The UI Opt-Out (Pre-flight, Render Decision)

**When:** After Gatekeeper passes, before DOM rendering begins.

**What it checks:** Whether the deterministic cost alone warrants switching render mode.

**Threshold:** `deterministicCost > 1000`

**Action:** Set `renderMode = 'summary'` — individual die cells are not rendered; only the total and math string are displayed. This prevents DOM paint becoming the bottleneck for large rolls regardless of whether the circuit breaker triggers.

**Note:** The full definition of summary view behaviour is deferred to a future PRD. For now, this flag is set but its rendering implications are minimal.

---

### Stage 3 — The Circuit Breaker (In-Loop, Probabilistic)

**When:** During roll execution, inside the explosion loop.

**What it checks:** The running total of all units consumed across all collections.

**Mechanism:**
```javascript
let poolRemaining = MAX_COMPLEXITY;

// Each die roll:
poolRemaining--;

// Each explosion iteration:
poolRemaining--;

// Check:
if (poolRemaining <= 0) {
  // Halt. Return results gathered so far.
  // Set warning flag.
}
```

**Action on trigger:** Stop all further rolling. Return partial results (whatever has been computed so far across all collections). Set `resultWarning = 'COMPLEXITY_EXCEEDED'`.

---

## 6. Partial Results & Warning Display

When the Circuit Breaker triggers:

- **Results shown:** All completed die results up to the point of halting. Incomplete collections may show fewer dice than their `count` specifies.
- **Warning displayed:** A visible, prominent message in the result area. Suggested copy:

  > ⚠️ **Roll Capacity Reached** — results shown are partial. Reduce dice count or remove exploding modifiers to roll in full.

- **Total displayed:** Calculated from partial results only — clearly marked as partial.
- **No silent failure:** The warning is always shown when the circuit breaker triggers. Partial results are never presented as complete.

---

## 7. Explosion Iteration Cap

The per-die explosion iteration cap is raised from **20** to **1000**, consistent with industry standard (rpg-dice-roller, Foundry VTT).

This cap acts as a **safety fuse within the pool** — a single `1d6!!` cannot consume more than 1000 units regardless of how lucky the rolls are, ensuring no single die can exhaust the entire pool.

| | Current | New |
|:---|:---|:---|
| Per-die explosion cap | 20 | 1000 |
| Pool cap | N/A (replaced) | 100,000 units |
| `MAX_DICE_COUNT` | 100,000 | **Removed** |
| `MAX_DIE_SIDES` | 1,000,000 | Unchanged |
| `MAX_MODIFIER` | 1,000,000 | Unchanged |

---

## 8. Constants Summary

```javascript
MAX_COMPLEXITY:          100000   // Replaces MAX_DICE_COUNT
MAX_EXPLOSION_ITERS:     1000     // Per-die explosion cap (raised from 20)
MAX_DIE_SIDES:           1000000  // Unchanged
MAX_MODIFIER:            1000000  // Unchanged
RENDER_SUMMARY_THRESHOLD: 1000   // Stage 2 render mode trigger
```

---

## 9. Error & Warning Codes

| Code | Stage | Type | Meaning |
|:---|:---|:---|:---|
| `COMPLEXITY_EXCEEDED` (parse) | Stage 1 | Hard reject | Deterministic cost exceeds budget |
| `COMPLEXITY_EXCEEDED` (runtime) | Stage 3 | Soft warning | Pool exhausted mid-roll, partial results returned |
| `TOO_MANY_SIDES` | Parse | Hard reject | Unchanged |
| `MODIFIER_TOO_LARGE` | Parse | Hard reject | Unchanged |

---

## 10. Open Questions

1. Should the per-die `MAX_EXPLOSION_ITERS` cap of 1000 itself draw from the pool, or is it a separate guard? (Current spec: it draws from the pool — a single die consuming 1000 explosion units is valid if the pool has capacity.)
2. Should the warning copy be surfaced differently for "base dice exhausted pool" vs "explosions exhausted pool"? These are meaningfully different user experiences.