## v0.0.6 (2026-08-18)
### 🚀 Major Feature Upgrade: Interactive Chart Workbench & State Persistence
- **Dual-Layer State Persistence**: Implemented automatic state restoration (`localStorage` + `app.setSetting("Graph_Dashboard_State")`), remembering active note, table, chart type, selected multi-series, custom colors, theme, and sidebar layout.
- **Dedicated Dashboard Launch Options**: Added Fullscreen Tab (`app.openEmbed`) and Sidebar Peek Viewer (`app.openSidebarEmbed`) targets in unified `Open Graph Dashboard` noteOption/appOption.
- **3-Pane Responsive Layout**: Collapsible left (Data Source) and right (Chart Mapping) sidebars with drawer toggle buttons and mobile screen support.
- **Cyclic Theming**: Real-time theme cycle supporting *Dark*, *Light*, *Midnight*, *Forest*, and *Cyberpunk* with dynamic Chart.js grid and text updates.
- **Multi-Series Charting & "Select All"**: Multi-column selection for Line, Bar, Area, Stacked Bar, Radar, Pie, Donut, and Polar Area charts.
- **Heading-Aware Table Navigation**: Tables are parsed with preceding markdown headers (e.g. `Note > Section > Table 1`).
- **Save Image Directly to Note**: One-click action to insert chart image above the table in Amplenote with standard line break spacing.
- **Offline HTML Export with Favicon**: Self-contained export featuring embedded SVG favicon data URI.
- **Host Bridge Actions (`onEmbedCall`)**: Live note switching, refresh, and direct note navigation.

---

## v0.0.1 (2026-07-11)
### 🚀 Initial Open Source Release
- Extracted and modularized code into `lib/` directory for better maintainability.
- Added comprehensive unit testing suite across core utilities (`tableTranspose`, `csvConverter`, `markdownParser`, `dateTime`).
- Performed security audit and patched critical XSS vectors in `htmlTemplate.js`.
- Bundled and optimized via `esbuild`.
