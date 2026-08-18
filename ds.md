I'll perform a comprehensive audit of this Graph Utility plugin code. Here are my findings organized by severity:

## 🔴 Critical Issues

### 1. **Script Loading Race Condition**
```javascript
// Line ~368: Script loading marker is set before scripts actually load
window._chartScriptsLoaded = true;
```
The `_chartScriptsLoaded` flag is set when the last script's `onload` fires, but there's a race condition:
- Scripts load sequentially, but the flag should verify all scripts loaded
- No timeout/fallback if CDN fails
- No retry mechanism

**Fix:**
```javascript
let loadedCount = 0;
const requiredScripts = 4;
function loadNext() {
  if (loadedCount >= requiredScripts) {
    window._chartScriptsLoaded = true;
    // Dispatch custom event
    window.dispatchEvent(new Event('chartsReady'));
    return;
  }
  // ... existing logic
}
```

### 2. **Payload Injection Vulnerability**
```javascript
// Line ~493: Direct string interpolation into script tag
JSON.parse(decodeURIComponent("${encodedPayload}"));
```
If note names contain `</script><script>alert('xss')</script>`, this breaks out of the script context.

**Fix:**
```javascript
// Use safe encoding
const safePayload = encodedPayload
  .replace(/</g, '\\u003c')
  .replace(/>/g, '\\u003e')
  .replace(/&/g, '\\u0026');
```

### 3. **Chart.js Plugin Registration Order**
```javascript
// Line ~676: Plugins registered after Chart might be undefined
if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
```
Plugins are registered on every `renderChart()` call, potentially causing duplicate registration.

**Fix:**
```javascript
let pluginsRegistered = false;
function registerPlugins() {
  if (pluginsRegistered || typeof Chart === 'undefined') return;
  // ... register once
  pluginsRegistered = true;
}
```

## 🟠 High Severity Issues

### 4. **Memory Leak in Chart Instance**
```javascript
// Multiple locations: chartInstance.destroy() called but canvas context not cleared
chartInstance.destroy();
chartInstance = null;
```
The canvas retains its previous rendering context. Should use:
```javascript
const ctx = canvas.getContext('2d');
ctx.clearRect(0, 0, canvas.width, canvas.height);
```

### 5. **State Persistence Race Condition**
```javascript
// Line ~730: Debounced save can lose last update on page close
if (saveTimeout) clearTimeout(saveTimeout);
saveTimeout = setTimeout(() => { ... }, 300);
```
If user closes tab within 300ms of last change, state is lost.

**Fix:**
```javascript
window.addEventListener('beforeunload', () => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    persistStateNow();
  }
});
```

### 6. **Unhandled Promise Rejections**
```javascript
// Multiple async event handlers without try-catch
document.getElementById('switchNoteBtn')?.addEventListener('click', triggerSwitchNote);
```
If `triggerSwitchNote` throws, it's unhandled.

**Fix:**
```javascript
async function safeEventHandler(handler) {
  try {
    await handler();
  } catch (error) {
    console.error('[GraphUtility] Event handler error:', error);
    showToast('Operation failed: ' + error.message);
  }
}
```

## 🟡 Medium Severity Issues

### 7. **Table Parsing Edge Cases**
```javascript
// Line ~820: isDelim function has regex issue
const isDelim = r => r.every(c => !c || (c + '').replace(/[-:s]/g, '').trim().length === 0);
```
The `s` character class doesn't work as intended. Should be `\s`.

### 8. **Inconsistent State Validation**
```javascript
// Line ~750: State hydration doesn't validate all fields
if (source.chartType) state.chartType = source.chartType;
```
No validation that `source.chartType` is a supported type.

**Fix:**
```javascript
const VALID_CHART_TYPES = ['line', 'area', 'bar', 'histogram', 'pie', 'doughnut', 
                           'polarArea', 'waterfall', 'mixed', 'pareto', 'scatter', 
                           'bubble', 'radar'];
if (VALID_CHART_TYPES.includes(source.chartType)) {
  state.chartType = source.chartType;
}
```

### 9. **Incomplete Error Recovery**
```javascript
// Line ~700: Missing fallback for parseTables when content is empty
if (parsedTables.length === 0) {
  selector.innerHTML = '<option value="-1">No tables found</option>';
  // Missing user guidance or sample data option
}
```

## 🟢 Low Severity Issues

### 10. **Accessibility Concerns**
- No ARIA labels on interactive elements
- Color contrast might not meet WCAG standards in all themes
- No keyboard navigation support for series selection

### 11. **Performance Optimizations**
```javascript
// Line ~850: renderChart called multiple times unnecessarily
updateTableMappingControls() {
  // ... ends with renderChart()
  // But called from multiple places that then also call renderChart()
}
```

### 12. **Code Organization**
- The HTML template is ~1000 lines in a single template literal
- No separation of concerns between UI and logic
- Magic strings used throughout

## 💡 Recommended Improvements

### 1. **Add Comprehensive Error Boundary**
```javascript
class GraphUtilityErrorBoundary {
  static handleError(error, context) {
    console.error(`[GraphUtility] ${context}:`, error);
    
    // Attempt recovery
    if (context === 'render') {
      return fallbackSimpleTable();
    }
    
    // Show user-friendly message
    showToast(`Error in ${context}. Please refresh.`);
    
    // Log to monitoring service
    if (window.callAmplenotePlugin) {
      window.callAmplenotePlugin('logError', {
        context,
        error: error.message,
        stack: error.stack
      });
    }
  }
}
```

