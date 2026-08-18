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
- `saveImageToNote`: Reads the active note's content freshly immediately before replacement to prevent lost updates, locates the specific table line index, attaches the image to Amplenote CDN media (`note.attachMedia`), and uses `app.replaceNoteContent` to safely inject a markdown image tag (`![]()`) above the table. Attachment errors are handled distinctly with fallback alerts.
- `copyTablesToNewNote`: Creates a new note via `app.createNote` and populates it with all parsed markdown tables.
- `saveState` & `getState`: Persists and restores dashboard UI state with **Per-Note State Isolation** (`version: 1, notes: { [noteUUID]: state }`).

### 2. State & Payload Injection (`lib/features/renderEmbed.js`)
When the embed is launched, the Host collects the current note's UUID (resolved via `app.findNote`), content, structured tables, and persisted settings.
These are serialized into a JSON payload object injected into the HTML document inside a `<script type="application/json" id="plugin-payload">` tag with `\u003c` escaping, completely eliminating script breakout and template interpolation vulnerabilities.

### 3. The Interactive Dashboard (`lib/ui/htmlTemplate.js`)
A responsive 3-pane data studio featuring:
- **Script Loader & State Machine**: Sequentially loads `Chart.js`, `chartjs-plugin-datalabels`, `hammer.js`, and `chartjs-plugin-zoom` with state tracking (`window._chartScriptsState: "loading" | "ready" | "failed"`). Dispatches `chartsReady` on completion and `chartsError` on CDN failure, gracefully notifying users without infinite loops.
- **Per-Note State Hydration & Persistence**: Decodes the injected payload and hydrates the local `state` scoped to `currentNoteUUID` in both `localStorage` and `app.setSetting`. Snapshot cloning (`JSON.parse(JSON.stringify(state))`) prevents asynchronous mutation races.
- **Comprehensive Numeric Cell Parser (`parseNumericCell`)**:
  - Strips HTML tags, Markdown link syntax `[100](url)`, and styling (`**`, `*`, `_`, `~`, `==`, `` ` ``).
  - Handles accounting negatives `(1,234.50)` $\to$ `-1234.50`.
  - Normalizes metric multipliers (`10k` $\to$ `10000`, `1.5M` $\to$ `1500000`, `2.4B` $\to$ `2400000000`).
  - Correctly parses European decimals `1.234,56` vs US format `1,234.56`.
  - Protects ISO dates (`2026-01-15`) from numeric corruption so they remain category labels.
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

### 4. Utilities (`lib/utils/`)
- `markdownParser.js`: Heading-aware table extraction (`extractStructuredTables`, `extractTablesFromMarkdown`), escaped pipe (`\|`) tokenization via `splitTableRow()`, column width preservation, and header sanitization (`cleanHeaderName`).
- `tableTranspose.js`: Pure matrix transposition (`transposeArray`, `transposeStructuredTable`, `transposeMarkdownTables`) supporting ragged rows, pipe escaping, and standalone delimiter boundaries (`/(?:^|\n)\s*---+\s*(?:\n|$)/`).
- `csvConverter.js`: Converts parsed table rows into RFC 4180 standard CSV strings with internal quote escaping (`""`).

## Key Design Patterns

- **Vanilla JS**: The embed avoids heavy frameworks like React to ensure rapid loading, no bundle bloat, and minimal memory footprint inside the Amplenote container.
- **Offline Resilience**: The "Download Interactive HTML" feature exports the full `document.documentElement.outerHTML`, dynamically replacing the `<script id="plugin-payload">` JSON content using dynamically assembled tag boundaries (`'<' + '/script>'`) so the exported file retains the exact state and theme offline without script breakout.
