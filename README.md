# Graph Utility Plugin

A powerful Amplenote plugin that parses markdown tables within your notes and visualizes them as interactive, responsive, and customizable charts using Chart.js inside a dedicated workbench.

- 📊 **Rich Multi-Series Visualizations**: Support for Simple (Line, Bar, Area, Histogram, Pie, Doughnut, Polar Area, Waterfall) and Advanced (Mixed Bar/Line, Pareto, Scatter, 3D Bubble, 3D Radar) charts.
- 🔄 **Dual-Layer State Persistence**: Automatically remembers where you left off (active note, table selection, chart type, selected series, custom colors, theme, and sidebar layout) across reloads, sessions, and devices.
- 🖥️ **Flexible Workspace Launch**: Choose between a dedicated Fullscreen Dashboard tab (`app.openEmbed`) or a compact Sidebar Peek Viewer (`app.openSidebarEmbed`).
- 🎨 **Cyclic Theming**: Switch smoothly between *Dark*, *Light*, *Midnight*, *Forest*, and *Cyberpunk* themes. Exports are theme-aware, embedding the exact colors you see.
- 📈 **Interactive Pro Plugins**: Native support for scroll-wheel Zoom, Pan, and Data Labels overlays built directly into the canvas.
- 🗂️ **Heading-Aware Table Navigation**: Tables are automatically indexed with their preceding note headings (e.g. `Note > Financials > Table 1 (4 cols × 12 rows)`).
- 🔁 **Rows ⇄ Cols Transposition**: Instantly transpose markdown tables on the fly without modifying source markdown.
- 💾 **Export & Save Options**:
  - Insert chart snapshot directly above the active table in your note.
  - 1-click Copy chart to clipboard.
  - Download high-res PNG image.
  - Download self-contained offline Interactive HTML Dashboard (preserves your exact chart state/theme).
  - Export raw table data to CSV or MD.
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
- **Left Panel**: Switch notes, refresh data, select heading-labeled tables, transpose rows/columns.
- **Center Canvas**: Interactive Chart.js canvas with chart type switcher pills, theme cycling, and export menu.
- **Right Panel**: Select X-axis label column, multi-select Y-axis series (with 1-click "Select All"), change color palettes, and toggle curve smoothing / fill area / grid lines.

---

## Architecture & Development

- `Graph Utility.js`: Plugin entry point exposing `appOption`, `noteOption`, `renderEmbed`, and `onEmbedCall` bridge.
- `lib/features/`: Modular handlers for launching (`launcher.js`), host bridge actions (`onEmbedCall.js`), and embed generation (`renderEmbed.js`).
- `lib/ui/htmlTemplate.js`: Responsive 3-pane interactive dashboard with Chart.js, embedded SVG favicon, and debounced state persistence.
- `lib/utils/`: Pure utilities for heading-aware parsing (`markdownParser.js`), array transposition (`tableTranspose.js`), and CSV conversion (`csvConverter.js`).
- `build/graph-utility.compiled.js`: Self-contained IIFE bundled with `esbuild`.