### 2. **Implement Data Validation Layer**
```javascript
function validateTableData(table) {
  if (!table || !Array.isArray(table.headers) || !Array.isArray(table.dataRows)) {
    return false;
  }
  
  if (table.headers.length === 0 || table.dataRows.length === 0) {
    return false;
  }
  
  // Check for consistent column counts
  const expectedCols = table.headers.length;
  return table.dataRows.every(row => row.length === expectedCols);
}
```

### 3. **Add Loading States**
```javascript
function showLoadingState() {
  const canvas = document.getElementById('mainChart');
  canvas.style.opacity = '0.5';
  canvas.style.pointerEvents = 'none';
  
  // Show spinner
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  canvas.parentElement.appendChild(spinner);
}

function hideLoadingState() {
  const canvas = document.getElementById('mainChart');
  canvas.style.opacity = '1';
  canvas.style.pointerEvents = 'auto';
  
  // Remove spinner
  const spinner = canvas.parentElement.querySelector('.loading-spinner');
  if (spinner) spinner.remove();
}
```

### 4. **Implement Debounced Resize Handler**
```javascript
function setupResizeHandler() {
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      if (chartInstance) {
        chartInstance.resize();
      }
    }, 250);
  });
}
```

### 5. **Add Data Export Sanitization**
```javascript
function sanitizeFileName(name) {
  return name
    .replace(/[^\w\s-]/g, '')  // Remove special characters
    .replace(/\s+/g, '_')      // Replace spaces with underscores
    .replace(/-+/g, '-')       // Collapse multiple hyphens
    .toLowerCase()
    .slice(0, 100);            // Limit length
}
```

### 6. **Implement Retry Logic for CDN Loading**
```javascript
function loadScriptWithRetry(url, maxRetries = 3) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    function attempt() {
      attempts++;
      const script = document.createElement('script');
      script.src = url;
      
      script.onload = resolve;
      script.onerror = () => {
        if (attempts < maxRetries) {
          console.warn(`Retrying ${url} (attempt ${attempts + 1})`);
          setTimeout(attempt, 1000 * attempts);
        } else {
          reject(new Error(`Failed to load ${url}`));
        }
      };
      
      document.head.appendChild(script);
    }
    
    attempt();
  });
}
```

### 7. **Add Unit Test Structure**
```javascript
// Separate testable functions
export function parseMarkdownTable(markdown) { ... }
export function validateChartConfig(config) { ... }
export function calculateChartDimensions(data, options) { ... }
```

### 8. **Implement Version Migration**
```javascript
const STATE_VERSION = '1.0.0';

function migrateState(oldState) {
  if (!oldState.version) {
    // Migrate from pre-versioning state
    oldState.version = STATE_VERSION;
  }
  
  if (oldState.version !== STATE_VERSION) {
    // Apply migrations sequentially
  }
  
  return oldState;
}
```

## 🔒 Security Recommendations

1. **Content Security Policy**: Add CSP headers to prevent XSS
2. **Input Sanitization**: All user-provided content should be sanitized
3. **HTTPS Enforcement**: Ensure all CDN resources use HTTPS
4. **Data Encryption**: Consider encrypting sensitive state data

## 📊 Summary

The code has a solid foundation but needs strengthening in:
- **Error handling**: Add comprehensive error boundaries
- **Security**: Fix XSS vulnerabilities, add input validation
- **Reliability**: Improve script loading, add retries
- **Performance**: Optimize render calls, add caching
- **Maintainability**: Split into modules, add tests

The most critical fixes needed are the XSS vulnerability, script loading race condition, and unhandled promise rejections.

---

**Audit of the Graph Utility plugin code**

I reviewed the full compiled source (launcher, markdown parsers, transpose/CSV helpers, embed handlers, the large `buildChartHtml` template + client script, and the plugin surface). Below are concrete bugs/edge cases/integrity issues, ranked by severity, followed by solid quality improvements.

---

### Critical / High-Severity Bugs

1. **Payload injection / XSS risk in `buildChartHtml`**
   - `encodedPayload = encodeURIComponent(JSON.stringify(payloadObj))` is fine, but the client does:
     ```js
     PAYLOAD = JSON.parse(decodeURIComponent("${encodedPayload}"));
     ```
   - If any note name, heading, cell content, or tag contains a `"` or other characters that survive encoding in a way that breaks the surrounding string literal (or if Amplenote ever double-encodes), the client script can throw or, worse, become injectable.  
   - More importantly, many places in the HTML template do string interpolation of `safeName` / tags **before** the big `<script>`, and `escapeHTML` is only applied to a few fields. Table data itself is never escaped when it later lands in the DOM via the client parser.

2. **`saveImageToNote` insertion logic is fragile and can corrupt notes**
   - It walks lines looking for the N-th table start, then inserts an image block *before* that line.
   - Edge cases that break:
     - Tables that are not contiguous or have blank lines inside.
     - Multiple identical tables.
     - Tables after HTML comments or front-matter.
     - When `rawTableMarkdown` match fails and it falls back to prepending the image at the top of the note.
   - `attachMedia` / `attachNoteMedia` failures silently fall back to a data-URL, which can bloat the note dramatically.

