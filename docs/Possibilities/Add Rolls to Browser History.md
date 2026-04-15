> The browser's Backwards and Forwards history takes you through your input history in the current session. However, it doesn't take use through the history of the Roll Results. Is that because of something we've coded? Or something we've NOT coded? It could be nice in the current session to have the browser history function exactly like users might expect - eg full history, both input and output (results)? Or are there issues with this?



Now I have a complete picture. Here's a thorough answer:

---

## Why Back/Forward only restores input, not results

It's a combination of **something you coded** and **something you didn't code** — but the core reason is a fundamental browser constraint.

### What you coded (that creates the current behaviour)

On roll, `setQueryParam` sets `window.location.hash = '#dice=3d6'`. Setting `.hash` directly creates a new history entry, which is why Back/Forward navigates through your *input* history. The `hashchange` listener then reads the `?dice=` param and calls `updateInput()` — restoring the text — but it does **nothing with results**. Results live only in `DiceApp.state.rollResults` (in-memory) and are never serialised anywhere.

On clear, `history.pushState(null, null, ' ')` is called. `pushState` also creates a history entry, but there is no `popstate` listener — so navigating to a pushState entry is a no-op for the app (the DOM just sits there unchanged).

**Summary of what's coded:**
- Hash changes → history entries ✅
- `hashchange` → input restored ✅
- `popstate` listener → **missing** ❌
- Results serialised to URL or storage → **missing** ❌

---

### The fundamental browser constraint

Roll results are **random**. Even if you fully restored the input (`3d6`) via the hash, re-rolling would give different numbers. So to truly restore a past result via Back/Forward, you'd need to serialise the actual rolled numbers — not just the input — into the history state.

The History API has a `state` object for exactly this purpose (`history.pushState(stateObject, ...)`) — it can carry arbitrary data that gets handed back to you on `popstate`. That's the mechanism you'd use.

---

### What full history would require

To make Back/Forward behave exactly as a user might expect (restores both input *and* the specific rolled numbers):

1. **On roll:** `pushState` with a state object containing both the input string and the serialised roll results, instead of just mutating `.hash`.
2. **On clear:** `pushState` with an empty state (as now, but actually handled).
3. **Add a `popstate` listener** that reads `event.state`, restores `state.currentValue` and `state.rollResults` from it, and calls `ui.renderAll()`.

Rough sketch:
```javascript
// On roll (instead of setQueryParam):
history.pushState(
  { dice: notation, results: state.rollResults },
  '',
  '#dice=' + encodeURIComponent(notation)
);

// popstate listener:
window.addEventListener('popstate', (e) => {
  if (e.state) {
    DiceApp.state.currentValue = e.state.dice ?? '';
    DiceApp.state.rollResults = e.state.results ?? [];
    DiceApp.state.errorMessage = '';
    DiceApp.ui.renderAll();
  } else {
    // Landed on a state with no attached data (e.g. initial page load)
    DiceApp.actions.updateInput(DiceApp.utils.getQueryParam('dice') ?? '');
  }
});
```

---

### Issues and trade-offs to consider

| Issue | Detail |
|---|---|
| **State object size** | `pushState` state objects have a browser-defined size limit (Firefox: 640KB, Chrome: ~100MB in practice but spec says 640KB). For very large rolls (100k dice), the serialised `rollResults` array could be enormous. You'd want to cap this or skip serialising results for rolls above a threshold. |
| **Bookmark URL doesn't include results** | That stays true and correct — the URL only holds input, which is the intended bookmarking behaviour. Back/Forward state is separate from the URL. |
| **File:// protocol** | `pushState` throws on `file://` in some browsers/environments — but you already know about this from the test polyfill. The existing conditional handling covers it. |
| **hashchange vs popstate** | Once you switch to `pushState`-driven history, the `hashchange` event becomes less useful (it only fires for hash changes, not `pushState`). You'd likely lean fully on `popstate` and drop the `hashchange` listener, or keep them for different cases. |
| **Initial page load** | On first load there's no `pushState` state — `event.state` will be `null` in `popstate`. You already handle this: fall back to reading the URL hash param. |
| **Clear button** | Clear should `pushState` with `{ dice: '', results: [] }` so Back from a cleared state correctly restores the previous roll's results. Currently `pushState(null, null, ' ')` means navigating back to a cleared state would have `e.state === null` — fall through to the hash, which is also empty at that point, so it would work but needs care. |

---

### Is it worth doing?

It's achievable with modest effort and no architectural changes — `pushState` + a `popstate` listener. The main practical concern is the state object size for large rolls. A reasonable approach would be: serialise results in `pushState` state for all rolls under some threshold (e.g. 1,000 dice), and for larger rolls just store the input and let Back/Forward restore the input without results. That covers 99% of real usage cleanly.