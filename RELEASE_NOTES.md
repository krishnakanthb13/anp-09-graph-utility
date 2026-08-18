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
