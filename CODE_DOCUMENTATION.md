# Graph Utility - Code Documentation

This document describes the technical implementation and core algorithms of the Graph Utility Amplenote Plugin.

## Architecture Overview

The plugin operates as a hybrid bridge application:
- **The Host (Amplenote)**: The `Graph Utility.js` entrypoint runs inside Amplenote. It manages reading notes, calling Amplenote APIs (`app.getNoteContent`, `app.replaceNoteContent`, `app.filterNotes`), and managing settings.
- **The Embed (Dashboard)**: An iframe (embed) spawned by the Host containing a self-contained HTML/CSS/JS web application (`htmlTemplate.js`).

## Core Components

### 1. The Host Bridge (`lib/features/onEmbedCall.js`)
Handles bidirectional communication between the iframe embed and the Amplenote runtime:
- `openNote`: Uses `app.navigate` to jump to a note URL.
- `refreshData`: Fetches the active note via `app.findNote({ uuid })` / `app.getNoteContent`, extracts structured markdown tables, and returns them to the embed.
- `saveImageToNote`: High-integrity image insertion with strict concurrency and table-identity verification:
  - **Absolute Table Scanning**: Scans `freshContent` into structured table entries (`foundTables = [{ startLine, raw }]`), preserving exact line numbers and content.
  - **Dual-Path Concurrency Decision Tree**:
    - **Unchanged Note (`!noteChanged`)**: Positional structural identity is reliable. Matches table by absolute `tableIndex` and verifies `rawTableMarkdown`, safely handling duplicate identical tables at distinct positions.
    - **Changed Note (`noteChanged`)**: Positional identity is discarded. Requires an unambiguous, unique content match (`matchingTableIndices.length === 1`). If zero or multiple duplicate matches exist after a concurrent edit, the operation safely aborts to prevent misplacing the image above the wrong table.
  - **Media Attachment**: Uploads the PNG chart to Amplenote CDN media (`note.attachMedia`), handles errors distinctly, and uses `app.replaceNoteContent` to inject `![]()` markdown directly above the target table.
- `copyTablesToNewNote`: Creates a new note via `app.createNote` and populates it with all parsed markdown tables.
- `saveState` & `getState`: Persists and restores dashboard UI state with **Per-Note State Isolation** (`version: 1, notes: { [noteUUID]: state }`).
- `insertFormulaTableToNote`: Creates a dedicated new note titled `Math Graph — <Formula>` tagged with `-reports/-math-graph`, populates it with domain metadata and a clean Markdown coordinate table, and navigates to the new note.
- `saveFormulaImageToNote`: Captures the canvas rendering of the mathematical function plot, creates a new note titled `Math Graph — <Formula>` tagged with `-reports/-math-graph`, uploads the PNG media asset via `note.attachMedia`, embeds the image, and navigates to the new note.

### 2. State & Payload Injection (`lib/features/renderEmbed.js`)
When the embed is launched, the Host collects the current note's UUID (resolved via `app.findNote`), content, structured tables, and persisted settings.
These are serialized into a JSON payload object injected into the HTML document inside a `<script type="application/json" id="plugin-payload">` tag with `\u003c` escaping, completely eliminating script breakout and template interpolation vulnerabilities.

### 3. Mathematical Formula Parsing & Evaluation Engine (`lib/utils/mathEvaluator.js`)
A secure, custom AST-based mathematical evaluation engine completely isolated from `eval()` or `Function()` constructors:
- **Lexical Tokenizer (`tokenizeMath`)**: Converts raw mathematical expressions (e.g. `2x + sin(3x)`) into structured tokens (`NUMBER`, `VARIABLE`, `CONSTANT`, `FUNCTION`, `OPERATOR`, `LPAREN`, `RPAREN`, `COMMA`).
- **Implicit Multiplication Resolution**: Automatically detects adjacent operand/variable/parentheses pairs (such as `2x`, `3sin(x)`, `(x+1)(x-1)`, `4pi*x`) and injects binary multiplication tokens.
- **Recursive-Descent AST Parser (`parseMathTokens`)**: Parses token streams according to operator precedence and associativity (`+`/`-` at precedence 1, `*`/`/`/`%` at precedence 2, unary negation and exponentiation `^` right-associative at precedence 3). Builds an Abstract Syntax Tree.
- **Defensive AST Evaluator (`evaluateAst`)**: Recursively evaluates nodes for any real variable $x$. Safely traps division-by-zero, negative square roots, and infinite asymptotes by returning `null`/`NaN` without crashing the runtime.
- **Multi-Curve Sampler & Markdown Table Generator (`lib/utils/formulaSampler.js`)**:
  - `sampleMultiFormulas`: Samples active formulas across the user-configured domain $[x_{min}, x_{max}]$ with linear steps across $N$ points, producing smooth Chart.js dataset series.
  - `generateFormulaMarkdownTable`: Creates standard Markdown coordinate tables with formatted headers and escaped pipe symbols for seamless Amplenote note insertion.

