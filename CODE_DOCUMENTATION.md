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
- `saveImageToNote`: Reads the active note's content, locates the specific table line index, attaches the image to Amplenote CDN media (`note.attachMedia`), and uses `app.replaceNoteContent` to safely inject a markdown image tag (`![]()`) above the table.
- `copyTablesToNewNote`: Creates a new note via `app.createNote` and populates it with all parsed markdown tables.
- `saveState` & `getState`: Persists and restores dashboard UI state across sessions and devices.

### 2. State & Payload Injection (`lib/features/renderEmbed.js`)
When the embed is launched, the Host collects the current note's UUID (resolved via `app.findNote`), content, structured tables, and persisted settings.
These are serialized into a JSON payload object injected into the HTML document inside a `<script type="application/json" id="plugin-payload">` tag with `\u003c` escaping, completely eliminating script breakout and template interpolation vulnerabilities.

### 3. The Interactive Dashboard (`lib/ui/htmlTemplate.js`)
A responsive 3-pane data studio featuring:
- **Sequential Script Loader & Retry Threshold**: Sequentially loads `Chart.js`, `chartjs-plugin-datalabels`, `hammer.js`, and `chartjs-plugin-zoom` with a bounded retry threshold (`chartRetries < 25`) to prevent race conditions in sandboxed iframes.
- **State Hydration & Persistence**: Decodes the injected payload and hydrates the local `state` model. Mutations trigger debounced persistence (300ms) to `localStorage` and `app.setSetting`.
- **In-Memory Structured Table Transposition (`transposeTableObj`)**: Transposes the structured table data matrix directly in memory, recalculating column/row counts, clean headers, and data series without risking Markdown re-parsing errors.
- **Flexible X-Axis & Observation Engine (`updateTableMappingControls`)**: Supports both column-based category mapping and `Auto / Row Index (1, 2, 3...)` mode (`selectedXIndex = -1`). When X is cleared via `Remove from X`, all table columns become available as concurrent Y-series.
- **Smart Series Toggle**: The series header button dynamically evaluates selection state, flipping between `Select All` and `Select #1` with one click.
- **Expanded Theme Library (10 Themes)**: Comprehensive CSS token system supporting `dark`, `light`, `midnight`, `forest`, `cyberpunk`, `dracula`, `nord`, `tokyo-night`, `solarized-light`, and `monokai`.
- **Curated Color Palettes (11 Palettes)**: Handcrafted multi-color schemes including `modern`, `oceanic`, `aurora`, `neon`, `emerald`, `sunset`, `autumn`, `vintage`, `candy`, `pastel`, and `monochrome`.
- **Chart.js Rendering Engine (`renderChart`)**: Maps active data series to Chart.js datasets with dynamic color palettes, animation easing, and custom background canvas drawing (`customCanvasBackgroundColor`) for pristine image exports.

### 4. Utilities (`lib/utils/`)
- `markdownParser.js`: Heading-aware table extraction (`extractStructuredTables`, `extractTablesFromMarkdown`), delimiter row cleaning, and header sanitization (`cleanHeaderName`).
- `tableTranspose.js`: Pure matrix transposition (`transposeArray`, `transposeStructuredTable`, `transposeMarkdownTables`) supporting ragged rows and standalone delimiter boundaries (`/(?:^|\n)\s*---+\s*(?:\n|$)/`).
- `csvConverter.js`: Converts parsed table rows into RFC 4180 standard CSV strings with internal quote escaping (`""`).

## Key Design Patterns

- **Vanilla JS**: The embed avoids heavy frameworks like React to ensure rapid loading, no bundle bloat, and minimal memory footprint inside the Amplenote container.
- **Offline Resilience**: The "Download Interactive HTML" feature exports the full `document.documentElement.outerHTML`, dynamically replacing the `<script id="plugin-payload">` JSON content using dynamically assembled tag boundaries (`'<' + '/script>'`) so the exported file retains the exact state and theme offline without script breakout.
