## v0.0.18 (2026-08-19)
### 🔄 Mode-Aware Dynamic Export Menu
- **Contextual Export Options**: The Export Dropdown automatically detects and toggles options between **Tables Mode** (`#exportTablesGroup`) and **Math Formula Mode** (`#exportFormulasGroup`).
- **Math Formula Dedicated Exports**:
  - ✨ *Download — Interactive Studio*: Standalone offline HTML math plotting dashboard.
  - 📝 *Download Coordinates — MD*: Clean Markdown table file of sampled $(x, y)$ coordinate points.
  - 📊 *Download Coordinates — CSV*: Spreadsheet format of all curve evaluations across the domain.
  - 📋 *Insert Table to Note*: 1-click note creation with coordinates tagged `-reports/-math-graph`.
  - 📌 *Save Plot to Note*: 1-click high-res canvas rendering note creation tagged `-reports/-math-graph`.
- **Streamlined Left Panel Ergonomics**: Consolidated export and note-saving buttons directly into the Export Dropdown menu, keeping the Left Panel clean and focused on parameter configuration.

### 🔍 Interactive Canvas Zoom, Pan & Dynamic Reset
- **Contextual `Reset Zoom` Button**: Added a dedicated `#resetZoomBtn` in the canvas toolbar that stays hidden by default and dynamically appears whenever the user zooms or pans, resetting original bounds on click.
- **Dedicated Navigation Tip**: Clean informational card positioned exclusively on the Left Panel.

### 🎨 Universal Theme-Aware Custom Scrollbars
- **Theme-Integrated Scrollbars**: Replaced un-themed browser scrollbars with custom CSS scrollbars bound to active theme tokens (`--border-color`, `--border-hover`, `--accent-primary`).
- Seamless rendering across all 10 designer themes in Chromium, Edge, Safari, and Firefox.

## v0.0.17 (2026-08-19)
### 🧮 Mathematical Formula Plotter ($y = f(x)$)
- **Sandboxed Formula Evaluator**: Pure AST-based mathematical tokenizer, Pratt/recursive-descent parser, and evaluator without `eval()` or dynamic `Function()` execution.
- **Rich Operator, Constant & Function Support**: Supports basic arithmetic (`+`, `-`, `*`, `/`, `^`, `%`), constants (`pi`, `e`, `tau`, `phi`), and 25+ mathematical functions (`sin`, `cos`, `tan`, `log`, `ln`, `exp`, `sqrt`, `cbrt`, `pow`, `abs`, `sinh`, `cosh`, `atan2`, `min`, `max`).
- **Implicit Multiplication Resolution**: Transparently recognizes expressions like `2x`, `3sin(x)`, `(x+1)(x-1)`, `4pi*x`.
- **Multi-Curve Simultaneous Plotting**: Add, toggle, and color-code multiple simultaneous mathematical functions with real-time error badge validation.
- **Curated Curve Presets**: 1-click loading of *Sine Wave*, *Damped Oscillator*, *Sigmoid*, *Gaussian Bell*, *Sinc*, *Polynomial*, *Harmonics*, *Square Root*, and *Resonance*.
- **Domain Stepper Ergonomics**: Upgraded domain bounds $[x_{min}, x_{max}]$ with large, separate **Up (`▲`)** and **Down (`▼`)** stepper buttons and sampling resolution slider ($2\text{--}2000$ points).
- **Dedicated Report Publishing**:
  - **Save Plot to Note**: Captures high-res canvas rendering and creates a dedicated Amplenote note titled `Math Graph — <Expression>` tagged with `-reports/-math-graph` with full domain metadata and formula list.
  - **Insert Table to Note**: Generates clean $(x, y)$ coordinate Markdown tables and creates a dedicated Amplenote note tagged with `-reports/-math-graph`.

## v0.0.16 (2026-08-18)
### 📱 Responsive Narrow-Screen Workbench & Mobile Backdrop
- **Automatic Panel Collapse on Narrow Screens**: The workbench automatically evaluates viewport dimensions on open (`<= 900px`), starting with both left and right panels collapsed so the chart canvas remains unobstructed.
- **Interactive Mobile Backdrop**: Added `#panelBackdrop` with smooth fade animation and 1-tap dismissal of floating sidebars.
- **Panel Mutual Exclusivity**: Opening one panel on mobile automatically closes the other, preventing viewport overlap on small devices.
- **Responsive Width Clamping**: Clamped panel widths to `max-width: min(320px, 85vw)` with GPU-accelerated transitions (`will-change: width, transform`).

### ⚡ High-Speed Parsing & Memory Optimization
- **Fast-Path Numeric Parser**: Added immediate `RE_PURE_NUMBER` fast paths for raw numbers (>80% of data cells) and hoisted all regular expressions to pre-compiled static constants.
- **Event Delegation on Series Selectors**: Replaced per-checkbox event listeners with single delegated event handling on `#ySeriesContainer`, eliminating memory leaks on repeated table switches.
- **Batched DOM Rendering**: Implemented `DocumentFragment` insertion for series controls, eliminating DOM reflow lag.
- **Linear Array Transposition**: Refactored `transposeArray` to a single-pass O(N) linear scan with pre-allocated matrices, eliminating call-stack limits on massive tables.
- **Markdown Split Fast Path**: Added fast-path string splitting in `splitTableRow` for non-escaped markdown rows.