### 4. The Interactive Dashboard (`lib/ui/htmlTemplate.js`)
A responsive 3-pane data studio featuring:
- **Dual Source Modes (`sourceMode: "tables" | "formulas"`)**: Seamless toggle between Markdown Table visualization and Mathematical Function Plotting.
- **Dynamic Mode-Aware Export Menu**:
  - Automatically alternates export options between `#exportTablesGroup` and `#exportFormulasGroup` on mode switch.
  - Generates self-contained interactive HTML dashboards, RFC 4180 CSV tables, clean Markdown documents, and direct note publications.
- **Formula Workbench Architecture**:
  - Left Panel: Studio summary banner, domain bounds $[x_{min}, x_{max}]$ with dual stepper buttons, sampling resolution slider ($20\text{--}600$ points), and prominent `Generate Chart` action.
  - Right Panel: Curve preset selector and active function manager $y = f(x)$ with individual color tags and live AST validation.
- **Interactive Zoom, Pan & Dynamic Reset (`checkZoomState`)**:
  - Integrates `chartjs-plugin-zoom` with smooth wheel zooming and touch/mouse panning.
  - Hooks `onZoomComplete` and `onPanComplete` callbacks to dynamically toggle the `#resetZoomBtn` toolbar button only when zoomed or panned.
- **Universal Theme-Aware Custom Scrollbars**:
  - Full cross-browser scrollbar CSS (`scrollbar-width: thin; scrollbar-color: var(--border-hover) transparent;` + `::-webkit-scrollbar` styling) applied to all panels, dropdowns, and lists across all 10 color themes.
- **Script Loader & State Machine**: Sequentially loads `Chart.js`, `chartjs-plugin-datalabels`, `hammer.js`, and `chartjs-plugin-zoom` with state tracking (`window._chartScriptsState: "loading" | "ready" | "failed"`). Dispatches `chartsReady` on completion and `chartsError` on CDN failure, gracefully notifying users without infinite loops.
- **Per-Note State Hydration & Persistence**: Decodes the injected payload and hydrates the local `state` scoped to `currentNoteUUID` in both `localStorage` and `app.setSetting`. Includes strict input sanitization (`Number.isInteger` bounds checks for `activeTableIndex >= 0`, `selectedXIndex >= -1`, and filtering `selectedYIndices` against negative or invalid indices). Snapshot cloning (`JSON.parse(JSON.stringify(state))`) prevents asynchronous mutation races.
- **Responsive Narrow-Screen Studio & Mobile Backdrop**:
  - Automatically evaluates viewport dimensions on open (`isNarrowScreen()` checking `window.innerWidth <= 900` or `matchMedia('(max-width: 900px)')`).
  - Automatically collapses both the left (Data & Chart) and right (Series & Mapping) panels on narrow resolutions so the canvas is the primary focus.
  - Features an interactive mobile backdrop (`#panelBackdrop`) that allows 1-tap dismissal of floating sidebars.
  - Enforces mutual panel exclusivity on mobile (opening one sidebar automatically collapses the other) and clamps panel widths (`max-width: min(320px, 85vw)`).
