# Graph Utility Plugin

A powerful Amplenote plugin that parses markdown tables within your notes and visualizes them as interactive, responsive, and customizable charts using Chart.js inside a dedicated workbench.

- 📊 **Rich Multi-Series Visualizations**: Support for Standard (Line, Bar, Area, Histogram, Pie, Doughnut, Polar Area, Waterfall) and Advanced (Mixed Bar/Line, Pareto 80/20 Rule, Scatter, Bubble Chart, Radar Chart).
- 🧠 **True Chart Semantics**:
  - **Pareto Chart**: Automatically sorts rows descending by frequency and renders a dual-axis visualization (primary value bars + secondary $0\text{--}100\%$ cumulative percentage curve).
  - **Histogram**: Computes continuous frequency binning ranges and bar distribution counts.
  - **Waterfall Chart**: Displays sequential step-by-step positive (green) and negative (red) floating delta bars.
- 🔢 **Smart & Resilient Data Parsing**:
  - Automatically handles currency symbols (`$`, `€`, `£`, `₹`, `¥`), percentages, and commas.
  - Expands metric multipliers (`10k`, `1.5M`, `2.4B`, `1T`).
  - Supports accounting negative numbers `(1,234.50)` $\to$ `-1234.50`.
  - Intelligently differentiates European decimals (`1.234,56`) from US format (`1,234.56`).
  - Protects ISO dates (`2026-01-15`) from being mangled so they stay cleanly on category axes.
  - Strips Markdown styling (`**bold**`, `*italic*`, `[links](url)`) and HTML tags from numbers automatically.
- 📐 **Flexible X-Axis & Observation Mapping**: Choose any table column as the X-axis label, or use **`Remove from X`** / **`Auto Row Index (1, 2, 3...)`** to chart pure numerical datasets across all columns without sacrificing an X column.
- 📱 **Responsive Mobile & Narrow-Screen Workbench**: Automatically collapses left and right panels on narrow screen resolutions ($\le 900\text{px}$) with an interactive backdrop overlay, mutual panel exclusivity, and fluid GPU-accelerated transitions.
- ⚡ **High-Speed Parsing & Memory Optimization**:
  - Accelerated numeric parsing with immediate fast paths for raw numbers (>80% of data cells) and pre-compiled regex objects.
  - Event delegation and batched `DocumentFragment` rendering for instant, zero-leak multi-series switching.
  - Linear single-pass O(N) array transposition with pre-allocated matrices.
- 🔒 **Per-Note State Isolation & Dual-Layer Persistence**: Automatically remembers your exact chart configuration scoped per note UUID across reloads, sessions, and devices. Switching between different notes never overwrites or leaks column selections.
- 🖥️ **Flexible Workspace Launch**: Choose between a dedicated Fullscreen Dashboard tab (`app.openEmbed`) or a compact Sidebar Peek Viewer (`app.openSidebarEmbed`).
- 🎨 **10 Curated Designer Themes**: Seamlessly cycle between *Dark*, *Light*, *Midnight*, *Forest*, *Cyberpunk*, *Dracula*, *Nord*, *Tokyo Night*, *Solarized Light*, and *Monokai*. Canvas backgrounds automatically synchronize for clean image and HTML exports.
- 🌈 **11 Curated Color Palettes**: Choose from *Vibrant & Modern*, *Oceanic Blues & Teals*, *Cosmic Aurora Glow*, *Cyberpunk Neon*, *Emerald Nature*, *Sunset Gradient*, *Autumn Amber & Copper*, *Retro 80s Vintage*, *Candy Berry Pop*, *Soft Pastel*, and *Monochrome Slate*.
- 📈 **Interactive Pro Plugins**: Native support for scroll-wheel Zoom, Pan, and auto-formatted Data Labels overlays built directly into the canvas.
- 🧮 **Mathematical Function Plotter Engine**:
  - Pure, sandboxed mathematical expression parser and evaluator ($y = f(x)$) without `eval()` or `Function()`.
  - Full support for standard arithmetic (`+`, `-`, `*`, `/`, `^`, `%`), scientific/exponent notation (`1e3`, `1.2e-4`, `2.5E+6`), constants (`pi`, `e`, `tau`, `phi`), and 25+ mathematical functions (`sin`, `cos`, `tan`, `log`, `ln`, `exp`, `sqrt`, `cbrt`, `pow`, `abs`, `sinh`, `cosh`, `atan2`, `min`, `max`).
  - Supports implicit multiplication (`2x`, `3sin(x)`, `(x+1)(x-1)`, `4pi*x`).
  - Multi-function simultaneous plotting with individual color coding and active toggles.
  - Interactive preset curves (Sine Wave, Damped Oscillator, Sigmoid, Gaussian Bell, Sinc, Polynomial, Butterfly, Resonance).
  - Configurable domain range $[x_{min}, x_{max}]$ with separate step arrows and sampling resolution ($2\text{--}2000$ points).
  - 1-click **Save Formula Plot to Note** and **Insert Coordinate Table to Note**: automatically validates formulas server-side and creates dedicated Amplenote notes named `Math Graph — <Expression>` tagged with `-reports/-math-graph` with rich Markdown metadata.
