# Graph Utility Plugin

A powerful Amplenote plugin that parses markdown tables within your notes and visualizes them as interactive, responsive, and customizable charts using Chart.js.

## Features

- **Interactive Charts**: Render 2D and 3D charts natively inside your notes.
- **Table Support**: Automatically detects and extracts multiple Markdown tables from the current note.
- **Transpose**: Easily swap rows and columns for graphing depending on your data structure.
- **CSV Export**: Instantly parse your markdown tables and generate a downloadable CSV copy of the raw data into a new note.

---

## Installation

1. **Create a Plugin Note**: Create a new note in Amplenote and name it "Graph Utility Plugin" (or similar).
2. **Setup Metadata Table**: At the very top of the note, create a table with the following rows:
   
   | Field | Value |
   | :--- | :--- |
   | `name` | Graph Utility |
   | `description` | Extracts markdown tables and visualizes them using Chart.js |
   | `icon` | insert_chart |
   | `setting` | Current_Note_UUID [Do not Edit!] |

3. **Insert Code Block**: Below the table, create a single Javascript code block (type ` ```javascript `).
4. **Paste Compiled Code**: Copy the content from `build/graph-utility.compiled.js` and paste it inside that code block.
5. **Activate**: Go to **Account Settings** -> **Plugins**, and select the note you just created.

---

## Usage

Once installed, the plugin adds several options to the **Note Options** menu (accessed via the `...` icon in the top right of a note).

### 1. `Viewer!`
Creates an Amplenote Embed block (`<object>`) at the cursor position. The embed visually represents the tables in the current note as an interactive web page.
- Using the dropdowns in the visualizer, you can select which table to plot, and define the X, Y, and Z axes.
- Support for `(Transposed)` datasets ensures rows/columns can be visualized efficiently without altering the markdown source.

### 2. `Update!`
Refreshes the current `renderEmbed` block. Use this when you have added new tables or modified existing data in the note and want the charts to reflect the updated values immediately.

### 3. `Download!`
Extracts all markdown tables in the active note, converts them into a cleanly formatted Comma-Separated Values (CSV) string, and creates a brand new note tagged with `#charts-download` containing the data.

---

## Technical Details

The plugin is built with modern ES Modules and bundled via `esbuild`. 
- `lib/ui/htmlTemplate.js`: Contains the core layout, CSS styling, and injection of Chart.js dependencies over CDN. User data (`noteName`, `noteTags`, etc.) is strictly HTML-escaped.
- `lib/utils/`: Dedicated, tested pure functions for Markdown parsing (`markdownParser.js`), array transposition (`tableTranspose.js`), and CSV conversions (`csvConverter.js`).
- `build/graph-utility.compiled.js`: The final artifact that is safely bundled into a self-executing IIFE for Amplenote compatibility.