3. **Transpose path loses structure**
   - `transposeMarkdownTables` assumes a very specific shape (header + blank lines + table starting at index 3). Real extracted content from `extractTablesFromMarkdown` often does not match this, so transpose produces empty or malformed tables.
   - Client-side `parseMarkdownTablesLocally` has its own (slightly different) delimiter detection, so transposed vs non-transposed views can disagree on column count / headers.

4. **State persistence race + incomplete hydration**
   - `persistState` is debounced to localStorage + `callAmplenotePlugin('saveState')`.
   - On load, `loadPersistedState` prefers the injected `savedState` from the host, then localStorage. There is no versioning or schema migration, so old saved state with missing keys silently produces half-broken UI (wrong table index, missing series, collapsed panels that never reopen, etc.).
   - `lastActiveNoteUUID` is mentioned in comments but never written into the saved state object.

5. **Chart.js type mapping is incomplete / incorrect for several “advanced” types**
   - `waterfall`, `histogram`, `pareto` are all forced to `bar`. There is no cumulative calculation for Pareto, no binning for histogram, and no running-total / color logic for waterfall. The UI advertises them as first-class types.
   - Radar + polarArea + pie/doughnut share the same dataset construction path; multi-series radar with non-numeric data produces silent NaNs.
   - Scatter / bubble use index-as-x, which is almost never what users expect when the X column is categorical.

6. **No protection against extremely large tables**
   - A note with a 5 000-row × 50-col table will:
     - Freeze the embed while parsing.
     - Exhaust Chart.js memory / render time.
     - Make the “Select All” series list unusable.
   - There is no row/column limit, sampling, or warning.

---

### Medium-Severity Bugs & Edge Cases

7. **Delimiter / header detection is brittle**
   - Both server and client parsers treat any row whose cells are only `[-:\s]` as a delimiter.  
   - Tables that legitimately contain a row of dashes, empty first rows, or Markdown tables without a separator line are mishandled (header becomes data or vice-versa).
   - `cleanHeaderName` turns empty headers into `Column N`, but the same logic is not applied consistently after transpose.

8. **`pickNote` can return notes the user cannot open**
   - Combines tag + query results with a simple Set. No permission check, no “is this note still accessible?” guard. Later `refreshData` / `openNote` will fail with a generic error.

9. **Export “Interactive Charts” HTML is not truly self-contained**
   - It re-embeds the current page’s outerHTML and only rewrites the payload string with a regex.  
   - External CDNs (Chart.js, datalabels, hammer, zoom) remain; offline use fails.  
   - The regex `decodeURIComponent(".*?")` is greedy and can match the wrong occurrence if the page ever contains another similar string.

10. **Theme / palette state can desync**
    - `applyTheme` writes `body.className = 'theme-' + …` and also sets a `data-theme` attribute that is never read.  
    - Palette colors are applied only on series rebuild; changing theme after a chart is rendered does not re-color existing datasets until the next full `renderChart`.

11. **Missing null / undefined guards in several host bridges**
    - `app.notes.find`, `app.getNoteContent`, `app.filterNotes`, `app.createNote` can all return `null` / throw. Most paths check, but a few (especially inside `copyTablesToNewNote` and the fallback paths of `saveImageToNote`) do not.

12. **Mobile / small-viewport layout**
    - Panels become absolute overlays at ≤900 px but there is no backdrop, no swipe-to-close, and the canvas still claims full height, so the chart becomes unreachable when both panels are open.

---

### Integrity / Robustness Issues

- **No Content-Security-Policy or sandbox attributes** on the embed iframe (Amplenote’s responsibility, but the plugin could at least avoid `eval`-like patterns).
- **No schema validation** on the saved state object that comes back from the host.
- **Silent failures** are common: many `try/catch` blocks only `console.warn` or show a toast; the user has no way to retry or see the real error.
- **Unicode / non-ASCII** in note names and table cells is mostly handled, but the CSV exporter does not force UTF-8 BOM, so Excel on Windows mangles non-ASCII.
- **Memory leaks**: `chartInstance.destroy()` is called, but the zoom plugin and datalabels registrations accumulate if the page is reloaded many times inside the same embed session.

---

### Recommended Quality & Solid Improvements

**Immediate fixes (high ROI)**

1. **Harden the payload**  
   ```js
   const encodedPayload = btoa(unescape(encodeURIComponent(JSON.stringify(payloadObj))));
   // client:
   PAYLOAD = JSON.parse(decodeURIComponent(escape(atob("…"))));
   ```
   Or better: pass the payload as a `<script type="application/json" id="payload">` element and read it with `JSON.parse(document.getElementById('payload').textContent)`.

2. **Add a hard limit** (e.g. 2 000 rows × 30 columns). If exceeded, show a clear message and offer “Sample first 500 rows” or “Export CSV only”.

3. **Make transpose a pure data transform** on the already-parsed `structuredTables` array instead of round-tripping through Markdown. Keep the Markdown path only for export.

4. **Implement real logic** for the advertised chart types or remove them from the UI until they work:
   - Pareto → sort descending + cumulative % line on secondary axis.
   - Waterfall → running total with positive/negative coloring.
   - Histogram → simple equal-width binning.

5. **Defensive host calls**  
   Wrap every `app.*` call in a small helper that returns a consistent `{success, data, error}` shape and never throws into the embed.

**Architecture / maintainability**