- 🗂️ **Heading-Aware Table Navigation & Code Fence Safety**: Tables are automatically indexed with their preceding note headings (e.g. `Note > Financials > Table 1 (4 cols × 12 rows)`). Fenced code blocks (```` ``` ```` / `~~~`) are safely ignored so code examples are never charted.
- 🔁 **Rows ⇄ Cols In-Memory Transposition**: Instantly transpose markdown tables on the fly with intact headers, escaped pipes (`\|`), and preserved column structure without modifying source markdown. Chart image saves from transposed tables automatically target the original source table in your note.
- 🛡️ **Fail-Closed Document Integrity**: Strict verification prevents accidental document changes. Chart image saves never fall back to prepending at the top of notes if table identity cannot be verified.
- 💾 **Mode-Aware Export & Publishing Engine**:
  - Automatically switches the **Export Dropdown** options based on whether you are in **Tables** mode or **Math Formula** mode.
  - **Tables Mode**: Download Interactive Charts HTML, Download all Tables (MD/CSV), Copy all Tables to a new Note, Save Image Above Table in Note, Copy Chart to Clipboard, Download PNG.
  - **Math Formula Mode**: Download Interactive Math Studio HTML, Download Coordinates Table (MD/CSV), Insert Table to new Note, Save Plot Image to new Note (both tagged `-reports/-math-graph`), Copy Chart to Clipboard, Download PNG.
- 🔍 **Interactive Canvas Zoom, Pan & Dynamic Reset**:
  - Native mouse wheel zooming and touch/drag panning across both data series and mathematical curves.
  - Contextual **`Reset Zoom`** button appears in the canvas toolbar only when zoomed or panned, restoring original $[x, y]$ bounds in 1 click.
  - Informational navigation tip positioned exclusively on the Left Panel.
- 🎨 **10 Curated Designer Themes & Themed Scrollbars**:
  - Seamlessly cycle between *Dark*, *Light*, *Midnight*, *Forest*, *Cyberpunk*, *Dracula*, *Nord*, *Tokyo Night*, *Solarized Light*, and *Monokai*.
  - Full theme-aware custom scrollbar styling across all panels, dropdowns, and lists matching active color tokens.
- 🧭 **Host Bridge Interactivity**: Switch source notes, refresh data live, and jump directly to any note without closing the dashboard.

## Installation

1. **Create a Plugin Note**: Create a new note in Amplenote and name it "Graph Utility Plugin".
2. **Setup Metadata Table**: At the very top of the note, insert the metadata table:

   | Field | Value |
   | :--- | :--- |
   | `name` | Graph Utility |
   | `description` | Interactive multi-series table visualizer and chart workbench |
   | `icon` | insert_chart |
   | `setting` | Current_Note_UUID [Do not Edit!] |
   | `setting` | Graph_Dashboard_State |
   | `setting` | Last Embed View |

3. **Insert Code Block**: Below the table, insert a Javascript code block (` ```javascript `).
4. **Paste Compiled Code**: Copy the content from `build/graph-utility.compiled.js` and paste it inside the code block.
5. **Activate**: Go to **Account Settings** -> **Plugins**, and select the note.

---

## Usage

### 1. `Open Dashboard` (Note & App Option)
Launches the interactive dashboard for the current note (or opens the workspace target selector).

Inside the Dashboard:
- **Mode Switcher**: Switch seamlessly between **`Markdown Tables`** mode and **`Math Formula`** mode.
- **Left Panel (Tables Mode)**: Table Visualizer Studio banner, note switcher, refresh data, heading-labeled table picker, chart types, and Rows ⇄ Cols transposition toggle.
- **Left Panel (Formula Mode)**: Math Formula Studio banner, domain bounds $[x_{min}, x_{max}]$ with `▲`/`▼` steppers, sampling resolution slider ($20\text{--}600$ points), and prominent **`Generate Chart`** button.
- **Center Canvas**: Interactive Chart.js canvas with live stat chips (Rows, Cols, Series), contextual `Reset Zoom` button, `Replay Animation` button, theme cycler, and mode-aware **Export Menu**.
- **Right Panel**:
  - *Tables Mode*: Select X-axis label column (or click **`Remove from X`** for auto row indexing), toggle Y-axis series with **`Select All` / `Select #1`**.
  - *Formula Mode*: Choose curated curve presets and manage active functions $y = f(x)$ with color swatches and live syntax validation.
  - *Shared*: Select curated color palettes and fine-tune animation easing, curve smoothing, area fills, and grid lines.

---

## Architecture & Development

- `Graph Utility.js`: Plugin entry point exposing `appOption`, `noteOption`, `renderEmbed`, and `onEmbedCall` bridge.
- `lib/features/`: Modular handlers for launching (`launcher.js`), host bridge actions (`onEmbedCall.js`), and embed generation (`renderEmbed.js`).
- `lib/ui/htmlTemplate.js`: Responsive 3-pane interactive dashboard with Chart.js, embedded SVG/PNG favicon, math plotting engine, and debounced per-note state persistence.
- `lib/utils/`: Pure utilities for heading-aware parsing (`markdownParser.js`), structured & array transposition (`tableTranspose.js`), CSV conversion (`csvConverter.js`), safe math parsing & evaluation (`mathEvaluator.js`), and domain sampling (`formulaSampler.js`).
- `build/graph-utility.compiled.js`: Self-contained IIFE bundled with `esbuild`.