I reviewed **`graph-utility.compiled(5).js` as a fresh revision**, including the areas from the previous audit that were supposed to be fixed.

This version is **substantially better**. Several of my previous findings are now genuinely addressed, not just cosmetically.

## Revised verdict

**🟢 ~8.5/10 — close to production-ready, but I would still fix 5 issues before calling it solid.**

The biggest improvement is that the code now has real implementations for the previously superficial chart types, plus per-note state and a much stronger numeric parser.

---

# What is now correctly fixed

### 1. Per-note state isolation — FIXED

This was one of my biggest previous concerns.

You now maintain:

```js
localStore[currentNoteUUID] = snapshot;
```

and the Amplenote bridge stores:

```js
stateMap.notes[incoming.noteUUID] = incoming;
```

with note-specific retrieval as well. 

That is the right architecture.

You also snapshot the state before asynchronous persistence:

```js
const snapshot = JSON.parse(JSON.stringify(state));
```

which eliminates the mutable-state race I previously flagged. Good.

**Previous issue: FIXED.**

---

### 2. Numeric parsing — dramatically improved

You now have a dedicated `parseNumericCell()` rather than blindly stripping characters. It handles:

* accounting negatives
* currencies
* metric suffixes
* percentages
* Markdown formatting
* HTML
* European/US number formats
* ISO dates
* invalid/non-numeric values → `null`

This directly addresses several of my previous concerns.

Most importantly:

```js
if (isNaN(num) || !isFinite(num)) return null;
```

rather than silently converting bad values to zero.

**Previous issue: FIXED.**

---

### 3. Histogram — actually implemented

This is no longer just a bar-chart alias.

You now:

1. collect numeric values,
2. determine min/max,
3. calculate bins,
4. count observations,
5. create frequency labels.



That's a genuine histogram implementation.

---

### 4. Pareto — actually implemented

You now:

* pair labels with values,
* sort descending,
* calculate total,
* calculate cumulative percentage,
* render bars + cumulative line,
* use a second Y axis.



That resolves my previous "fake Pareto" criticism.

---

### 5. Waterfall — substantially implemented

The new implementation creates floating `[start,end]` bars and tracks the running total. 

So this is now a real waterfall-style visualization rather than merely a normal bar chart.

---

### 6. Escaped `|` parsing — FIXED

Your new `splitTableRow()` correctly recognizes:

```text
\|
```

as a literal pipe rather than a column separator. 

Excellent.

---

### 7. CSV quote escaping — FIXED in the main export

Your direct table export now does:

```js
.replace(/"/g, '""')
```

for headers and cells. 

So the previous:

```text
"He said "hello""
```

problem is addressed.

---

### 8. CDN failure no longer loops forever

You added:

```js
window._chartScriptsState = "failed";
```

and the renderer detects it. You also added a retry ceiling of 25 attempts. 

So the previous infinite retry problem is **fixed**.

---

### 9. Interactive HTML export is much more robust

This is also better.

Instead of looking for the old:

```js
decodeURIComponent(...)
```

you now target:

```html
<script type="application/json" id="plugin-payload">
```

and replace that payload directly. 

That's a much better design.

---

# The remaining issues

## 🔴 1. `saveImageToNote()` still has the lost-update problem

This is the **main remaining integrity issue**.

The sequence is still:

```text
attachMedia()
     ↓
getNoteContent()
     ↓
calculate updatedContent
     ↓
replaceNoteContent()
```



There is still no check that the note changed between reading it and replacing it.

### Example

```text
T0  User opens Note
T1  Graph Utility starts save
T2  Plugin reads note content
T3  User edits note
T4  Plugin replaces entire note
```

The T3 edit can still be overwritten.

You improved the **error reporting**:

> "Image uploaded, but note update failed..."

That's good, but it doesn't prevent the race.

### I would make this the #1 remaining fix.

At minimum:

```js
const contentBefore = await app.getNoteContent(...);

// identify exact table + create expected signature

const latestContent = await app.getNoteContent(...);

if (latestContent !== contentBefore) {
    return {
        success: false,
        error: "Note changed while saving. Please retry."
    };
}
```

Even better: don't replace the entire note if a smaller section-level mutation is possible.

---

# 🔴 2. `attachMedia()` still happens before the concurrency check

