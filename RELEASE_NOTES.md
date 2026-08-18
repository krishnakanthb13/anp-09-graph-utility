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