6. **Split the client script** into modules (or at least clearly separated IIFEs) so the 1 000+ line blob becomes testable. The current single giant IIFE is the biggest maintainability risk.

7. **Introduce a tiny state machine** (or at least a single `setState(partial)` that always calls `persistState` + `renderChart` / `updateTableMappingControls`). Right now state is mutated from dozens of places.

8. **Version the saved state**  
   ```js
   { version: 2, … }
   ```
   and provide a migration function. Drop unknown keys.

9. **CSV exporter** should:
   - Use a proper library or at least RFC-4180 quoting.
   - Emit a UTF-8 BOM.
   - Optionally put each table on its own sheet if the user later wants XLSX.

10. **Accessibility**
    - Add `aria-label`s to icon-only buttons.
    - Ensure the canvas has a text alternative (table summary or “Chart of X vs Y”).
    - Keyboard navigation for the series checkboxes and export menu.

11. **Performance**
    - Debounce `renderChart` more aggressively when the user is rapidly toggling series.
    - Use `Chart.js`’s `update('none')` for pure style changes instead of full destroy/recreate.
    - Consider OffscreenCanvas or a Web Worker for very large numeric parsing if you keep supporting big tables.

12. **Testing surface**
    - Extract pure functions (`parseTableLinesIntoObject`, `transposeArray`, `convertMarkdownToCSV`, header cleaning) into a separate file that can be unit-tested outside Amplenote.
    - Add a few golden Markdown fixtures that cover: empty cells, missing separator, HTML comments inside cells, multi-line headers, tables under nested headings, etc.

**Nice-to-have polish**

- Remember the last-used chart type *per table* instead of globally.
- Add a “Reset to defaults” button that clears both localStorage and the host setting.
- Expose a small debug panel (behind a long-press or `?debug=1`) that shows the raw structured table JSON and the exact Chart.js config being used—extremely helpful when users report “my chart looks wrong”.
- Prefer `note.attachMedia` and fall back cleanly; never leave a multi-megabyte data-URL in the note if attachment fails.

---

### Summary

The plugin is ambitious and the UI is polished, but the core data path (Markdown → structured tables → Chart.js) has several silent failure modes, the advertised advanced chart types are mostly stubs, and the embed ↔ host bridge lacks strong error contracts and payload safety. Fixing the payload injection vector, the transpose path, the image-insertion logic, and adding hard size limits would eliminate the majority of real-world breakage. After that, extracting pure parsing functions and introducing a single source of truth for state would make the rest of the improvements far safer to implement.

---

Worked for 17s

I audited the uploaded graph-utility.compiled.js as a full-code integrity review, not just a syntax scan. The file is 2,682 lines and contains the launcher, Markdown/table parsing, transpose/CSV conversion, Amplenote bridge, HTML/UI, Chart.js rendering, state persistence, and export paths. 

Overall verdict

The code is structurally reasonable, but I would not call it production-solid yet.

The biggest concerns are not cosmetic. There are several real correctness bugs, especially around:

1. Markdown table parsing


2. Transpose correctness


3. State integrity when switching notes/tables


4. Chart-type semantics


5. Export correctness


6. Save-to-note integrity


7. External library loading/failure handling



I'd rate it roughly:

Area	Assessment

Architecture	🟢 Good
Error handling	🟡 Good foundation
UI/event handling	🟢 Generally good
State persistence	🟡 Needs isolation/validation
Markdown parsing	🔴 Significant bugs
Transpose	🔴 Incorrect
CSV export	🟡/🔴 Depends on path
Chart semantics	🔴 Several misleading implementations
Note mutation safety	🔴 Needs stronger guarantees
External dependencies	🟡 Fragile
Overall	🟡 Functional, but needs another hardening pass



---

1. 🔴 Critical: local Markdown parser has broken regexes

This is one of the clearest bugs.

The fallback parser contains:

