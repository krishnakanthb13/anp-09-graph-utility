# Graph Utility - Design Philosophy

## The "Why"

Data in plain text notes can be rigid. Often, the easiest way to understand numerical data is to visualize it, but jumping between a note-taking app and Excel or a Python script breaks flow and focus.

The Graph Utility plugin was built to bridge this gap. Our ideological goal is to turn markdown tables into a "living data source" that can be instantly mapped, visualized, and interacted with, without ever leaving the Amplenote ecosystem. 

## Core Ideology

### 1. Zero Friction, Maximum Polish & Formatting Freedom
The user should never have to manually clean up or strip markdown formatting from their tables just to generate a visualization:
- **Resilient Numeric Extraction**: Natural notes contain bold text (`**$1,250**`), italics, accounting negatives `(1,234.50)`, metric multipliers (`10k`, `1.5M`), percentages, or European decimals (`1.234,56`). The engine seamlessly parses them without corrupting dates or throwing errors.
- **Heading-Aware Indexing & Escaped Pipes**: Tables are indexed with their note headings, and cell pipes (`\|`) are respected so complex structured notes render with complete integrity.
- **Flexible Observation Mapping**: Recognizing that not every dataset has a dedicated category/date column. Adding optional X-Axis (`Remove from X`) and Auto Row Indexing treats all columns as first-class numerical variables.
- **In-Memory Transposition**: Permitting instant row-and-column switching on the fly without mutating or corrupting the source note markdown.
- **Designer Theming & Color Psychology**: Offering 10 bespoke themes (from clean light and dark modes to Nordic arctic tones, Dracula, and cyberpunk neon) paired with 11 specialized data palettes, ensuring every visualization looks striking, readable, and publication-ready.

The UI is intentionally modeled after modern, world-class dashboards (using rich dark modes, glassmorphism, and crisp typography) so the visualizer feels like a premium, integrated studio rather than a quick script.

### 2. State Should Survive (Per-Note Isolation)
A major design pillar is **Per-Note State Isolation**. Each note represents a distinct mental context with unique columns, metrics, and goals.
- Selecting a Pareto chart on a quarterly financials note should not mess up a line chart configured on a habits tracking note.
- The Graph Utility actively scopes and restores workbench state per note UUID across both `localStorage` and `app.setSetting("Graph_Dashboard_State")`. Switching notes or devices always returns you to the exact visualization you intended for that specific document.

### 3. Semantic Chart Accuracy
Charts should deliver genuine analytical value, not mere visual approximations:
- **Pareto Analysis**: Truly implements the 80/20 rule with sorted frequencies and dual-axis cumulative curves.
- **Waterfall Modeling**: Computes positive and negative step transitions as floating blocks.
- **Histograms**: Calculates continuous frequency bins rather than simple category bars.

### 4. Escape Hatches
Data trapped inside a single proprietary view is limited. We believe users should always have complete ownership over their visualizations and tables:
- **Interactive HTML**: Exports a self-contained, fully offline HTML application with embedded data and Chart.js runtime.
- **Structured CSV & MD**: Instantly exports all tables for spreadsheet analysis or markdown backup.
- **Direct Note Insertion**: Burns high-resolution PNG chart snapshots above the relevant markdown table inside Amplenote notes (with stale-content overwrite protection) for long-term review.

## Evolving Goals
As the plugin evolves, the focus remains strictly on **Visualization and Analysis**, not note editing. We aim to be the most expressive, reliable way to *see* and *understand* the structured data you write, preserving Amplenote's strength as an agile writing environment.
