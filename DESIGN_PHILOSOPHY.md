# Graph Utility - Design Philosophy

## The "Why"

Data in plain text notes can be rigid. Often, the easiest way to understand numerical data is to visualize it, but jumping between a note-taking app and Excel or a Python script breaks flow and focus.

The Graph Utility plugin was built to bridge this gap. Our ideological goal is to turn markdown tables into a "living data source" that can be instantly mapped, visualized, and interacted with, without ever leaving the Amplenote ecosystem. 

## Core Ideology

### 1. Zero Friction, Maximum Polish
The user should never have to manually reformat or sanitize their notes just to produce a chart. The utility is designed to handle dirty, irregular, and complex markdown data gracefully:
- **Resilient Header Extraction**: Bypassing Amplenote placeholder dashes (`| - | - | - |`) and auto-naming blank columns.
- **Flexible Observation Mapping**: Recognizing that not every dataset has a dedicated category/date column. Adding optional X-Axis (`Remove from X`) and Auto Row Indexing treats all columns as first-class numerical variables.
- **In-Memory Transposition**: Permitting instant row-and-column switching on the fly without mutating or corrupting the source note markdown.
- **Designer Theming & Color Psychology**: Offering 10 bespoke themes (from clean light and dark modes to Nordic arctic tones, Dracula, and cyberpunk neon) paired with 11 specialized data palettes, ensuring every visualization looks striking, readable, and publication-ready.

The UI is intentionally modeled after modern, world-class dashboards (using rich dark modes, glassmorphism, and crisp typography) so the visualizer feels like a premium, integrated studio rather than a quick script.

### 2. State Should Survive
A major design pillar is **Dual-Layer Persistence**. Users get frustrated when they configure a thoughtful chart (choosing palettes, axes, smoothing, and layouts), navigate away to check another note, and return to find their dashboard reset.

The Graph Utility actively mirrors and restores your exact workbench state via `localStorage` and `app.setSetting("Graph_Dashboard_State")`. Whether you refresh the embed, change views, or resume work across devices, your visualization is preserved.

### 3. Escape Hatches
Data trapped inside a single proprietary view is limited. We believe users should always have complete ownership over their visualizations and tables:
- **Interactive HTML**: Exports a self-contained, fully offline HTML application with embedded data and Chart.js runtime.
- **Structured CSV & MD**: Instantly exports all tables for spreadsheet analysis or markdown backup.
- **Direct Note Insertion**: Burns high-resolution PNG chart snapshots above the relevant markdown table inside Amplenote notes for long-term review.

## Evolving Goals
As the plugin evolves, the focus remains strictly on **Visualization and Analysis**, not note editing. We aim to be the most expressive, reliable way to *see* and *understand* the structured data you write, preserving Amplenote's strength as an agile writing environment.