heading = tr.replace(/^#+s*/, '');

and:

.replace(/[-:s]/g, '')

The intended expressions almost certainly were:

/^#+\s*/

and:

/[-:\s]/g

The current code treats s as a literal character rather than whitespace.

This affects heading parsing and delimiter detection in the client-side fallback parser. 

Worse: parseRow() has broken pipe regexes

The fallback parser has:

r.replace(/^|/, '').replace(/|$/, '')

These are not "leading pipe" / "trailing pipe" regexes.

They should be:

r.replace(/^\|/, '').replace(/\|$/, '')

Because | is a regex alternation operator.

So the fallback parser can retain the outer Markdown pipes and produce malformed cells.

Recommendation

Fix immediately:

const parseRow = r =>
  r.replace(/^\|/, '')
   .replace(/\|$/, '')
   .split('|')
   .map(c => c.trim());

and:

heading = tr.replace(/^#+\s*/, '');

const isDelim = r =>
  r.every(c => !c || !/[-:\s]/g.test(c));

But I'd actually rewrite the delimiter test rather than simply correcting it.


---

2. 🔴 Critical: transpose drops the first data row

This is probably the most important functional bug.

The transpose implementation does:

const tableRows = lines.slice(3)...
...
const restRows = tableRows.slice(2);

So it effectively removes two rows after the section header. 

Given the generated structure:

# Note > Table 1

| Header |
| --- |
| Row 1 |
| Row 2 |

lines.slice(3) starts around the delimiter row, and slice(2) subsequently removes another row.

That means Row 1 can disappear during transpose.

This is an integrity problem because the UI can show a transposed representation that isn't equivalent to the source.

Correct approach

Do not parse the generated Markdown presentation format.

Transpose the already-structured data:

function transposeTable(table) {
    const rows = [
        table.headers,
        ...table.dataRows
    ];

    const width = Math.max(...rows.map(row => row.length));

    return Array.from({ length: width }, (_, col) =>
        rows.map(row => row[col] ?? "")
    );
}

Even better:

Make the structured table object the single source of truth.

Then generate:

original Markdown

transposed Markdown

chart data

CSV


from that same structure.

That eliminates multiple independent parsers.


---

3. 🔴 Critical: table parsing does not correctly handle Markdown pipes

Both server-side and client-side parsing fundamentally rely on:

.split("|")

The server parser does this directly. 

That breaks legitimate Markdown such as:

| Product | Description |
| --- | --- |
| A | Supports `a | b` |

or:

| Name | Value |
| --- | --- |
| Test | A \| B |

The parser interprets those as additional columns.

It also doesn't account for:

escaped \|

pipes inside inline code

uneven rows

empty trailing cells

malformed but recoverable tables


Recommendation

Create one robust table tokenizer.

At minimum, split only on unescaped pipes outside code spans.

This should be shared by every parser/export path.


---

4. 🔴 Critical: removeEmptyRowsAndColumns() can throw on malformed rows

This code assumes every row has the same number of cells:

filteredRows.some(
    row => row.split("|")[colIndex + 1].trim() !== ""
)

If one row is shorter, that index becomes undefined, and:

undefined.trim()

throws.

The function is therefore not robust against malformed/irregular Markdown tables. 

Safer version

Normalize rows first:

const rows = filteredRows.map(parseRow);
const columnCount = Math.max(...rows.map(r => r.length));

const normalized = rows.map(row =>
    Array.from(
        { length: columnCount },
        (_, i) => row[i] ?? ""
    )
);

Then calculate empty columns from normalized rows.


---

5. 🔴 High: server parser and client parser are two different parsers

This is an architectural integrity issue.

You have:

Server-side parser

extractStructuredTables()

and:

Client-side fallback parser

parseMarkdownTablesLocally()

They don't behave identically.

The server version produces:

{
  id,
  index,
  heading,
  noteName,
  baseName,
  displayName,
  headers,
  dataRows,
  rowCount,
  columnCount,
  rawTableMarkdown
}

while the local parser produces a somewhat different representation and different heading logic. 

That creates the possibility of:

> Same note → different parsed table → different chart.



Strong recommendation

Have one canonical parser.

Prefer:

Markdown
   ↓
Canonical Table AST
   ↓
 ┌───────────┬───────────┬───────────┐
 Chart       CSV         Markdown    Transpose

Not:

Markdown
 ↓
Parser A → chart

Markdown
 ↓
Parser B → transpose

Markdown
 ↓
Parser C → CSV

This is the biggest architectural improvement I'd make.


---

6. 🔴 High: "Histogram", "Waterfall" and "Pareto" aren't actually implemented

The UI advertises:

Histogram

Waterfall

Pareto

Mixed

Scatter

Bubble

Radar


But several aren't actually those chart types.

The code maps:

histogram → bar
waterfall → bar
pareto → bar

and isPareto / isWaterfall are defined but never used to transform the data. 

So:

Histogram

A histogram requires binning numeric values.

You're simply drawing a bar chart.

Pareto

A Pareto chart requires:

1. sort values descending


2. calculate cumulative percentage


3. display bars + cumulative line



None of that happens.

Waterfall

A waterfall needs cumulative positive/negative offsets.

That's not happening either.

Radar/Bubble

The UI labels them "3D", but they're normal Chart.js 2D radar/bubble charts.

Recommendation

Either:

A. Implement them properly, or

B. Remove the misleading options until implemented.

I'd choose A eventually, but B is better than silently producing incorrect visualizations.


---

7. 🔴 High: Pie/Doughnut/Polar charts are semantically wrong for multiple series

The code builds one dataset per selected Y column:

const datasets = selectedYIndices.map(...)

Then for pie/doughnut:

backgroundColor: isPieOrDonut ? palette : ...

But pie/doughnut charts normally represent:

labels = categories
dataset = values

not:

dataset 1 = Sales
dataset 2 = Profit
dataset 3 = Cost

The current model can therefore generate confusing or incorrect pie/doughnut charts when multiple Y series are selected. 

Recommendation

For pie-like charts:

X column → labels
ONE selected Y → values

Disable/mask additional Y selections for these chart types.

Or explicitly tell the user:

> Pie charts support one numeric series.




---

8. 🔴 High: numeric parsing silently converts bad values to zero

This is dangerous:

const parsed = parseFloat(val);
return isNaN(parsed) ? 0 : parsed;

So:

"N/A"
"unknown"
"—"
"abc"
"not available"

all become:

0

That changes the meaning of the source data.

A missing value is not the same thing as zero.

Better

return Number.isFinite(parsed) ? parsed : null;

Then let Chart.js handle null gaps.

This is especially important for financial, statistical, scientific, or operational data.


---

9. 🔴 High: numeric cleaning can corrupt values

This:

.replace(/[^0-9.-]/g, '')

has several problems.

For example:

$1,234.50

→

1234.50

Fine.

But:

1.234,50

could become:

1.23450

which is not necessarily 1234.50.

And:

10%

becomes:

10

rather than:

0.10

And:

(500)

becomes:

500

instead of:

-500

Better

Have an explicit numeric parser with documented semantics:

parseNumericCell(value)

and return:

{
    value: 500,
    valid: true,
    original: "(500)"
}

if you want maximum integrity.


---

10. 🔴 High: state is global rather than note-specific

State is persisted to:

amplenote_graph_utility_state

and the Amplenote setting:

Graph_Dashboard_State

The state contains:

activeTableIndex
selectedXIndex
selectedYIndices
chartType
theme
palette
...

but the local storage key is global. 

This means configuration for Note A can bleed into Note B.

Example:

Note A:
Table 4
X = column 3
Y = columns 5,6

Switch to Note B:
only 2 columns

The code has some bounds protection, but the conceptual state is still shared.

Better

Key state by note UUID:

amplenote_graph_utility_state:${noteUUID}

or:

{
    version: 2,
    notes: {
        "uuid-a": {...},
        "uuid-b": {...}
    }
}

I'd strongly prefer the second if you want persistence across notes.


---

11. 🟠 State migration/versioning is missing

You persist arbitrary state and hydrate it later:

if (source.chartType) state.chartType = source.chartType;
if (source.easing) state.easing = source.easing;
...

but there's no:

schemaVersion

or validation for values such as:

chartType
easing
legendPos
selectedXIndex
selectedYIndices



Eventually you will change the state schema and old persisted settings can produce strange behavior.

Add

const STATE_VERSION = 2;

{
    version: STATE_VERSION,
    noteUUID,
    ...
}

and migrate old versions.


---

12. 🔴 High: save-image fallback can cause an integrity problem

This is particularly important.

If attachment fails:

try {
    imageSrc = await note.attachMedia(dataUrl);
} catch {
    ...
}

the code keeps the original dataUrl. 

Then it embeds:

![](data:image/png;base64,...)

into the note.

That can make the note enormous.

A single chart could add hundreds of KB or several MB to note content.

Worse

If media attachment fails because of a transient problem, the code silently converts the operation into an inline base64 mutation.

I'd rather fail safely:

if (!attachmentSucceeded) {
    return {
        success: false,
        error: "Could not attach chart image to note."
    };
}

Don't silently change storage strategy.


---

13. 🔴 High: save-image operation isn't concurrency-safe

The flow is:

read note
↓
modify string
↓
replace entire note

There is no version/optimistic concurrency check.

If the user edits the note between:

getNoteContent()

and:

replaceNoteContent()

their newer edits can potentially be overwritten.

The same concern applies to other whole-note mutation paths.

Better

If Amplenote provides an atomic insertion/update operation, use it.

Otherwise:

read
→ identify exact insertion point
→ verify content/version hasn't changed
→ modify
→ replace

At minimum, re-read immediately before replacing and compare the relevant content/hash.


---

14. 🔴 High: tableIndex is positional, not identity-based

Saving an image uses:

tableIndex: state.activeTableIndex

and then counts tables from the beginning of the note. 

This is fragile.

If the note contains:

Table 1
Table 2
Table 3

and the note changes between rendering and saving, Table 2 may no longer be Table 2.

Better

Use a table identity:

table.id

plus perhaps a source range/hash.

For example:

{
    tableId: "table-2",
    sourceHash: "..."
}

Then verify the target before modifying the note.


---

15. 🟠 rawTableMarkdown replacement can replace the wrong occurrence

This:

noteContent.replace(rawTableMarkdown, ...)

replaces the first matching occurrence.

If two tables are identical:

| A | B |
|---|---|
| 1 | 2 |

then the wrong table can receive the image.

That's a genuine integrity bug.

The positional tableIndex path normally wins, but if it fails, the fallback can mutate the wrong table.

Recommendation

Never use raw Markdown string matching as a fallback identity.

Use a unique table marker/hash or source line range.


---

16. 🟠 HTML export replacement is fragile

This line:

htmlContent.replace(
    /decodeURIComponent(".*?")/,
    'decodeURIComponent("' + newEncoded + '")'
)

is brittle. 

It assumes the generated HTML contains exactly that pattern.

Future changes to the template could break export.

Better

Use a dedicated placeholder:

const PAYLOAD_PLACEHOLDER = "__GRAPH_UTILITY_PAYLOAD__";

then:

html.replace(
    PAYLOAD_PLACEHOLDER,
    encodeURIComponent(JSON.stringify(payload))
);

Much more robust.


---

17. 🟠 "Self-contained offline" export isn't actually self-contained

The exported HTML still loads:

Chart.js → cdnjs
chartjs-plugin-datalabels → cdnjs
hammer.js → cdnjs
chartjs-plugin-zoom → cdnjs
Google Fonts → fonts.googleapis.com

The original HTML explicitly creates those external <script> elements. 

Therefore:

> "Self-contained offline studio" is technically false.



If the user opens the exported HTML without Internet access, charts may fail.

Either:

bundle the libraries into the exported HTML, or

rename the feature to "Interactive HTML Dashboard".


I would definitely fix the wording.


---

18. 🔴 External script failures are silently ignored

This is subtle but important.

script.onerror = loadNext;

means:

> CDN failed → continue as though everything is okay.



At the end:

window._chartScriptsLoaded = true;

even if some or all libraries failed.

Then renderChart() waits forever:

if (typeof Chart === 'undefined' || !window._chartScriptsLoaded) {
    setTimeout(renderChart, 150);
    return;
}

If Chart.js failed:

_chartScriptsLoaded = true
Chart = undefined

and renderChart() recursively schedules itself forever.

This is a real failure mode.

You need:

let chartLoadFailed = false;

and stop retrying after a bounded number of attempts.

Better:

Promise.all(...)
    .then(() => {
        chartScriptsLoaded = true;
        renderChart();
    })
    .catch(err => {
        showFatalDependencyError(err);
    });


---

19. 🔴 Infinite render retry risk

Related to the previous issue:

setTimeout(renderChart, 150);

has no upper limit. 

If Chart.js never loads, the page continuously schedules callbacks.

Use:

let renderRetryCount = 0;
const MAX_RETRIES = 20;

or, better, don't retry at all—call renderChart() once the loader promise resolves.


---

20. 🟠 init() can execute twice

You have:

window.addEventListener('DOMContentLoaded', init);

if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
) {
    init();
}



Depending on timing, init() can be called once immediately and then again through DOMContentLoaded.

That can create duplicate event listeners.

Better

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
    init();
}

