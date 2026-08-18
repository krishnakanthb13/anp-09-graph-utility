# Graph Utility - Design Philosophy

## The "Why"

Data in plain text notes can be rigid. Often, the easiest way to understand numerical data is to visualize it, but jumping between a note-taking app and Excel or a Python script breaks flow and focus.

The Graph Utility plugin was built to bridge this gap. Our ideological goal is to turn markdown tables into a "living data source" that can be instantly mapped, visualized, and interacted with, without ever leaving the Amplenote ecosystem. 

## Core Ideology

### 1. Zero Friction, Maximum Polish
The user should never have to manually format their data just to make the chart work. The utility is designed to handle dirty data seamlessly: extracting numerical values from currency strings, skipping empty delimiter rows, and automatically deriving series labels from table headers.

The UI is intentionally modeled after modern, world-class dashboards (using rich colors, dark modes, and crisp typography) so the visualizer feels like a premium, integrated feature rather than a slapped-together script.

### 2. State Should Survive
A major design pillar is **Dual-Layer Persistence**. Users get frustrated when they configure a beautiful chart (setting colors, labels, and themes), navigate away to check another note, and return to find their settings destroyed. 

The Graph Utility actively saves your exact viewport state back to Amplenote's plugin settings. Whether you refresh the page, open it on your phone, or come back a week later, your chart looks exactly how you left it. 

### 3. Escape Hatches
Data trapped in a proprietary format is useless. We believe users should always have an escape hatch. This is why the plugin features comprehensive offline export tools:
- **Interactive HTML**: Allows the user to download a self-contained, offline copy of the dashboard with their data baked in.
- **Raw CSV**: Allows the user to instantly pull their table into Excel.
- **Host Bridge Image Saving**: Gives users the ability to burn a static snapshot of their work directly into their notes for long-term archiving.

## Evolving Goals
As the plugin evolves, the focus remains strictly on **Visualization and Analysis**, not data entry. We want to be the best way to *view* the data you write, leaving the actual authoring and querying to Amplenote's core strengths.
