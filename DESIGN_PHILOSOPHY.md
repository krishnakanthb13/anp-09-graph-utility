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

### 4. Escape Hatches & Mode-Aware Exporting
Data trapped inside a single proprietary view is limited. We believe users should always have complete ownership over their visualizations and models:
- **Context-Aware Dynamic Exporting**: Export actions automatically adapt to the user's active mental mode. In Tables mode, you get table downloads and in-note image snapshots; in Math Formula mode, you get coordinate tables, standalone equation studios, and dedicated `-reports/-math-graph` note publishing.
- **Interactive HTML**: Exports a self-contained, fully offline HTML application with embedded data and Chart.js runtime.
- **Structured CSV & MD**: Instantly exports tabular datasets or sampled coordinate tables for spreadsheet analysis or markdown backup.
- **Direct Note Insertion**: Burns high-resolution PNG chart snapshots above the relevant markdown table inside Amplenote notes (with stale-content overwrite protection) for long-term review.

### 5. Responsive Ergonomics & Multi-Device Focus
A studio tool must adapt gracefully across device form factors:
- **Canvas as the Hero**: On narrow resolutions ($\le 900\text{px}$, tablets, and sidebar peek modes), sidebars shouldn't monopolize the view. The workbench defaults to collapsed sidebars, allowing the chart to take center stage.
- **Fluid Touch & Mobile Dismissal**: Floating sidebars, single-tap backdrop dismissal, and mutual panel exclusivity ensure mobile interactions feel native and effortless.
- **Contextual Canvas Controls**: Controls that aren't relevant in standard viewports (such as `Reset Zoom`) stay hidden until needed, reducing cognitive clutter and providing immediate recovery with 1 click.
- **Theme-Aware Scroll Polish**: Scrollbars seamlessly integrate into the visual language across all 10 dark, light, and designer palettes without harsh OS-default styling bleed.

### 6. Performance as an Invariant & Zero-Leak Memory
Data analytics tools often suffer from sluggishness as tables expand. We treat efficiency as a first-class design pillar:
- **Fast-Path Parsing**: Clean numeric values take an instantaneous parse path without running heavy regex pipelines.
- **Batched DOM Operations & Event Delegation**: Series controls avoid per-element listener churn and use `DocumentFragment` to eliminate reflow lag.
- **Linear Transposition**: Transpose operations run in linear time with pre-allocated memory buffers, eliminating stack size limits.

### 7. Integrity First, Fail-Closed Safety & Conservative Concurrency
When interacting with active notes, data integrity is paramount:
- **Fail-Closed Protection**: If a target table's identity or location in a note cannot be positively verified, the plugin halts without making any changes. It never guesses or falls back to prepending chart images to the top of user notes.
- **Never Guess on Mutation**: If a note is modified concurrently while a chart image is being uploaded, the plugin refuses to blindly trust stale table indices or positional guesses.
- **Explicit Invariant**: Unchanged notes use structural positional matching; modified notes require an unambiguous unique content match. If duplicate identical tables exist after a concurrent shift, the operation safely aborts with transparent user feedback rather than writing above the wrong table.
- **Bounded Storage Sustainability**: Per-note state maps are capped to the 50 most recently updated notes, safeguarding against setting bloat and Amplenote plugin quota exhaustion over years of usage.
- **Server-Side Validation**: Generated mathematical tables and plots compile and validate expressions server-side before creating notes, guaranteeing zero malformed notes.

### 8. Mathematical Formula Modeling & Sandboxed Exploration
Visualizing data is not limited to pre-existing tables. Mathematical equations ($y = f(x)$), engineering models, scientific curves, and financial formulas are fundamental ways to understand relationships:
- **Zero-Dependency Safe Parsing**: Mathematical expressions are parsed through an isolated custom AST tokenizer and recursive-descent evaluator — strictly prohibiting unsafe `eval()` or dynamic `Function()` code execution.
- **Scientific Notation & Real-World Scales**: Full support for scientific notation (`1e3`, `1.2e-4`, `2.5E+6`) ensures engineering, physics, and financial numbers are charted seamlessly.
- **Continuous Function Sampling & Multi-Curve Plotting**: Enables simultaneous comparison of multiple mathematical curves ($f_1(x), f_2(x)$), configurable domain intervals $[x_{min}, x_{max}]$, and high-density sampling ($20\text{--}600$ points) with tactile step buttons for exploration.
- **Dedicated Report Publishing**: Generating plots or coordinate tables automatically creates organized notes tagged with `"-reports/-math-graph"`, keeping work spaces tidy, structured, and archived.

## Evolving Goals
As the plugin evolves, the focus remains strictly on **Visualization, Mathematical Exploration, and Analysis**, not note editing. We aim to be the most expressive, reliable way to *see* and *understand* both structured table data and continuous mathematical models you write, preserving Amplenote's strength as an agile writing environment.
