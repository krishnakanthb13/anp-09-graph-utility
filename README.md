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
- ⚡ **Dynamic Multi-Series Toggling**: Effortlessly switch between all data series with the smart **`Select All` ⇄ `Select #1`** toggle and auto-detected numeric columns.
- 🔒 **Per-Note State Isolation & Dual-Layer Persistence**: Automatically remembers your exact chart configuration scoped per note UUID across reloads, sessions, and devices. Switching between different notes never overwrites or leaks column selections.
- 🖥️ **Flexible Workspace Launch**: Choose between a dedicated Fullscreen Dashboard tab (`app.openEmbed`) or a compact Sidebar Peek Viewer (`app.openSidebarEmbed`).
- 🎨 **10 Curated Designer Themes**: Seamlessly cycle between *Dark*, *Light*, *Midnight*, *Forest*, *Cyberpunk*, *Dracula*, *Nord*, *Tokyo Night*, *Solarized Light*, and *Monokai*. Canvas backgrounds automatically synchronize for clean image and HTML exports.
- 🌈 **11 Curated Color Palettes**: Choose from *Vibrant & Modern*, *Oceanic Blues & Teals*, *Cosmic Aurora Glow*, *Cyberpunk Neon*, *Emerald Nature*, *Sunset Gradient*, *Autumn Amber & Copper*, *Retro 80s Vintage*, *Candy Berry Pop*, *Soft Pastel*, and *Monochrome Slate*.
- 📈 **Interactive Pro Plugins**: Native support for scroll-wheel Zoom, Pan, and auto-formatted Data Labels overlays built directly into the canvas.
- 🗂️ **Heading-Aware Table Navigation**: Tables are automatically indexed with their preceding note headings (e.g. `Note > Financials > Table 1 (4 cols × 12 rows)`).
- 🔁 **Rows ⇄ Cols In-Memory Transposition**: Instantly transpose markdown tables on the fly with intact headers, escaped pipes (`\|`), and preserved column structure without modifying source markdown.
- 💾 **Export & Save Options**:
  - Insert chart snapshot directly above the active table in your note (with absolute table scanning, duplicate table disambiguation, and concurrent modification protection).
  - 1-click Copy chart image to clipboard.
  - Download high-res PNG image.
  - Download self-contained offline Interactive HTML Dashboard (preserves your exact chart state/theme).
  - Export raw table data to RFC 4180 compliant CSV or formatted Markdown.
  - Copy all tables from the active note to a new note.
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
- **Left Panel**: Switch notes, refresh data, select heading-labeled tables, choose chart types, and toggle Rows ⇄ Cols transposition.
- **Center Canvas**: Interactive Chart.js canvas with live stat chips (Rows, Cols, Series), replay animation button, theme cycler, and full export menu.
- **Right Panel**: Select X-axis label column (or click **`Remove from X`** for auto row indexing), toggle Y-axis series with the smart **`Select All` / `Select #1`** button, select curated color palettes, and fine-tune animation easing, curve smoothing, area fills, and grid lines.

---

## Architecture & Development

- `Graph Utility.js`: Plugin entry point exposing `appOption`, `noteOption`, `renderEmbed`, and `onEmbedCall` bridge.
- `lib/features/`: Modular handlers for launching (`launcher.js`), host bridge actions (`onEmbedCall.js`), and embed generation (`renderEmbed.js`).
- `lib/ui/htmlTemplate.js`: Responsive 3-pane interactive dashboard with Chart.js, embedded SVG/PNG favicon, and debounced per-note state persistence.
- `lib/utils/`: Pure utilities for heading-aware parsing (`markdownParser.js`), structured & array transposition (`tableTranspose.js`), and CSV conversion (`csvConverter.js`).
- `build/graph-utility.compiled.js`: Self-contained IIFE bundled with `esbuild`.