This is a clean fix.


---

21. 🟠 registerPlugins() may register plugins repeatedly

Every renderChart() calls:

registerPlugins();

which calls:

Chart.register(...)

again.

Because charts are frequently destroyed/recreated, this could repeatedly register global plugins.

Chart.js may deduplicate some registrations, but this shouldn't be relied upon.

Better

let pluginsRegistered = false;

function registerPlugins() {
    if (pluginsRegistered) return;
    ...
    pluginsRegistered = true;
}


---

22. 🟠 showToast() timers can fight each other

Every toast creates:

setTimeout(() => toast.classList.remove('show'), 2800);

Rapid actions can result in an older timer hiding a newer toast.

Example:

Toast A
100ms later
Toast B

A's timer can remove B early.

Better

Keep:

let toastTimer;

and clear it before creating the next one.


---

23. 🟠 X-axis changes unnecessarily rebuild the Y-series UI

This event:

xAxisSelect.addEventListener('change', () => {
    state.selectedXIndex = ...
    updateTableMappingControls();
})

rebuilds the Y-series list. 

That's not necessarily a bug, but the function also has logic that automatically populates selectedYIndices.

It can therefore produce surprising selection changes.

I'd separate:

updateXAxisOptions()
updateYAxisOptions()
renderChart()

rather than using one large function with side effects.