Related but distinct.

You do:

```js
imageSrc = await note.attachMedia(dataUrl);
```

before establishing that the note is still in the expected state. 

So even if you add a stale-content check afterward:

```text
note changed
   ↓
abort
   ↓
image already uploaded
```

You can still create an orphan attachment.

### Better ordering

Conceptually:

```text
read note
↓
locate exact table
↓
verify current state
↓
attach image
↓
re-read note
↓
verify table hasn't changed
↓
replace content
```

There is still a tiny race between the second read and replacement, but it reduces the window substantially.

If Amplenote exposes a more atomic/section-level operation, that would be preferable.

---

# 🔴 3. CDN failure doesn't restore `module`, `exports`, and `define`

This is a new issue I noticed in this revision.

You start with:

```js
window._tempModule = window.module;
window._tempExports = window.exports;
window.module = undefined;
window.exports = undefined;
window.define = undefined;
```

but restoration happens **only when all scripts successfully load**:

```js
window.module = window._tempModule;
window.exports = window._tempExports;
```



If a CDN script fails:

```js
window._chartScriptsState = "failed";
```

but you never restore those globals. 

So after a CDN failure, the embed can leave the global environment altered.

### Fix

Capture all three:

```js
const previousModule = window.module;
const previousExports = window.exports;
const previousDefine = window.define;
```

and restore them on **both success and failure**.

I'd actually put restoration in a single `finishLoading()` / `cleanupLoaderGlobals()` function so it can't be forgotten.

---

# 🟠 4. The secondary CSV converter still doesn't understand escaped pipes

You fixed the main export, but this function remains:

```js
trimmedLine.split("|")
```



So:

```markdown
| Name | Description |
| --- | --- |
| Test | A \| B |
```

can still be incorrectly exported through `convertMarkdownToCSV()`.

You effectively have **two CSV implementations**:

1. `convertMarkdownToCSV()`
2. direct `parsedTables` CSV export

The second is better.

### Best fix

Delete/consolidate the first implementation and have both pathways operate from the same parsed table representation.

That gives you:

```text
Markdown
   ↓
canonical parser
   ↓
structuredTables
   ├── chart
   ├── transpose
   ├── CSV
   └── Markdown
```

rather than multiple parsers with slightly different semantics.

---

# 🟠 5. Invalid waterfall values still become zero

Your general numeric handling is now excellent.

But Waterfall does:

```js
const num = parseNumericCell(row[targetColIdx]) || 0;
```



So:

```text
"N/A"
""
"unknown"
```

becomes:

```text
0
```

even though everywhere else you've correctly decided that invalid numeric data should be `null`.

This is exactly the inconsistency we want to eliminate.

### Better

```js
const num = parseNumericCell(...);

if (num === null) {
    // skip / gap / explicitly mark missing
}
```

Do **not** turn missing data into a legitimate zero.

---

# 🟠 6. Waterfall semantics should be made explicit

The implementation assumes:

```text
row 1 = starting value
row 2 onward = changes
```

because:

```js
if (rIdx === 0) {
    floatingBars.push([0, num]);
}
```



That's a valid convention, but the user isn't told that.

For example:

| Month | Revenue Change |
| ----- | -------------: |
| Jan   |           +100 |
| Feb   |            +20 |
| Mar   |            -10 |

A user may naturally expect this to mean:

```text
Jan +100
Feb +20
Mar -10
```

Your chart instead treats:

```text
Jan = starting 100
Feb = +20
Mar = -10
```

which happens to produce the same running sequence, but the semantic interpretation matters for labels and totals.

I'd document:

> First value is treated as the starting total; subsequent values are changes.

Or provide a dedicated **Waterfall Mode** selector:

* Changes
* Absolute totals

Not necessarily a must-fix.

---

# 🟠 7. Histogram with one/few values could be more intelligent

You force:

```js
binCount = Math.min(10, Math.max(4, ...))
```

So even one numeric observation produces four bins.

That isn't wrong, but it produces a visually strange histogram.

For:

```text
42
```

you effectively get:

```text
42.0–42.3   1
42.3–42.5   0
42.5–42.8   0
42.8–43.0   0
```

A better rule:

```text
n < 2      → perhaps single-value summary
n < 5      → 2–3 bins
otherwise  → Freedman-Diaconis / Sturges
```