- **High-Performance Numeric Cell Parser (`parseNumericCell`)**:
  - Immediate `RE_PURE_NUMBER` fast path for standard integer and floating point strings, bypassing multi-step regex pipelines for >80% of table cells.
  - All regular expressions (`RE_HTML_TAGS`, `RE_MARKDOWN_LINK`, `RE_MARKDOWN_STYLES`, `RE_STRIP_CHARS`, etc.) are pre-compiled static constants.
  - Strips HTML tags, Markdown link syntax `[100](url)`, and styling (`**`, `*`, `_`, `~`, `==`, `` ` ``).
  - Handles accounting negatives `(1,234.50)` $\to$ `-1234.50`.
  - Normalizes metric multipliers (`10k` $\to$ `10000`, `1.5M` $\to$ `1500000`, `2.4B` $\to$ `2400000000`).
  - Correctly parses European decimals `1.234,56` vs US format `1,234.56`.
  - Protects ISO dates (`2026-01-15`) from numeric corruption so they remain category labels.
- **Event Delegation & Batched DOM Rendering**:
  - Replaced individual event listeners on each series checkbox with a single delegated event listener on `#ySeriesContainer`.
  - Uses `DocumentFragment` to batch control elements, reducing DOM reflows and eliminating memory leaks on repeated table switches.
- **Advanced Chart Semantics**:
  - **Pareto Chart**: Automatically calculates descending frequency order and dual-axis visualization (primary bar dataset on `y` + cumulative percentage line dataset on `y1` bounded $0\text{--}100\%$).
  - **Histogram**: Implements continuous frequency binning across numerical ranges.
  - **Waterfall Chart**: Calculates sequential step deltas and builds floating step bars `[prev, running]` with positive (green) and negative (red) coloration.
- **In-Memory Structured Table Transposition (`transposeTableObj`)**: Transposes the structured table data matrix directly in memory, recalculating column/row counts, clean headers, and data series without risking Markdown re-parsing errors.
- **Flexible X-Axis & Observation Engine (`updateTableMappingControls`)**: Supports both column-based category mapping and `Auto / Row Index (1, 2, 3...)` mode (`selectedXIndex = -1`). Automatically filters available Y-series to columns containing valid numerical data.
- **Smart Series Toggle**: The series header button dynamically evaluates selection state, flipping between `Select All` and `Select #1` with one click.
- **Expanded Theme Library (10 Themes)**: Comprehensive CSS token system supporting `dark`, `light`, `midnight`, `forest`, `cyberpunk`, `dracula`, `nord`, `tokyo-night`, `solarized-light`, and `monokai`.
- **Curated Color Palettes (11 Palettes)**: Handcrafted multi-color schemes including `modern`, `oceanic`, `aurora`, `neon`, `emerald`, `sunset`, `autumn`, `vintage`, `candy`, `pastel`, and `monochrome`.
- **Chart.js Rendering Engine (`renderChart`)**: Maps active data series to Chart.js datasets with dynamic color palettes, animation easing, `spanGaps: true`, and custom background canvas drawing (`customCanvasBackgroundColor`) for pristine image exports.

### 5. Utilities (`lib/utils/`)
- `markdownParser.js`: Heading-aware table extraction (`extractStructuredTables`, `extractTablesFromMarkdown`), fast-path string tokenization in `splitTableRow()` for rows without backslashes, in-place column normalization in `removeEmptyRowsAndColumns()`, and header sanitization (`cleanHeaderName`).
- `tableTranspose.js`: Pure matrix transposition (`transposeArray`, `transposeStructuredTable`, `transposeMarkdownTables`) using a single-pass O(N) linear algorithm with pre-allocated result matrices (`new Array(maxCols)`), completely eliminating call-stack overflow risks on massive datasets.
- `csvConverter.js`: Converts parsed table rows into RFC 4180 standard CSV strings with internal quote escaping (`""`).
- `mathEvaluator.js`: Pure mathematical lexer, Pratt/recursive-descent parser, and AST evaluator.
- `formulaSampler.js`: Multi-curve domain sampler and Markdown table exporter.

## Key Design Patterns

- **Vanilla JS & GPU Optimization**: The embed avoids heavy frameworks like React to ensure rapid loading, no bundle bloat, and minimal memory footprint inside the Amplenote container, with CSS `will-change: width, transform` for 60fps animations.
- **Offline Resilience**: The "Download Interactive HTML" feature exports the full `document.documentElement.outerHTML`, dynamically replacing the `<script id="plugin-payload">` JSON content using dynamically assembled tag boundaries (`'<' + '/script>'`) so the exported file retains the exact state and theme offline without script breakout.