---

24. 🟠 Empty Y-series selection gets automatically repopulated

This code:

if (!state.selectedYIndices || state.selectedYIndices.length === 0) {
    state.selectedYIndices = currentTable.headers
        ...
}

means an intentionally empty selection isn't representable. 

So:

> "Select nothing"



automatically becomes:

> "Select everything except X."



That's a questionable state model.

Use:

selectedYIndices: null

for "not initialized yet", and:

[]

for "user intentionally selected none."


---

25. 🟡 CSV export is better in the UI than the backend converter

The UI export manually escapes quotes:

.replace(/"/g, '""')

which is correct CSV quoting. 

But the backend convertMarkdownToCSV() does not escape quotes:

`"${cell.trim()}"`

So:

He said "hello"

can produce malformed CSV. 

There are therefore two CSV implementations with different correctness.

Again: one canonical conversion pipeline.


---

26. 🟡 CSV isn't really CSV when multiple tables are exported

The UI generates:

# Table 1
"a","b"
"1","2"

# Table 2
"x","y"
"3","4"

That isn't a clean single CSV dataset.

The # Table 1 lines are comments in spirit, but not standard CSV comments.

Better options

Option A: one CSV per table.

Option B: one CSV with a Table column.

Option C: ZIP containing individual CSV files.

For a "Download all tables" feature, I'd choose ZIP of individual CSV files if practical.


---

27. 🟡 HTML escaping is only partially systematic

The note name is escaped:

const safeName = escapeHTML(...)

and tags are escaped. 

That's good.

But there are still many places where data is inserted into HTML using innerHTML, for example:

summary.innerHTML = '<strong>' + currentTable.columnCount + ...

Here the values are numeric, so it's okay.

Still, I'd establish a rule:

> Use textContent unless HTML markup is explicitly required.



This reduces future XSS risk.


---

28. 🟡 Payload duplication is unnecessarily expensive

The payload contains:

cleanedContent
transposeContent
structuredTables
savedState

and structuredTables itself contains:

rawTableMarkdown

So the same table information can be duplicated several times.

Then the whole thing is:

JSON.stringify()
→ encodeURIComponent()
→ inserted into HTML

For large notes, this can become expensive.

Better

Send only the canonical structured data:

{
    noteUUID,
    noteName,
    noteTags,
    tables,
    savedState
}

Generate cleaned/transposed Markdown locally.

That reduces payload size and eliminates another source of inconsistency.


---

29. 🟡 escapeHTML() assumes string input

return str.replace(...)

If a non-string value somehow reaches it, it throws.

The current calls mostly provide strings, but robust utility functions should normalize:

String(str ?? "")


---

30. 🟡 Error responses expose raw exception messages

For example:

return {
    success: false,
    error: error.message
};

This is useful during development but can expose implementation details.

I'd use:

console.error(...)
return {
    success: false,
    error: "The operation failed."
}

and optionally a debug identifier.


---

31. 🟡 saveState accepts essentially arbitrary payload

The bridge accepts:

payload

and serializes it directly:

JSON.stringify(payload)

There is no schema validation.

That makes the persistence boundary loose.

Better

Validate:

{
    version,
    noteUUID,
    chartType,
    ...
}

and reject unknown/invalid values.


---

32. 🟡 Current_Note_UUID [Do not Edit!] is being treated as a mutable global

The comment says:

[Do not Edit!]

yet the application itself changes it repeatedly. 

That's confusing from an integrity perspective.

I'd rename it to something like:

Graph Utility Current Note UUID

or maintain it exclusively inside the Graph Utility state.


---

33. 🟡 lastActiveNoteUUID and noteUUID state semantics aren't consistent

The renderer checks:

savedState.lastActiveNoteUUID

but the state initialization shown uses:

noteUUID

and switching notes updates:

state.noteUUID

not lastActiveNoteUUID.  

So the renderer's fallback appears to depend on a field that isn't consistently maintained.

I'd standardize on:

state.noteUUID


---

34. 🟡 State should be reset more deliberately on note switch

When switching notes, you reset:

activeTableIndex = 0

but don't reset everything:

selectedXIndex
selectedYIndices
isTransposed
chartType

Some of these may be useful to preserve, but the behavior should be explicit.

I'd define:

resetNoteDependentState()

and:

preserveGlobalPreferences()

For example:

Preserve globally

theme

palette

easing

panel layout

animation preferences


Reset per note

table

X axis

Y axes

transpose


Potentially preserve per note

chart configuration


This gives you a proper state model.


---

35. 🟢 Good things in the code

There is a lot that is solid and worth keeping.

Good error boundary

The bridge has a centralized catch:

catch (error) {
    console.error(...)
    return { success: false, error: error.message };
}



Good bounds checking

The table mapping logic correctly protects against stale indexes:

if (state.selectedXIndex >= currentTable.headers.length) {
    state.selectedXIndex = 0;
}

and filters stale Y indexes. 

Good CSV quote escaping in the UI

This part is correct:

.replace(/"/g, '""')



Good use of textContent

For dynamically created series labels:

text.textContent = h

rather than injecting HTML. 

Good cleanup of old Chart.js instance

if (chartInstance) {
    chartInstance.destroy();
}



Good persistence debounce

The 300 ms debounce is sensible:

clearTimeout(saveTimeout)
...
setTimeout(...)




---

What I would fix first

If you're going to give another coding agent an implementation task, I would not ask it to "improve the code" generally.

I'd give it this priority order:

P0 — Data integrity

1. Fix client parser regex bugs.


2. Replace both Markdown parsers with one canonical parser.


3. Handle escaped pipes / code spans.


4. Normalize uneven rows safely.


5. Fix transpose so it is lossless.


6. Stop converting invalid numbers to zero.


7. Make table identity stable.


8. Make save-to-note concurrency-safe.


9. Never fall back to base64 image insertion after attachment failure.


10. Never use rawTableMarkdown.replace() as an ambiguous table identity.



P1 — Correctness

11. Implement real histogram.


12. Implement real Pareto.


13. Implement real waterfall.


14. Correct pie/doughnut data model.


15. Remove "3D" from Bubble/Radar unless actually implemented.


16. Unify CSV conversion.


17. Define proper multi-table CSV export.



P1 — State integrity

18. Namespace state per note.


19. Add state schema version.


20. Validate persisted state.


21. Standardize noteUUID / lastActiveNoteUUID.


22. Explicitly separate global vs note-specific preferences.



P2 — Reliability

23. Replace script-loader callbacks with a Promise.


24. Detect CDN failures.


25. Stop infinite renderChart() retry.


26. Prevent duplicate init().


27. Prevent repeated plugin registration.


28. Improve toast timer management.



P2 — Architecture

29. Make StructuredTable the single source of truth.


30. Generate all representations from it.


31. Reduce payload duplication.


32. Introduce small pure functions for parsing, normalization, numeric conversion, transposition, and export.




---

The architecture I'd aim for

The biggest improvement isn't another collection of defensive ifs.

I'd restructure the data pipeline around this:

Amplenote Markdown
                           │
                           ▼
                  ┌─────────────────┐
                  │ Canonical Parser│
                  └────────┬────────┘
                           │
                           ▼
                  StructuredTable[]
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
       Chart            Export           Transform
          │                │                │
          ▼                ▼                ▼
     Chart.js       CSV / Markdown      Transpose

And each table should carry something like:

{
    id,
    sourceHash,
    heading,
    headers,
    rows,
    sourceStart,
    sourceEnd
}

Then:

Charting never parses Markdown.

Transpose never parses Markdown.

CSV never parses Markdown.

Save-to-note identifies the table using identity/source information rather than table position alone.

That would eliminate a large class of bugs simultaneously.

Bottom line

The project is past the "basic bug fixing" stage. The UI/feature layer is fairly mature, but the data-integrity layer needs one deliberate refactor.

The most important principle I'd enforce now is:

> Parse once → normalize once → use the normalized table everywhere.



That will make this substantially more reliable than continuing to patch the individual parsing/export/chart paths independently. 