# Graph Utility - Code Documentation

This document describes the technical implementation and core algorithms of the Graph Utility Amplenote Plugin.

## Architecture Overview

The plugin operates as a hybrid bridge application. 
- **The Host (Amplenote)**: The `Graph Utility.js` entrypoint runs inside Amplenote. It manages reading notes, calling Amplenote APIs, and managing settings.
- **The Embed (Dashboard)**: An iframe (embed) spawned by the Host containing a self-contained HTML/CSS/JS web application (`htmlTemplate.js`).

## Core Components

### 1. The Host Bridge (`lib/features/onEmbedCall.js`)
Handles bidirectional communication. When the embed sends a message, this router picks it up.
- `openNote`: Uses `app.navigate` to jump to a note URL.
- `refreshData`: Fetches the active note's content via `app.getNoteContent`, extracts markdown tables, and returns them to the embed.
- `saveImageToNote`: Reads the active note's content, finds the specific table, and uses `app.replaceNoteContent` to safely inject a markdown image tag (`![]()`) above the table.
- `copyTablesToNewNote`: Creates a new note via `app.createNote` and populates it with all parsed markdown tables.

### 2. State & Payload Injection (`lib/features/renderEmbed.js`)
When the embed is launched, the Host collects the current note's UUID, content, and any previously persisted LocalStorage settings (Theme, Chart Type, active table index, etc).
These are aggregated into a JSON `payload` object. The payload is `encodeURIComponent` encoded and injected directly into the HTML string before passing it to `app.openEmbed()` or `app.openSidebarEmbed()`.

### 3. The Interactive Dashboard (`lib/ui/htmlTemplate.js`)
A single-file HTML/JS application containing:
- **Sequential Script Loader**: Carefully loads `Chart.js`, `chartjs-plugin-datalabels`, `hammer.js`, and `chartjs-plugin-zoom` to prevent race conditions caused by sandbox constraints.
- **State Hydration & Persistence**: The dashboard decodes the injected payload and merges it with its local `state` object. Changes are persisted using a debounced `window.callAmplenotePlugin('persistState', ...)` call.
- **Table Parsing Engine (`parseMarkdownTablesLocally`)**: A robust parser that slices markdown content into tables, cleans delimiter rows, and tracks headers and row counts.
- **Chart.js Mapping Engine (`renderChart`)**: Translates parsed table rows into Chart.js `datasets` based on the active `state.selectedXIndex` and `state.selectedYIndices`. Dynamically injects a custom background plugin for theme-aware image exports.

## Key Design Patterns

- **Vanilla JS**: The embed avoids frameworks like React to ensure rapid loading, no bundle bloat, and minimal memory footprint inside the Amplenote container.
- **Offline Resilience**: The "Download Interactive HTML" feature exports the `document.documentElement.outerHTML`, dynamically updating the injected JSON payload string so the exported file retains the exact state and theme offline.