## v0.0.15 (2026-08-18)
### 🛡️ Duplicate-Table Disambiguation & Stale-Index Concurrency Protection
- **Absolute Table Scanning**: Refactored `saveImageToNote` from index-subset matching to full linear note table scanning (`foundTables = [{ startLine, raw }]`), accurately mapping every table's exact structural position.
- **Duplicate Identical Table Resolution**: Disambiguates duplicate identical tables at distinct note positions (e.g. Table A, B, C, C selecting 2nd C) with 100% precision.
- **Strict TOCTOU & Stale-Index Collision Guard**: When a concurrent note modification is detected (`initialContent !== freshContent`), absolute table indices are completely bypassed. The algorithm requires an unambiguous unique content match (`matchingTableIndices.length === 1`). If zero or multiple duplicate matches exist after a concurrent edit, the operation safely aborts to protect note integrity.
- **State Hydration Bounds Validation**: Hardened dashboard state hydration with strict integer and bounds checks (`activeTableIndex >= 0`, `selectedXIndex >= -1`, and filtered non-negative `selectedYIndices`).
- **Comprehensive Regression Test Suite**: Added dedicated regression tests for shifted tables, multi-duplicate sequences, and concurrent modification TOCTOU abort paths (43/43 plugin tests, 251/251 workspace tests passing).

## v0.0.14 (2026-08-18)
### 🛡️ Production Hardening & Concurrency Safety
- **Optimistic Concurrency on Image Saves**: `saveImageToNote` now snapshots initial note content and performs optimistic concurrency checks against latest content, safely aborting if the note was concurrently modified or the target table shifted during image processing.
- **Unified Global Lifecycle Cleanup**: CDN loader preserves `module`, `exports`, and `define` globals, ensuring they are reliably restored on both successful loads and network errors (`script.onerror`).
- **Canonical CSV Conversion**: Consolidated `convertMarkdownToCSV` to leverage `extractStructuredTables`, properly escaping internal quotes (`""`), omitting markdown delimiter rows (`|---|`), and respecting escaped pipe literals (`\|`).
- **Waterfall Null Handling**: Non-numeric or empty cells (`null`) are now skipped rather than masked as artificial zero-value delta steps.
- **Dynamic Histogram Binning**: Dynamically scales bin counts for small sample sizes (`n <= 2`), eliminating artificial empty buckets.
- **Export Memory Management & Clipboard Safety**: Added automatic `URL.revokeObjectURL()` lifecycle cleanup on all file downloads and hardened clipboard writes with `ClipboardItem` feature detection and async error boundaries.

## v0.0.13 (2026-08-18)
### 🔒 Per-Note State Isolation & Data Integrity
- **Per-Note Workbench Isolation**: State persistence is now strictly scoped per note UUID (`version: 1, notes: { [noteUUID]: state }`). Switching between notes preserves each document's custom table, axes, and series selections without cross-note contamination.
- **Race-Safe Note Image Writes**: `saveImageToNote` fetches fresh note content immediately prior to replacement, preventing lost update overwrites if the note was edited during image upload.

### 🔢 Resilient Numeric Cell Parsing & Smart Mapping
- **Comprehensive `parseNumericCell` Engine**:
  - Automatically handles currency symbols (`$`, `€`, `£`, `₹`, `¥`), percentages, and commas.
  - Expands metric multipliers (`10k`, `1.5M`, `2.4B`, `1T`).
  - Supports accounting negative numbers `(1,234.50)` $\to$ `-1234.50`.
  - Intelligently differentiates European decimal commas (`1.234,56`) from US commas (`1,234.56`).
  - Protects ISO dates (`2026-01-15`) from being parsed as numbers so they remain clean category axis labels.
  - Strips Markdown formatting (`**bold**`, `*italic*`, `[links](url)`) and HTML tags from numbers.
- **Smart Numeric Column Auto-Detection**: Y-series default selection automatically identifies and checks columns containing valid numerical data, skipping text and comment columns.
- **Escaped Pipe (`\|`) & Column Integrity**: Added `splitTableRow()` tokenizer respecting escaped pipe characters while preserving deliberate empty columns.

### 📊 Advanced Chart Semantics
- **Pareto Chart (80/20 Rule)**: Implemented dual-axis visualization with primary descending value bars on `y` and a secondary $0\text{--}100\%$ cumulative percentage line curve on `y1`.
- **Histogram**: Implemented continuous frequency binning calculations.
- **Waterfall Chart**: Implemented floating step delta bars (`[start, end]`) with positive/negative color differentiation.
- **Clean Tooltip & Data Label Formatting**: Added locale formatting (`1,234.50`) and metric abbreviations (`1.5K`, `2.4M`) across tooltips and data label overlays.
- **Script Loader State Machine**: Added state tracking (`loading`, `ready`, `failed`) and singleton plugin registration to prevent duplicate registration errors.