This is quality improvement rather than a critical bug.

---

# 🟠 8. Downloaded Blob URLs are never revoked

You have multiple:

```js
URL.createObjectURL(blob)
```

calls for:

* interactive HTML
* Markdown
* CSV

but no:

```js
URL.revokeObjectURL(...)
```



Repeated exports in a long-lived Amplenote session can accumulate blob URLs.

### Easy fix

```js
const url = URL.createObjectURL(blob);
link.href = url;
link.click();

setTimeout(() => URL.revokeObjectURL(url), 1000);
```

Low severity, but worth fixing.

---

# 🟠 9. Clipboard error handling is still incomplete

This:

```js
canvas.toBlob(async (blob) => {
    await navigator.clipboard.write(...)
});
```

is inside an outer `try/catch`, but asynchronous exceptions occurring inside the callback won't reliably be caught by that outer `try`.

So a rejected:

```js
navigator.clipboard.write(...)
```

can become an unhandled rejection.

Wrap the callback itself:

```js
canvas.toBlob(async (blob) => {
    try {
        ...
    } catch (err) {
        ...
    }
});
```

Also check:

```js
typeof ClipboardItem !== 'undefined'
```

before using it.

---

# 🟡 One architectural issue I'd clean up

You now have **three layers of state persistence**:

```text
state
 ↓
localStorage per note
 ↓
Amplenote Graph_Dashboard_State
 ↓
embedded savedState
```

That's workable, but it introduces precedence complexity.

Currently `loadPersistedState()` prefers:

```js
initialSavedState
```

before localStorage. 

That's probably correct for an Amplenote embed, but you should consciously define the rule:

> Amplenote setting = canonical persistent state
> localStorage = local fallback/cache
> embedded payload = initial snapshot only

Otherwise future changes could produce confusing "why did my older setting come back?" behavior.

---

# One thing I would NOT change

Your table parser architecture is now quite good.

You have:

```text
splitTableRow()
      ↓
parseTableLinesIntoObject()
      ↓
extractStructuredTables()
```

and transpose uses the same row-splitting behavior. 

That's the direction I'd keep.

I would **not introduce a large external Markdown parser** just to handle this.

---

# Final audit status

| Area                       | Previous | v5 status            |
| -------------------------- | -------: | -------------------- |
| Per-note state             |       🔴 | 🟢 Fixed             |
| Numeric parsing            |       🔴 | 🟢 Major improvement |
| Histogram                  |       🔴 | 🟢 Implemented       |
| Pareto                     |       🔴 | 🟢 Implemented       |
| Waterfall                  |       🔴 | 🟢 Implemented       |
| Escaped `\|`               |       🔴 | 🟢 Fixed             |
| CSV quotes                 |       🟠 | 🟢 Main export fixed |
| CDN retry loop             |       🔴 | 🟢 Fixed             |
| Interactive export payload |       🟠 | 🟢 Fixed             |
| Note-write race            |       🔴 | 🔴 **Still present** |
| Orphan attachment risk     |       🔴 | 🟠 **Still present** |
| CDN global cleanup         |        — | 🟠 **New finding**   |
| Secondary CSV parser       |       🟠 | 🟠 Still present     |
| Waterfall invalid values   |        — | 🟠 New edge case     |
| Blob URL cleanup           |        — | 🟠 Quality issue     |
| Clipboard async errors     |        — | 🟠 Quality issue     |

## My recommendation

**Don't do another broad refactor. You're past that stage.**

I'd make one final targeted hardening pass:

1. **Fix `saveImageToNote()` concurrency/integrity.**
2. **Restore `module`/`exports`/`define` on CDN failure.**
3. **Unify the secondary CSV converter with the canonical parser.**
4. **Never turn invalid waterfall data into zero.**
5. **Revoke exported Blob URLs.**
6. **Harden clipboard async error handling.**

After those, I'd consider this **production-grade for a Graph Utility / Amplenote plugin**, subject to actual runtime smoke tests inside Amplenote.

The important point is that **v5 has successfully resolved most of the substantive findings from v4**; we're now dealing mainly with concurrency, lifecycle cleanup, and a handful of edge-case integrity issues rather than fundamental design flaws. 