## v0.0.11 (2026-08-18)
### 🎨 Theme & Palette Expansion
- **10 Designer Themes**: Added *Dracula*, *Nord*, *Tokyo Night*, *Solarized Light*, and *Monokai* alongside *Dark*, *Light*, *Midnight*, *Forest*, and *Cyberpunk*.
- **11 Curated Color Palettes**: Added *Oceanic Blues & Teals*, *Cosmic Aurora Glow*, *Autumn Amber & Copper*, *Retro 80s Vintage*, and *Candy Berry Pop*.
- **Dynamic Background Synchronization**: Live canvas background sync for all 10 themes ensures high-resolution chart snapshots and exports never have mismatched or transparent borders.

### 🛡️ API Standardization & Export Hardening
- **Amplenote SDK Compatibility**: Standardized all note lookups to `app.findNote({ uuid })` with graceful legacy fallbacks.
- **RFC 4180 CSV Quote Escaping**: Added internal double-quote escaping (`""`) for standard spreadsheet compliance.
- **Offline HTML Export Fidelity**: Fixed interactive HTML download script tag replacement, preserving exact customized user state and active theme in exported offline dashboards.
- **Chart.js CDN Load Retry Guard**: Added a bounded threshold (`chartRetries < 25`) preventing infinite recursion on network drops.

## v0.0.10 (2026-08-18)
### 🚀 Enhancements & Table Engine Upgrades
- **Flexible Observation Mapping & Auto X-Axis**: Added **`Remove from X`** button and **`Auto / Row Index (1, 2, 3...)`** mode (`selectedXIndex = -1`). Allows plotting pure numerical datasets across all columns without having to sacrifice a column as the X-axis.
- **Smart Series Toggle (`Select All` ⇄ `Select #1`)**: The series header button now dynamically tracks selection state, allowing 1-click toggling between all series and isolating series #1.
- **In-Memory Structured Table Transposition**: Added `transposeStructuredTable` and `transposeTableObj`, providing instant in-memory matrix transposition that preserves column metadata and prevents Markdown delimiter fragmentation.
- **Robust Standalone Section Splitting**: Fixed section splitting to use strict standalone delimiter boundaries (`/(?:^|\n)\s*---+\s*(?:\n|$)/`), eliminating corruption of Markdown table separator rows (`| --- | --- |`).
- **Template Literal Safety & Syntax Hardening**: Resolved token and regular expression character class escaping issues inside generated embed templates.

## v0.0.7 (2026-08-18)
### 🚀 Major Feature Upgrade: Interactive Chart Workbench & State Persistence
- **Chart Type Dropdown on Left Panel**: Grouped simple (Line, Area, Bar, Histogram, Pie, Doughnut, Polar Area, Waterfall) and advanced (Mixed, Pareto, Scatter, 3D Bubble, 3D Radar) charts above the Transpose toggle.
- **Robust Amplenote Table Header Extraction**: Automatically skips placeholder delimiter rows (`| - | - | - |`) and promotes actual header rows, auto-naming empty cells (`Column 1`, `Column 2`, etc.).
- **Animation Easing Selection**: Added customizable animation easing curves (*Smooth Quartic*, *Playful Bounce*, *Spring Elastic*, *Dynamic Cubic*, *Snappy Overshoot*, *Linear Uniform*, *Gentle Sine Wave*).
- **World-Class Data Analytics Studio Styling**: Glassmorphic canvas studio with live stat chips (Rows, Cols, Series), replay animation toolbar button, and glowing theme palettes.
- **Comprehensive Export Suite**:
  - `Download - Interactive Charts (Recommended)` (self-contained offline dashboard with embedded Chart.js and exact state/theme)
  - `Download all Tables - MD` (all note tables formatted in markdown)
  - `Download all Tables - CSV` (all note tables in structured CSV)
  - `Copy all Tables from this Note to a new Note` (creates and opens a new note with all tables via `app.createNote`)
  - `Save Image Above Table in Note`, `Copy Chart Image to Clipboard`, `Download Chart as PNG`.
- **Dual-Layer State Persistence**: Automatic state restoration (`localStorage` + `app.setSetting("Graph_Dashboard_State")`).
- **Dedicated Dashboard Launch Options**: Renamed App and Note options to `Open Dashboard` for cleaner global access.

### 🐛 Bug Fixes & Infrastructure
- **Sandbox Race Condition Fix**: Replaced HTML script tags with a strict, Sequential JavaScript script loader to completely eliminate the `Chart.helpers is undefined` iframe race condition crash.
- **Chart.js Pro Plugins**: Explicitly injected `ChartDataLabels` and `zoomPlugin` natively to bypass global UMD conflicts.
- **Robustness**: Replaced newer unicode emojis (Ladder, Soap Bubbles) with widely-supported fallbacks (`🔽`, `🔵`) for Waterfall and Bubble charts.
