(() => {
// anp-09-graph-utility/lib/features/launcher.js
async function launchGraphDashboard(app, noteUUID) {
  try {
    if (noteUUID) {
      await app.setSetting("Current_Note_UUID [Do not Edit!]", noteUUID);
    }
    let lastChoice = (app.settings || {})["Last Embed View"];
    const choiceResult = await app.prompt("Choose Graph Dashboard Launch Target:", {
      inputs: [
        {
          label: "Launch Target",
          type: "select",
          options: [
            { label: "Fullscreen Tab (Dedicated Workspace)", value: "fullscreen" },
            { label: "Peek Viewer (Sidebar)", value: "sidebar" }
          ],
          value: lastChoice || "fullscreen"
        }
      ]
    });
    if (!choiceResult) return;
    const target = Array.isArray(choiceResult) ? choiceResult[0] : choiceResult;
    if (typeof app.setSetting === "function") {
      await app.setSetting("Last Embed View", target);
    }
    if (target === "fullscreen") {
      await app.openEmbed();
      if (app.context && app.context.pluginUUID) {
        try {
          await app.navigate("https://www.amplenote.com/notes/plugins/" + app.context.pluginUUID);
        } catch (navErr) {
          console.warn("[GraphUtility] Optional navigation warning:", navErr);
        }
      }
    } else {
      await app.openSidebarEmbed(1);
    }
  } catch (error) {
    console.error("Error in launchGraphDashboard:", error);
    app.alert(`An error occurred while opening dashboard: ${error.message}`);
  }
}

// anp-09-graph-utility/lib/utils/markdownParser.js
function removeHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, "").trim();
}
function removeEmptyRowsAndColumns(table) {
  const rows = table.split("\n").filter((row) => row.trim().startsWith("|"));
  const filteredRows = rows.filter((row) => {
    const cells = row.split("|").slice(1, -1);
    const hasContent = cells.some((cell) => cell.trim() !== "");
    return hasContent;
  });
  if (filteredRows.length === 0) {
    return "";
  }
  const columnCount = filteredRows[0].split("|").length - 2;
  const nonEmptyColumns = Array.from(
    { length: columnCount },
    (_, colIndex) => filteredRows.some((row) => row.split("|")[colIndex + 1].trim() !== "")
  );
  const cleanedRows = filteredRows.map((row) => {
    const cells = row.split("|").slice(1, -1);
    const filteredCells = cells.filter((_, i) => nonEmptyColumns[i]);
    return `| ${filteredCells.join(" | ")} |`;
  });
  return cleanedRows.join("\n");
}
function extractTablesFromMarkdown(markdown, noteName = "") {
  const lines = (markdown || "").split("\n");
  let tableCount = 0;
  let inTable = false;
  let currentHeading = "";
  const tables = [];
  let currentTable = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      const headingMatch = trimmed.match(/^#+\s*(.+)$/);
      if (headingMatch && headingMatch[1]) {
        currentHeading = removeHtmlComments(headingMatch[1]).trim();
      }
    }
    if (trimmed.startsWith("|")) {
      if (!inTable) {
        tableCount++;
        if (tableCount > 1) {
          tables.push("---");
        }
        let label = `# Table ${tableCount}`;
        if (noteName || currentHeading) {
          const parts = [];
          if (noteName) parts.push(noteName);
          if (currentHeading) parts.push(currentHeading);
          parts.push(`Table ${tableCount}`);
          label = `# ${parts.join(" > ")}`;
        }
        tables.push(`${label}
`);
        inTable = true;
      }
      currentTable.push(line);
    } else if (inTable) {
      inTable = false;
      const tableContent = currentTable.join("\n");
      tables.push(tableContent);
      tables.push("");
      currentTable = [];
    }
  });
  if (currentTable.length > 0) {
    const tableContent = currentTable.join("\n");
    tables.push(removeEmptyRowsAndColumns(tableContent));
  }
  const processedContent = tables.join("\n\n");
  return removeHtmlComments(processedContent);
}
function extractStructuredTables(markdown, noteName = "") {
  const lines = (markdown || "").split("\n");
  let tableCount = 0;
  let inTable = false;
  let currentHeading = "";
  const result = [];
  let currentTableLines = [];
  lines.forEach((line) => {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      const headingMatch = trimmed.match(/^#+\s*(.+)$/);
      if (headingMatch && headingMatch[1]) {
        currentHeading = removeHtmlComments(headingMatch[1]).trim();
      }
    }
    if (trimmed.startsWith("|")) {
      if (!inTable) {
        tableCount++;
        inTable = true;
      }
      currentTableLines.push(line);
    } else if (inTable) {
      inTable = false;
      const cleaned = removeEmptyRowsAndColumns(currentTableLines.join("\n"));
      if (cleaned) {
        const tableObj = parseTableLinesIntoObject(cleaned, tableCount, currentHeading, noteName);
        if (tableObj) result.push(tableObj);
      }
      currentTableLines = [];
    }
  });
  if (currentTableLines.length > 0) {
    const cleaned = removeEmptyRowsAndColumns(currentTableLines.join("\n"));
    if (cleaned) {
      const tableObj = parseTableLinesIntoObject(cleaned, tableCount, currentHeading, noteName);
      if (tableObj) result.push(tableObj);
    }
  }
  return result;
}
function parseTableLinesIntoObject(cleanedTableMarkdown, tableIndex, heading, noteName) {
  const rows = cleanedTableMarkdown.split("\n").filter((r) => r.trim().startsWith("|"));
  if (rows.length < 1) return null;
  const parseRow = (rowStr) => {
    return rowStr.replace(/^\|/, "").replace(/\|$/, "").split("|").map((c) => removeHtmlComments(c).trim());
  };
  const headers = parseRow(rows[0]);
  let dataRows = [];
  const isDelimiter = (rowStr) => /^\|(\s*[-:]+\s*\|)+$/.test(rowStr.trim());
  const startIndex = rows.length > 1 && isDelimiter(rows[1]) ? 2 : 1;
  for (let i = startIndex; i < rows.length; i++) {
    const cells = parseRow(rows[i]);
    if (cells.some((c) => c !== "")) {
      dataRows.push(cells);
    }
  }
  const labelParts = [];
  if (noteName) labelParts.push(noteName);
  if (heading) labelParts.push(heading);
  labelParts.push(`Table ${tableIndex}`);
  const baseName = labelParts.join(" > ");
  const displayName = `${baseName} (${headers.length} cols \xD7 ${dataRows.length} rows)`;
  return {
    id: `table-${tableIndex}`,
    index: tableIndex,
    heading: heading || "",
    noteName: noteName || "",
    baseName,
    displayName,
    headers,
    dataRows,
    rowCount: dataRows.length,
    columnCount: headers.length,
    rawTableMarkdown: cleanedTableMarkdown
  };
}

// anp-09-graph-utility/lib/utils/tableTranspose.js
function transposeArray(array) {
  if (!array || array.length === 0) return [];
  return array[0].map((_, colIndex) => array.map((row) => row[colIndex]));
}
function transposeMarkdownTables(content) {
  const sections = content.split("---");
  const processedSections = sections.map((section) => {
    const lines = section.trim().split("\n");
    if (lines.length < 3) return section;
    const header = lines[0].trim();
    const transposedHeader = header + " (Transposed)";
    const tableRows = lines.slice(3).map((row) => row.split("|").slice(1, -1).map((cell) => cell.trim()));
    if (tableRows.length === 0 || tableRows[0].length === 0) {
      return section;
    }
    const restRows = tableRows.slice(2);
    const transposedRows = transposeArray(restRows);
    if (transposedRows.length === 0) return section;
    const columnCount = transposedRows[0].length;
    const firstRow = "| " + Array(columnCount).fill(" ").join(" | ") + " |";
    const separatorRow = "| " + Array(columnCount).fill("-").join(" | ") + " |";
    const transposedTable = [
      firstRow,
      separatorRow,
      ...transposedRows.map((row) => "| " + row.join(" | ") + " |")
    ].join("\n");
    return `${transposedHeader}


${transposedTable}`;
  });
  return processedSections.join("\n\n---\n\n");
}

// anp-09-graph-utility/lib/utils/csvConverter.js
function convertMarkdownToCSV(content) {
  const csvLines = content.split("\n").map((line) => {
    const cleanedLine = line.replace(/^#+\s*/, "");
    return cleanedLine;
  }).filter((line) => {
    return line.includes("|");
  }).map((line) => {
    const trimmedLine = line.trim().replace(/^\|/, "").replace(/\|$/, "").trim();
    return trimmedLine.split("|").map((cell) => `"${cell.trim()}"`).join(",");
  }).filter((line) => line !== "");
  return csvLines.join("\n");
}

// anp-09-graph-utility/lib/features/onEmbedCall.js
async function handleEmbedCall(app, actionName, payload = {}) {
  try {
    switch (actionName) {
      case "saveState": {
        const stateStr = typeof payload === "string" ? payload : JSON.stringify(payload);
        if (typeof app.setSetting === "function") {
          await app.setSetting("Graph_Dashboard_State", stateStr);
        }
        return { success: true };
      }
      case "getState": {
        const raw = (app.settings || {})["Graph_Dashboard_State"];
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }
      case "refreshData": {
        const targetUUID = payload.noteUUID || (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
        if (!targetUUID) {
          return { success: false, error: "No active note UUID found." };
        }
        const note = await app.notes.find(targetUUID);
        if (!note) {
          return { success: false, error: "Note could not be found." };
        }
        const markdown = await app.getNoteContent({ uuid: targetUUID });
        if (!markdown) {
          return { success: false, error: "Note content is empty." };
        }
        const cleanedContent = extractTablesFromMarkdown(markdown, note.name);
        const transposeContent = transposeMarkdownTables(cleanedContent);
        const structuredTables = extractStructuredTables(markdown, note.name);
        return {
          success: true,
          noteUUID: targetUUID,
          noteName: note.name,
          noteTags: note.tags,
          cleanedContent,
          transposeContent,
          tables: structuredTables
        };
      }
      case "pickNote": {
        const promptResult = await app.prompt("Switch Graph Note:", {
          inputs: [
            {
              label: "Search note title or tag (leave empty for recent):",
              type: "string",
              value: ""
            }
          ]
        });
        if (promptResult === null || promptResult === void 0) {
          return { success: false, cancelled: true };
        }
        const query = (Array.isArray(promptResult) ? promptResult[0] : promptResult) || "";
        let matchedNotes = [];
        if (query.trim()) {
          const byTag = await app.filterNotes({ tag: query.trim() });
          const byQuery = await app.filterNotes({ query: query.trim() });
          const seen = /* @__PURE__ */ new Set();
          for (const n of [...byTag, ...byQuery]) {
            if (n && n.uuid && !seen.has(n.uuid)) {
              seen.add(n.uuid);
              matchedNotes.push(n);
            }
          }
        } else {
          matchedNotes = await app.filterNotes({ limit: 15 });
        }
        if (matchedNotes.length === 0) {
          await app.alert("No matching notes found.");
          return { success: false, error: "No notes found matching query." };
        }
        const selectOptions = matchedNotes.map((n) => ({
          label: `${n.name || "Untitled Note"} (${(n.tags || []).join(", ")})`,
          value: n.uuid
        }));
        const pickResult = await app.prompt("Select a Note to visualize:", {
          inputs: [
            {
              label: "Choose Note",
              type: "select",
              options: selectOptions,
              value: selectOptions[0].value
            }
          ]
        });
        if (!pickResult) return { success: false, cancelled: true };
        const selectedUUID = Array.isArray(pickResult) ? pickResult[0] : pickResult;
        if (typeof app.setSetting === "function") {
          await app.setSetting("Current_Note_UUID [Do not Edit!]", selectedUUID);
        }
        const note = await app.notes.find(selectedUUID);
        const markdown = await app.getNoteContent({ uuid: selectedUUID });
        const cleanedContent = extractTablesFromMarkdown(markdown, note ? note.name : "");
        const transposeContent = transposeMarkdownTables(cleanedContent);
        const structuredTables = extractStructuredTables(markdown, note ? note.name : "");
        return {
          success: true,
          noteUUID: selectedUUID,
          noteName: note ? note.name : "Untitled Note",
          noteTags: note ? note.tags : [],
          cleanedContent,
          transposeContent,
          tables: structuredTables
        };
      }
      case "openNote": {
        const targetUUID = payload.noteUUID || (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
        if (targetUUID) {
          await app.navigate(`https://www.amplenote.com/notes/${targetUUID}`);
          return { success: true };
        }
        return { success: false, error: "No note UUID provided." };
      }
      case "saveImageToNote": {
        const { noteUUID, dataUrl, rawTableMarkdown } = payload;
        if (!noteUUID || !dataUrl) {
          return { success: false, error: "Missing note UUID or image data." };
        }
        const noteContent = await app.getNoteContent({ uuid: noteUUID });
        if (!noteContent) {
          return { success: false, error: "Could not read note content." };
        }
        const imageMarkdown = `
\\

![](${dataUrl})

\\

`;
        if (rawTableMarkdown && noteContent.includes(rawTableMarkdown)) {
          const updatedContent = noteContent.replace(rawTableMarkdown, `${imageMarkdown}${rawTableMarkdown}`);
          await app.replaceNoteContent({ uuid: noteUUID }, updatedContent);
        } else {
          await app.insertNoteContent({ uuid: noteUUID }, imageMarkdown);
        }
        return {
          success: true,
          message: "Chart image saved directly above the table in your note!"
        };
      }
      case "downloadCSV": {
        const content = payload.content || "";
        const csv = convertMarkdownToCSV(content);
        return { success: true, csv };
      }
      default:
        console.warn(`[GraphUtility] Unknown embed action: ${actionName}`);
        return { success: false, error: `Unknown action: ${actionName}` };
    }
  } catch (error) {
    console.error(`[GraphUtility] Error in onEmbedCall (${actionName}):`, error);
    return { success: false, error: error.message };
  }
}

// anp-09-graph-utility/lib/ui/htmlTemplate.js
function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function buildChartHtml({
  cleanedContent = "",
  transposeContent = "",
  structuredTables = [],
  noteName = "Graph Utility",
  noteTags = [],
  noteUUID = "",
  savedState = null
}) {
  const safeName = escapeHTML(noteName);
  const safeUUID = escapeHTML(noteUUID);
  const payloadObj = {
    noteUUID: noteUUID || "",
    noteName: noteName || "Graph Utility",
    noteTags: noteTags || [],
    cleanedContent: cleanedContent || "",
    transposeContent: transposeContent || "",
    structuredTables: structuredTables || [],
    savedState: savedState || {}
  };
  const encodedPayload = encodeURIComponent(JSON.stringify(payloadObj));
  const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#3B82F6"/><stop offset="100%" stop-color="#8B5CF6"/></linearGradient></defs><rect width="32" height="32" rx="6" fill="url(#g)"/><path d="M7 24V17M13 24V11M19 24V14M25 24V8" stroke="#FFFFFF" stroke-width="2.8" stroke-linecap="round"/><circle cx="7" cy="17" r="1.8" fill="#FFF"/><circle cx="13" cy="11" r="1.8" fill="#FFF"/><circle cx="19" cy="14" r="1.8" fill="#FFF"/><circle cx="25" cy="8" r="1.8" fill="#FFF"/></svg>`;
  const faviconDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(faviconSvg)}`;
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeName} \u2014 Graph Utility</title>
  <link rel="icon" type="image/svg+xml" href="${faviconDataUri}">
  <!-- Chart.js CDN -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    /* Baseline Theme Tokens (Dark Mode Default) */
    :root, body, body.theme-dark {
      --bg-body: #111318;
      --bg-surface: #191c24;
      --bg-card: #222634;
      --bg-input: #2a3042;
      --border-color: #384058;
      --border-hover: #505b7c;
      --text-primary: #f3f5fa;
      --text-secondary: #a6b0c9;
      --text-muted: #6e7998;
      --accent-primary: #4f46e5;
      --accent-hover: #6366f1;
      --accent-glow: rgba(79, 70, 229, 0.3);
      --accent-badge: rgba(79, 70, 229, 0.2);
      --chart-grid: rgba(255, 255, 255, 0.08);
      --chart-text: #a6b0c9;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
      --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.45);
    }

    body.theme-light {
      --bg-body: #f1f5f9;
      --bg-surface: #ffffff;
      --bg-card: #e2e8f0;
      --bg-input: #ffffff;
      --border-color: #cbd5e1;
      --border-hover: #94a3b8;
      --text-primary: #0f172a;
      --text-secondary: #334155;
      --text-muted: #64748b;
      --accent-primary: #2563eb;
      --accent-hover: #1d4ed8;
      --accent-glow: rgba(37, 99, 235, 0.2);
      --accent-badge: rgba(37, 99, 235, 0.12);
      --chart-grid: rgba(0, 0, 0, 0.08);
      --chart-text: #475569;
      --shadow-sm: 0 1px 4px rgba(0, 0, 0, 0.06);
      --shadow-md: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    body.theme-midnight {
      --bg-body: #050811;
      --bg-surface: #0c1222;
      --bg-card: #151f38;
      --bg-input: #1b2848;
      --border-color: #263865;
      --border-hover: #3a5392;
      --text-primary: #ffffff;
      --text-secondary: #9cb0d8;
      --text-muted: #6377a2;
      --accent-primary: #0284c7;
      --accent-hover: #38bdf8;
      --accent-glow: rgba(2, 132, 199, 0.35);
      --accent-badge: rgba(2, 132, 199, 0.2);
      --chart-grid: rgba(255, 255, 255, 0.08);
      --chart-text: #9cb0d8;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.4);
      --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.55);
    }

    body.theme-forest {
      --bg-body: #08130d;
      --bg-surface: #0e2016;
      --bg-card: #173223;
      --bg-input: #1f4330;
      --border-color: #2b5940;
      --border-hover: #3c7b59;
      --text-primary: #ecfdf5;
      --text-secondary: #a7f3d0;
      --text-muted: #6ee7b7;
      --accent-primary: #10b981;
      --accent-hover: #34d399;
      --accent-glow: rgba(16, 185, 129, 0.35);
      --accent-badge: rgba(16, 185, 129, 0.2);
      --chart-grid: rgba(255, 255, 255, 0.08);
      --chart-text: #a7f3d0;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
      --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.5);
    }

    body.theme-cyberpunk {
      --bg-body: #0d0818;
      --bg-surface: #160e28;
      --bg-card: #23163e;
      --bg-input: #311f56;
      --border-color: #4c3085;
      --border-hover: #6d45bf;
      --text-primary: #fdf4ff;
      --text-secondary: #f0abfc;
      --text-muted: #c084fc;
      --accent-primary: #ec4899;
      --accent-hover: #f472b6;
      --accent-glow: rgba(236, 72, 153, 0.4);
      --accent-badge: rgba(236, 72, 153, 0.25);
      --chart-grid: rgba(255, 255, 255, 0.1);
      --chart-text: #f0abfc;
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.45);
      --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.6);
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    html, body {
      height: 100%;
      width: 100%;
      background-color: var(--bg-body, #111318) !important;
      color: var(--text-primary, #f3f5fa) !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      font-size: 13px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }

    /* Layout Shell */
    .app-shell {
      display: flex;
      flex: 1;
      height: 100vh;
      width: 100vw;
      position: relative;
      overflow: hidden;
      background-color: var(--bg-body, #111318);
    }

    /* Sidebar Panels */
    .panel {
      background-color: var(--bg-surface, #191c24);
      border-color: var(--border-color, #384058);
      color: var(--text-primary, #f3f5fa);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      transition: width 0.2s ease, transform 0.2s ease;
      z-index: 20;
      position: relative;
      flex-shrink: 0;
    }

    .panel-left {
      width: 320px;
      border-right: 1px solid var(--border-color, #384058);
    }

    .panel-right {
      width: 320px;
      border-left: 1px solid var(--border-color, #384058);
    }

    .panel.collapsed {
      width: 0 !important;
      padding: 0 !important;
      border: none !important;
      overflow: hidden;
    }

    .panel-header {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border-color, #384058);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      background-color: var(--bg-surface, #191c24);
    }

    .panel-title {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-secondary, #a6b0c9);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .panel-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      flex: 1;
    }

    /* Central Chart Viewport */
    .viewport {
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
      background-color: var(--bg-body, #111318);
      position: relative;
      overflow: hidden;
      min-width: 0;
    }

    /* Top Navigation Toolbar */
    .toolbar {
      background-color: var(--bg-surface, #191c24);
      border-bottom: 1px solid var(--border-color, #384058);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
      z-index: 10;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      gap: 5px;
      flex-wrap: wrap;
      justify-content: center;
      flex: 1;
    }

    /* Interactive Buttons */
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border-color, #384058);
      background-color: var(--bg-card, #222634);
      color: var(--text-primary, #f3f5fa);
      transition: all 0.2s ease;
      white-space: nowrap;
      user-select: none;
    }

    .btn:hover {
      background-color: var(--bg-input, #2a3042);
      border-color: var(--border-hover, #505b7c);
    }

    .btn-primary {
      background-color: var(--accent-primary, #4f46e5);
      color: #ffffff !important;
      border-color: var(--accent-primary, #4f46e5);
    }

    .btn-primary:hover {
      background-color: var(--accent-hover, #6366f1);
      border-color: var(--accent-hover, #6366f1);
      box-shadow: 0 0 12px var(--accent-glow);
    }

    .btn-icon {
      padding: 6px 8px;
    }

    .btn-pill {
      border-radius: 20px;
      padding: 4px 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .btn-pill.active {
      background-color: var(--accent-primary, #4f46e5);
      color: #ffffff !important;
      border-color: var(--accent-primary, #4f46e5);
      box-shadow: 0 0 10px var(--accent-glow);
    }

    /* Form Controls */
    .form-group {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .form-label {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-secondary, #a6b0c9);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .select, .input {
      width: 100%;
      background-color: var(--bg-input, #2a3042);
      border: 1px solid var(--border-color, #384058);
      color: var(--text-primary, #f3f5fa);
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-family: inherit;
      outline: none;
      transition: border-color 0.2s;
    }

    .select:focus, .input:focus {
      border-color: var(--accent-primary, #4f46e5);
      box-shadow: 0 0 0 2px var(--accent-glow);
    }

    /* Multi-Series Checkbox List */
    .series-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
      background-color: var(--bg-input, #2a3042);
      border: 1px solid var(--border-color, #384058);
      border-radius: 6px;
      padding: 6px;
    }

    .series-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 5px 8px;
      border-radius: 4px;
      font-size: 12px;
      color: var(--text-primary, #f3f5fa);
      cursor: pointer;
      user-select: none;
      transition: background 0.15s;
    }

    .series-item:hover {
      background-color: var(--bg-card, #222634);
    }

    .series-item input[type="checkbox"] {
      accent-color: var(--accent-primary, #4f46e5);
      cursor: pointer;
    }

    .series-color-swatch {
      width: 14px;
      height: 14px;
      border-radius: 3px;
      border: 1px solid rgba(0,0,0,0.2);
      flex-shrink: 0;
    }

    /* Switch & Toggle */
    .toggle-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 6px 0;
      font-size: 12px;
      color: var(--text-primary, #f3f5fa);
      cursor: pointer;
    }

    .switch {
      position: relative;
      display: inline-block;
      width: 36px;
      height: 20px;
    }

    .switch input {
      opacity: 0;
      width: 0;
      height: 0;
    }

    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: var(--bg-input, #2a3042);
      border: 1px solid var(--border-color, #384058);
      transition: .25s;
      border-radius: 20px;
    }

    .slider:before {
      position: absolute;
      content: "";
      height: 14px;
      width: 14px;
      left: 2px;
      bottom: 2px;
      background-color: var(--text-secondary, #a6b0c9);
      transition: .25s;
      border-radius: 50%;
    }

    input:checked + .slider {
      background-color: var(--accent-primary, #4f46e5);
      border-color: var(--accent-primary, #4f46e5);
    }

    input:checked + .slider:before {
      transform: translateX(16px);
      background-color: #ffffff;
    }

    /* Chart Canvas Stage */
    .stage {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 16px;
      position: relative;
      min-height: 0;
      background-color: var(--bg-body, #111318);
    }

    .canvas-card {
      width: 100%;
      height: 100%;
      background-color: var(--bg-surface, #191c24);
      border: 1px solid var(--border-color, #384058);
      border-radius: 10px;
      padding: 16px;
      box-shadow: var(--shadow-md);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
    }

    .canvas-card canvas {
      width: 100% !important;
      height: 100% !important;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 12px;
      text-align: center;
      padding: 30px;
      color: var(--text-secondary, #a6b0c9);
    }

    .empty-state h3 {
      color: var(--text-primary, #f3f5fa);
      font-size: 16px;
    }

    .empty-state p {
      font-size: 12px;
      max-width: 380px;
      line-height: 1.5;
      color: var(--text-muted, #6e7998);
    }

    /* Stats Badge */
    .stats-badge-container {
      position: absolute;
      bottom: 10px;
      right: 12px;
      display: flex;
      gap: 6px;
      z-index: 5;
    }

    .stat-chip {
      background-color: var(--bg-card, #222634);
      border: 1px solid var(--border-color, #384058);
      color: var(--text-secondary, #a6b0c9);
      font-size: 10px;
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 12px;
    }

    /* Note Banner Info */
    .note-info-box {
      background-color: var(--bg-card, #222634);
      border: 1px solid var(--border-color, #384058);
      border-radius: 8px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .note-title-text {
      font-size: 13px;
      font-weight: 700;
      color: var(--text-primary, #f3f5fa);
      display: flex;
      align-items: center;
      gap: 6px;
      word-break: break-word;
    }

    .note-tag-chip {
      display: inline-block;
      font-size: 10px;
      background-color: var(--accent-badge, rgba(79, 70, 229, 0.2));
      color: var(--accent-primary, #4f46e5);
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 600;
    }

    /* Dropdown Menus */
    .dropdown {
      position: relative;
      display: inline-block;
    }

    .dropdown-content {
      display: none;
      position: absolute;
      right: 0;
      top: 100%;
      margin-top: 4px;
      background-color: var(--bg-surface, #191c24);
      min-width: 220px;
      border: 1px solid var(--border-color, #384058);
      border-radius: 8px;
      box-shadow: var(--shadow-md);
      z-index: 100;
      padding: 4px;
    }

    .dropdown-content.show {
      display: flex;
      flex-direction: column;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 12px;
      font-size: 12px;
      color: var(--text-primary, #f3f5fa);
      cursor: pointer;
      border-radius: 4px;
      border: none;
      background: none;
      width: 100%;
      text-align: left;
    }

    .dropdown-item:hover {
      background-color: var(--bg-card, #222634);
      color: var(--accent-primary, #4f46e5);
    }

    /* Toast Notification */
    .toast {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%) translateY(100px);
      background-color: var(--bg-card, #222634);
      color: var(--text-primary, #f3f5fa);
      border: 1px solid var(--border-color, #384058);
      box-shadow: var(--shadow-md);
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
      opacity: 0;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      z-index: 1000;
    }

    .toast.show {
      transform: translateX(-50%) translateY(0);
      opacity: 1;
    }

    /* Mobile / Small Screen Responsiveness */
    @media (max-width: 900px) {
      .panel-left, .panel-right {
        position: absolute;
        top: 0;
        bottom: 0;
        z-index: 50;
        box-shadow: var(--shadow-md);
      }
      .panel-left { left: 0; }
      .panel-right { right: 0; }
    }
  </style>
</head>
<body class="theme-dark">
  <div class="app-shell">
    
    <!-- LEFT SIDEBAR: Note & Table Management -->
    <aside id="leftPanel" class="panel panel-left">
      <div class="panel-header">
        <div class="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
          Data Source
        </div>
        <button id="closeLeftPanelBtn" class="btn btn-icon" title="Collapse Panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- Note Info Box -->
        <div class="note-info-box">
          <div class="note-title-text" id="noteNameDisplay">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            <span>${safeName}</span>
          </div>
          <div id="noteTagsContainer" style="display: flex; gap: 4px; flex-wrap: wrap;">
            ${(noteTags || []).map((t) => `<span class="note-tag-chip">#${escapeHTML(t)}</span>`).join("")}
          </div>
          <div style="display: flex; gap: 6px; margin-top: 6px;">
            <button id="switchNoteBtn" class="btn btn-primary btn-icon" style="flex: 1;" title="Change source note">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Switch Note
            </button>
            <button id="openNoteBtn" class="btn btn-icon" title="Open Note in Amplenote">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button id="refreshDataBtn" class="btn btn-icon" title="Refresh Table Data">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
            </button>
          </div>
        </div>

        <!-- Table Selector -->
        <div class="form-group">
          <label class="form-label" for="tableSelector">Select Table</label>
          <select id="tableSelector" class="select"></select>
        </div>

        <!-- Transpose Toggle -->
        <label class="toggle-row">
          <span>Transpose (Rows \u21C4 Cols)</span>
          <div class="switch">
            <input type="checkbox" id="transposeToggle">
            <span class="slider"></span>
          </div>
        </label>

        <!-- Quick Data Info -->
        <div class="form-group" style="margin-top: 6px;">
          <span class="form-label">Table Summary</span>
          <div style="font-size: 11px; color: var(--text-secondary, #a6b0c9); line-height: 1.6;" id="tableSummaryInfo">
            Select a table to plot.
          </div>
        </div>
      </div>
    </aside>

    <!-- CENTER VIEWPORT: Canvas & Main Toolbar -->
    <main class="viewport">
      
      <!-- Top Toolbar -->
      <header class="toolbar">
        <div class="toolbar-left">
          <button id="toggleLeftPanelBtn" class="btn btn-icon" title="Toggle Left Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="9" y1="3" x2="9" y2="21"/></svg>
          </button>
          <span id="activeTableHeading" style="font-size: 13px; font-weight: 700; color: var(--text-primary, #f3f5fa); max-width: 240px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
            Graph Utility
          </span>
        </div>

        <!-- Chart Type Switcher Pills -->
        <div class="toolbar-center">
          <button class="btn btn-pill active" data-chart-type="line">Line</button>
          <button class="btn btn-pill" data-chart-type="bar">Bar</button>
          <button class="btn btn-pill" data-chart-type="area">Area</button>
          <button class="btn btn-pill" data-chart-type="stackedBar">Stacked</button>
          <button class="btn btn-pill" data-chart-type="pie">Pie</button>
          <button class="btn btn-pill" data-chart-type="doughnut">Donut</button>
          <button class="btn btn-pill" data-chart-type="radar">Radar</button>
          <button class="btn btn-pill" data-chart-type="polarArea">Polar</button>
        </div>

        <div class="toolbar-right">
          <!-- Cyclic Theme Toggle Button -->
          <button id="themeToggleBtn" class="btn btn-icon" title="Cycle Theme (Dark / Light / Midnight / Forest / Cyberpunk)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
            <span id="themeNameLabel" style="font-size: 11px;">Dark</span>
          </button>

          <!-- Export Dropdown -->
          <div class="dropdown">
            <button id="exportDropdownBtn" class="btn btn-primary" title="Export Chart & Data">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export
            </button>
            <div id="exportMenu" class="dropdown-content">
              <button class="dropdown-item" id="saveImageToNoteBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                Save Image in Note (above table)
              </button>
              <button class="dropdown-item" id="copyImageClipboardBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                Copy Image to Clipboard
              </button>
              <button class="dropdown-item" id="downloadPngBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                Download PNG Image
              </button>
              <button class="dropdown-item" id="downloadHtmlBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                Download Offline HTML
              </button>
              <button class="dropdown-item" id="downloadCsvBtn">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                Download Table as CSV
              </button>
            </div>
          </div>

          <button id="toggleRightPanelBtn" class="btn btn-icon" title="Toggle Right Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
          </button>
        </div>
      </header>

      <!-- Chart Stage -->
      <div class="stage">
        <div class="canvas-card" id="canvasCard">
          <canvas id="mainChart"></canvas>
          <div id="emptyState" class="empty-state" style="display: none;">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            <h3>No Markdown Tables Found</h3>
            <p>We couldn't detect any markdown tables in this note. Add a table to your note or click <strong>Switch Note</strong> to choose another note.</p>
            <button id="emptyStateSwitchBtn" class="btn btn-primary">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Select Note with Tables
            </button>
          </div>
          <div class="stats-badge-container">
            <span class="stat-chip" id="statRows">0 Rows</span>
            <span class="stat-chip" id="statCols">0 Columns</span>
            <span class="stat-chip" id="statSeries">0 Series</span>
          </div>
        </div>
      </div>
    </main>

    <!-- RIGHT SIDEBAR: Data Mapping & Customization -->
    <aside id="rightPanel" class="panel panel-right">
      <div class="panel-header">
        <div class="panel-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          Chart Mapping
        </div>
        <button id="closeRightPanelBtn" class="btn btn-icon" title="Collapse Panel">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <div class="panel-content">
        <!-- X-Axis Selection -->
        <div class="form-group">
          <label class="form-label" for="xAxisSelect">X-Axis (Labels)</label>
          <select id="xAxisSelect" class="select"></select>
        </div>

        <!-- Y-Axes Multi-Series Selection -->
        <div class="form-group">
          <div class="form-label">
            <span>Y-Axis Series</span>
            <button id="selectAllSeriesBtn" class="btn btn-icon" style="font-size: 10px; padding: 2px 6px;">
              Select All
            </button>
          </div>
          <div id="ySeriesContainer" class="series-list"></div>
        </div>

        <!-- Color Palette Preset -->
        <div class="form-group">
          <label class="form-label" for="paletteSelect">Color Palette</label>
          <select id="paletteSelect" class="select">
            <option value="modern">Vibrant & Modern</option>
            <option value="neon">Cyberpunk Neon</option>
            <option value="emerald">Emerald Nature</option>
            <option value="sunset">Sunset Gradient</option>
            <option value="pastel">Soft Pastel</option>
            <option value="monochrome">Monochrome Slate</option>
          </select>
        </div>

        <!-- Visual Options -->
        <div class="form-group">
          <span class="form-label">Display Options</span>
          <label class="toggle-row">
            <span>Smooth Curves</span>
            <div class="switch">
              <input type="checkbox" id="smoothCurvesToggle" checked>
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Fill Area</span>
            <div class="switch">
              <input type="checkbox" id="fillAreaToggle">
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Show Grid Lines</span>
            <div class="switch">
              <input type="checkbox" id="showGridToggle" checked>
              <span class="slider"></span>
            </div>
          </label>
          <label class="toggle-row">
            <span>Show Legend</span>
            <div class="switch">
              <input type="checkbox" id="showLegendToggle" checked>
              <span class="slider"></span>
            </div>
          </label>
        </div>
      </div>
    </aside>
  </div>

  <!-- Global Toast Notification -->
  <div id="toast" class="toast">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
    <span id="toastMessage">Action completed!</span>
  </div>

  <!-- CRASH-PROOF CLIENT SCRIPT -->
  <script>
    (function() {
      // Safely deserialize injected payload
      let PAYLOAD = {};
      try {
        PAYLOAD = JSON.parse(decodeURIComponent("${encodedPayload}"));
      } catch (err) {
        console.error("[GraphUtility] Payload decode error:", err);
      }

      let currentNoteUUID = PAYLOAD.noteUUID || "";
      let currentNoteName = PAYLOAD.noteName || "Graph Utility";
      let cleanedMarkdown = PAYLOAD.cleanedContent || "";
      let transposedMarkdown = PAYLOAD.transposeContent || "";
      let initialTables = PAYLOAD.structuredTables || [];
      let initialSavedState = PAYLOAD.savedState || {};

      // Theme Cycle List
      const THEMES = ['dark', 'light', 'midnight', 'forest', 'cyberpunk'];
      let currentThemeIndex = 0;

      // Color Palettes
      const PALETTES = {
        modern: ['#4f46e5', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6', '#3b82f6', '#14b8a6'],
        neon: ['#f43f5e', '#00f5d4', '#fee440', '#7b2cbf', '#ff007f', '#00bbfa', '#f72585', '#4cc9f0'],
        emerald: ['#10b981', '#059669', '#34d399', '#6ee7b7', '#047857', '#065f46', '#a7f3d0', '#022c22'],
        sunset: ['#f97316', '#ef4444', '#e11d48', '#be123c', '#fb923c', '#f87171', '#fda4af', '#f43f5e'],
        pastel: ['#93c5fd', '#a7f3d0', '#fde68a', '#fbcfe8', '#c4b5fd', '#bae6fd', '#fed7aa', '#ddd6fe'],
        monochrome: ['#cbd5e1', '#94a3b8', '#64748b', '#475569', '#334155', '#1e293b', '#0f172a', '#e2e8f0']
      };

      // App Workbench State (Restored & Persisted)
      let state = {
        noteUUID: currentNoteUUID,
        noteName: currentNoteName,
        activeTableIndex: 0,
        isTransposed: false,
        chartType: 'line',
        selectedXIndex: 0,
        selectedYIndices: [],
        theme: 'dark',
        palette: 'modern',
        smoothCurves: true,
        fillArea: false,
        showGrid: true,
        showLegend: true,
        leftPanelCollapsed: false,
        rightPanelCollapsed: false
      };

      let chartInstance = null;
      let parsedTables = [];
      let saveTimeout = null;

      // Toast notification helper
      function showToast(message) {
        const toast = document.getElementById('toast');
        const text = document.getElementById('toastMessage');
        if (!toast || !text) return;
        text.textContent = message;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
      }

      // Dual-Layer State Persistence: LocalStorage + Amplenote Settings Bridge
      function persistState() {
        if (saveTimeout) clearTimeout(saveTimeout);
        saveTimeout = setTimeout(() => {
          try {
            // 1. Instant Local Cache
            localStorage.setItem('amplenote_graph_utility_state', JSON.stringify(state));

            // 2. Cloud Synchronization via onEmbedCall
            if (window.callAmplenotePlugin) {
              window.callAmplenotePlugin('saveState', state).catch(() => {});
            }
          } catch (e) {
            console.error('[GraphUtility] Failed to persist state:', e);
          }
        }, 300);
      }

      // Hydrate state from saved options
      function loadPersistedState() {
        try {
          const local = localStorage.getItem('amplenote_graph_utility_state');
          const source = (initialSavedState && Object.keys(initialSavedState).length > 0)
            ? initialSavedState
            : (local ? JSON.parse(local) : null);

          if (source) {
            if (source.theme && THEMES.includes(source.theme)) state.theme = source.theme;
            if (source.chartType) state.chartType = source.chartType;
            if (typeof source.isTransposed === 'boolean') state.isTransposed = source.isTransposed;
            if (source.palette && PALETTES[source.palette]) state.palette = source.palette;
            if (typeof source.smoothCurves === 'boolean') state.smoothCurves = source.smoothCurves;
            if (typeof source.fillArea === 'boolean') state.fillArea = source.fillArea;
            if (typeof source.showGrid === 'boolean') state.showGrid = source.showGrid;
            if (typeof source.showLegend === 'boolean') state.showLegend = source.showLegend;
            if (typeof source.activeTableIndex === 'number') state.activeTableIndex = source.activeTableIndex;
            if (typeof source.selectedXIndex === 'number') state.selectedXIndex = source.selectedXIndex;
            if (Array.isArray(source.selectedYIndices)) state.selectedYIndices = source.selectedYIndices;
            if (typeof source.leftPanelCollapsed === 'boolean') state.leftPanelCollapsed = source.leftPanelCollapsed;
            if (typeof source.rightPanelCollapsed === 'boolean') state.rightPanelCollapsed = source.rightPanelCollapsed;
          }
        } catch (e) {
          console.warn('[GraphUtility] Error hydrating state:', e);
        }
      }

      // Apply active Theme
      function applyTheme(themeName) {
        state.theme = themeName || 'dark';
        document.body.className = 'theme-' + state.theme;
        document.documentElement.setAttribute('data-theme', state.theme);
        const label = document.getElementById('themeNameLabel');
        if (label) {
          label.textContent = state.theme.charAt(0).toUpperCase() + state.theme.slice(1);
        }
        currentThemeIndex = THEMES.indexOf(state.theme);
        if (currentThemeIndex === -1) currentThemeIndex = 0;
        if (chartInstance) renderChart();
        persistState();
      }

      function cycleTheme() {
        currentThemeIndex = (currentThemeIndex + 1) % THEMES.length;
        applyTheme(THEMES[currentThemeIndex]);
        showToast('Theme: ' + THEMES[currentThemeIndex].toUpperCase());
      }

      // Parse and extract table data from active content
      function parseTables() {
        const raw = state.isTransposed ? transposedMarkdown : cleanedMarkdown;
        if (initialTables && initialTables.length > 0 && !state.isTransposed) {
          parsedTables = initialTables;
        } else {
          parsedTables = parseMarkdownTablesLocally(raw);
        }

        const selector = document.getElementById('tableSelector');
        const emptyState = document.getElementById('emptyState');
        const canvas = document.getElementById('mainChart');

        if (!selector) return;
        selector.innerHTML = '';

        if (parsedTables.length === 0) {
          selector.innerHTML = '<option value="-1">No tables found</option>';
          document.getElementById('tableSummaryInfo').textContent = 'No markdown tables found.';
          if (emptyState) emptyState.style.display = 'flex';
          if (canvas) canvas.style.display = 'none';
          if (chartInstance) { chartInstance.destroy(); chartInstance = null; }
          return;
        }

        if (emptyState) emptyState.style.display = 'none';
        if (canvas) canvas.style.display = 'block';

        parsedTables.forEach((tbl, idx) => {
          const opt = document.createElement('option');
          opt.value = idx;
          opt.textContent = tbl.displayName || tbl.baseName || ('Table ' + (idx + 1));
          if (idx === state.activeTableIndex) opt.selected = true;
          selector.appendChild(opt);
        });

        if (state.activeTableIndex >= parsedTables.length) {
          state.activeTableIndex = 0;
        }

        updateTableMappingControls();
      }

      // Local markdown table parser fallback
      function parseMarkdownTablesLocally(content) {
        const sections = (content || '').split('---');
        const list = [];
        let count = 0;

        sections.forEach(sec => {
          const lines = sec.trim().split(String.fromCharCode(10));
          let heading = '';
          const tableRows = [];

          lines.forEach(l => {
            const tr = l.trim();
            if (tr.startsWith('#')) {
              heading = tr.replace(/^#+s*/, '');
            } else if (tr.startsWith('|')) {
              tableRows.push(tr);
            }
          });

          if (tableRows.length > 0) {
            count++;
            const parseRow = r => r.replace(/^|/, '').replace(/|$/, '').split('|').map(c => c.trim());
            const headers = parseRow(tableRows[0]);
            const isDelim = r => /^|(s*[-:]+s*|)+$/.test(r.trim());
            const startIdx = (tableRows.length > 1 && isDelim(tableRows[1])) ? 2 : 1;
            const dataRows = [];
            for (let i = startIdx; i < tableRows.length; i++) {
              dataRows.push(parseRow(tableRows[i]));
            }

            const baseName = heading ? heading : ('Table ' + count);
            list.push({
              id: 'table-' + count,
              index: count,
              heading: heading,
              displayName: baseName + ' (' + headers.length + ' cols \xD7 ' + dataRows.length + ' rows)',
              headers: headers,
              dataRows: dataRows,
              rowCount: dataRows.length,
              columnCount: headers.length,
              rawTableMarkdown: tableRows.join(String.fromCharCode(10))
            });
          }
        });
        return list;
      }

      // Update axes selectors and multi-series checkboxes
      function updateTableMappingControls() {
        const currentTable = parsedTables[state.activeTableIndex];
        const xSelect = document.getElementById('xAxisSelect');
        const yContainer = document.getElementById('ySeriesContainer');
        const summary = document.getElementById('tableSummaryInfo');
        const headingDisplay = document.getElementById('activeTableHeading');

        if (!currentTable) {
          if (xSelect) xSelect.innerHTML = '<option>None</option>';
          if (yContainer) yContainer.innerHTML = '<span style="color:var(--text-muted);font-size:11px;">No data</span>';
          return;
        }

        if (headingDisplay) {
          headingDisplay.textContent = currentTable.heading || currentTable.displayName || 'Active Table';
        }

        if (summary) {
          summary.innerHTML = '<strong>' + currentTable.columnCount + '</strong> Cols &nbsp;\u2022&nbsp; <strong>' + currentTable.rowCount + '</strong> Rows';
        }

        document.getElementById('statRows').textContent = currentTable.rowCount + ' Rows';
        document.getElementById('statCols').textContent = currentTable.columnCount + ' Cols';

        // X-Axis dropdown
        if (xSelect) {
          xSelect.innerHTML = '';
          currentTable.headers.forEach((h, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.textContent = (h || ('Col ' + (idx + 1)));
            if (idx === state.selectedXIndex) opt.selected = true;
            xSelect.appendChild(opt);
          });
        }

        // Y-Axes series checkbox list
        if (yContainer) {
          yContainer.innerHTML = '';
          const palette = PALETTES[state.palette] || PALETTES.modern;

          if (!state.selectedYIndices || state.selectedYIndices.length === 0) {
            state.selectedYIndices = currentTable.headers
              .map((_, idx) => idx)
              .filter(idx => idx !== state.selectedXIndex);
            if (state.selectedYIndices.length === 0 && currentTable.headers.length > 0) {
              state.selectedYIndices = [0];
            }
          }

          currentTable.headers.forEach((h, idx) => {
            if (idx === state.selectedXIndex) return;

            const item = document.createElement('label');
            item.className = 'series-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = idx;
            checkbox.checked = state.selectedYIndices.includes(idx);

            const swatch = document.createElement('span');
            swatch.className = 'series-color-swatch';
            const color = palette[idx % palette.length];
            swatch.style.backgroundColor = color;

            const text = document.createElement('span');
            text.textContent = h || ('Series ' + (idx + 1));

            checkbox.addEventListener('change', () => {
              const selected = [];
              yContainer.querySelectorAll('input[type="checkbox"]:checked').forEach(cb => {
                selected.push(parseInt(cb.value, 10));
              });
              state.selectedYIndices = selected;
              renderChart();
              persistState();
            });

            item.appendChild(checkbox);
            item.appendChild(swatch);
            item.appendChild(text);
            yContainer.appendChild(item);
          });
        }

        renderChart();
      }

      // Render or Update Chart.js Instance
      function renderChart() {
        if (typeof Chart === 'undefined') {
          setTimeout(renderChart, 150);
          return;
        }

        const canvas = document.getElementById('mainChart');
        if (!canvas) return;

        const currentTable = parsedTables[state.activeTableIndex];
        if (!currentTable || currentTable.dataRows.length === 0) {
          if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
          }
          return;
        }

        const labels = currentTable.dataRows.map(row => row[state.selectedXIndex] || '');
        const palette = PALETTES[state.palette] || PALETTES.modern;
        const isDark = state.theme !== 'light';

        const gridColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
        const textColor = isDark ? '#a6b0c9' : '#334155';

        // Build Datasets
        const datasets = (state.selectedYIndices || []).map((colIdx) => {
          const seriesName = currentTable.headers[colIdx] || ('Series ' + (colIdx + 1));
          const color = palette[colIdx % palette.length];
          const rawValues = currentTable.dataRows.map(row => {
            const val = (row[colIdx] || '').replace(/[^0-9.-]/g, '');
            const parsed = parseFloat(val);
            return isNaN(parsed) ? 0 : parsed;
          });

          const isPieOrDonut = ['pie', 'doughnut', 'polarArea'].includes(state.chartType);

          return {
            label: seriesName,
            data: rawValues,
            backgroundColor: isPieOrDonut ? palette : (state.fillArea ? color + '33' : color),
            borderColor: color,
            borderWidth: 2.5,
            fill: state.fillArea,
            tension: state.smoothCurves ? 0.35 : 0,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: color
          };
        });

        document.getElementById('statSeries').textContent = datasets.length + ' Series';

        if (chartInstance) {
          chartInstance.destroy();
        }

        let chartJsType = state.chartType;
        let stacked = false;

        if (state.chartType === 'area') {
          chartJsType = 'line';
        } else if (state.chartType === 'stackedBar') {
          chartJsType = 'bar';
          stacked = true;
        }

        const ctx = canvas.getContext('2d');
        try {
          chartInstance = new Chart(ctx, {
            type: chartJsType,
            data: {
              labels: labels,
              datasets: datasets
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              animation: { duration: 300 },
              plugins: {
                legend: {
                  display: state.showLegend,
                  position: 'top',
                  labels: { color: textColor, font: { size: 11, weight: '600' } }
                },
                tooltip: {
                  backgroundColor: isDark ? '#191c24' : '#ffffff',
                  titleColor: isDark ? '#f3f5fa' : '#0f172a',
                  bodyColor: isDark ? '#a6b0c9' : '#334155',
                  borderColor: isDark ? '#384058' : '#cbd5e1',
                  borderWidth: 1,
                  padding: 10,
                  cornerRadius: 6
                }
              },
              scales: ['pie', 'doughnut', 'radar', 'polarArea'].includes(state.chartType) ? {} : {
                x: {
                  stacked: stacked,
                  grid: { display: state.showGrid, color: gridColor },
                  ticks: { color: textColor, font: { size: 10 } }
                },
                y: {
                  stacked: stacked,
                  grid: { display: state.showGrid, color: gridColor },
                  ticks: { color: textColor, font: { size: 10 } }
                }
              }
            }
          });
        } catch (err) {
          console.error('[GraphUtility] Chart creation error:', err);
        }
      }

      // Event Listeners Setup
      function setupEventListeners() {
        // Theme Toggle
        document.getElementById('themeToggleBtn')?.addEventListener('click', cycleTheme);

        // Sidebar collapse buttons
        const leftPanel = document.getElementById('leftPanel');
        const rightPanel = document.getElementById('rightPanel');

        document.getElementById('toggleLeftPanelBtn')?.addEventListener('click', () => {
          leftPanel.classList.toggle('collapsed');
          state.leftPanelCollapsed = leftPanel.classList.contains('collapsed');
          persistState();
        });

        document.getElementById('closeLeftPanelBtn')?.addEventListener('click', () => {
          leftPanel.classList.add('collapsed');
          state.leftPanelCollapsed = true;
          persistState();
        });

        document.getElementById('toggleRightPanelBtn')?.addEventListener('click', () => {
          rightPanel.classList.toggle('collapsed');
          state.rightPanelCollapsed = rightPanel.classList.contains('collapsed');
          persistState();
        });

        document.getElementById('closeRightPanelBtn')?.addEventListener('click', () => {
          rightPanel.classList.add('collapsed');
          state.rightPanelCollapsed = true;
          persistState();
        });

        // Chart Type Switcher Pills
        document.querySelectorAll('.toolbar-center .btn-pill').forEach(btn => {
          btn.addEventListener('click', () => {
            document.querySelectorAll('.toolbar-center .btn-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            state.chartType = btn.getAttribute('data-chart-type');
            if (state.chartType === 'area') state.fillArea = true;
            renderChart();
            persistState();
          });
        });

        // Table Selection
        document.getElementById('tableSelector')?.addEventListener('change', (e) => {
          state.activeTableIndex = parseInt(e.target.value, 10) || 0;
          state.selectedYIndices = [];
          updateTableMappingControls();
          persistState();
        });

        // Transpose Switch
        const transposeToggle = document.getElementById('transposeToggle');
        if (transposeToggle) {
          transposeToggle.checked = state.isTransposed;
          transposeToggle.addEventListener('change', (e) => {
            state.isTransposed = e.target.checked;
            parseTables();
            persistState();
            showToast(state.isTransposed ? 'Table Transposed (Rows \u21C4 Cols)' : 'Original Table Restored');
          });
        }

        // X-Axis Selector
        document.getElementById('xAxisSelect')?.addEventListener('change', (e) => {
          state.selectedXIndex = parseInt(e.target.value, 10) || 0;
          updateTableMappingControls();
          persistState();
        });

        // Select All Y Series Toggle
        document.getElementById('selectAllSeriesBtn')?.addEventListener('click', () => {
          const currentTable = parsedTables[state.activeTableIndex];
          if (!currentTable) return;
          const allIndices = currentTable.headers
            .map((_, idx) => idx)
            .filter(idx => idx !== state.selectedXIndex);

          if (state.selectedYIndices.length === allIndices.length) {
            state.selectedYIndices = allIndices.length > 0 ? [allIndices[0]] : [];
          } else {
            state.selectedYIndices = allIndices;
          }
          updateTableMappingControls();
          persistState();
          showToast('Selected ' + state.selectedYIndices.length + ' series');
        });

        // Palette Selector
        const paletteSelect = document.getElementById('paletteSelect');
        if (paletteSelect) {
          paletteSelect.value = state.palette;
          paletteSelect.addEventListener('change', (e) => {
            state.palette = e.target.value;
            updateTableMappingControls();
            persistState();
          });
        }

        // Visual Display Options
        const smoothToggle = document.getElementById('smoothCurvesToggle');
        if (smoothToggle) {
          smoothToggle.checked = state.smoothCurves;
          smoothToggle.addEventListener('change', (e) => {
            state.smoothCurves = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const fillToggle = document.getElementById('fillAreaToggle');
        if (fillToggle) {
          fillToggle.checked = state.fillArea;
          fillToggle.addEventListener('change', (e) => {
            state.fillArea = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const gridToggle = document.getElementById('showGridToggle');
        if (gridToggle) {
          gridToggle.checked = state.showGrid;
          gridToggle.addEventListener('change', (e) => {
            state.showGrid = e.target.checked;
            renderChart();
            persistState();
          });
        }

        const legendToggle = document.getElementById('showLegendToggle');
        if (legendToggle) {
          legendToggle.checked = state.showLegend;
          legendToggle.addEventListener('change', (e) => {
            state.showLegend = e.target.checked;
            renderChart();
            persistState();
          });
        }

        // Export Dropdown Menu
        const exportBtn = document.getElementById('exportDropdownBtn');
        const exportMenu = document.getElementById('exportMenu');
        exportBtn?.addEventListener('click', (e) => {
          e.stopPropagation();
          exportMenu?.classList.toggle('show');
        });
        document.addEventListener('click', () => exportMenu?.classList.remove('show'));

        // Switch Note action (Host Bridge)
        const triggerSwitchNote = async () => {
          if (!window.callAmplenotePlugin) {
            showToast('Note switching available inside Amplenote');
            return;
          }
          showToast('Opening Note Selector...');
          try {
            const res = await window.callAmplenotePlugin('pickNote');
            if (res && res.success) {
              currentNoteUUID = res.noteUUID;
              currentNoteName = res.noteName;
              cleanedMarkdown = res.cleanedContent;
              transposedMarkdown = res.transposeContent;
              initialTables = res.tables || [];
              state.noteUUID = currentNoteUUID;
              state.noteName = currentNoteName;
              state.activeTableIndex = 0;

              const titleEl = document.querySelector('#noteNameDisplay span');
              if (titleEl) titleEl.textContent = currentNoteName;
              parseTables();
              persistState();
              showToast('Switched to: ' + currentNoteName);
            }
          } catch (err) {
            showToast('Error switching note: ' + err.message);
          }
        };

        document.getElementById('switchNoteBtn')?.addEventListener('click', triggerSwitchNote);
        document.getElementById('emptyStateSwitchBtn')?.addEventListener('click', triggerSwitchNote);

        // Open Note in Amplenote (Host Bridge)
        document.getElementById('openNoteBtn')?.addEventListener('click', () => {
          if (window.callAmplenotePlugin) {
            window.callAmplenotePlugin('openNote', { noteUUID: currentNoteUUID });
          } else {
            window.open('https://www.amplenote.com/notes/' + currentNoteUUID, '_blank');
          }
        });

        // Refresh Data action (Host Bridge)
        document.getElementById('refreshDataBtn')?.addEventListener('click', async () => {
          if (!window.callAmplenotePlugin) {
            showToast('Refreshed local view');
            parseTables();
            return;
          }
          showToast('Refreshing note tables...');
          try {
            const res = await window.callAmplenotePlugin('refreshData', { noteUUID: currentNoteUUID });
            if (res && res.success) {
              cleanedMarkdown = res.cleanedContent;
              transposedMarkdown = res.transposeContent;
              initialTables = res.tables || [];
              parseTables();
              showToast('Table data refreshed!');
            }
          } catch (err) {
            showToast('Failed to refresh: ' + err.message);
          }
        });

        // Save Image Directly to Note (Host Bridge)
        document.getElementById('saveImageToNoteBtn')?.addEventListener('click', async () => {
          const canvas = document.getElementById('mainChart');
          if (!canvas) return;
          const dataUrl = canvas.toDataURL('image/png');
          const currentTable = parsedTables[state.activeTableIndex];

          if (window.callAmplenotePlugin) {
            showToast('Saving image above table in note...');
            try {
              const res = await window.callAmplenotePlugin('saveImageToNote', {
                noteUUID: currentNoteUUID,
                dataUrl: dataUrl,
                tableIndex: state.activeTableIndex,
                rawTableMarkdown: currentTable ? currentTable.rawTableMarkdown : ''
              });
              if (res && res.success) {
                showToast(res.message || 'Image saved to note!');
              } else {
                showToast(res?.error || 'Failed to save image.');
              }
            } catch (err) {
              showToast('Error: ' + err.message);
            }
          } else {
            showToast('Direct note saving available inside Amplenote');
          }
        });

        // Copy Image to Clipboard
        document.getElementById('copyImageClipboardBtn')?.addEventListener('click', async () => {
          const canvas = document.getElementById('mainChart');
          if (!canvas) return;
          try {
            canvas.toBlob(async (blob) => {
              if (blob && navigator.clipboard && navigator.clipboard.write) {
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                showToast('Chart image copied to clipboard!');
              } else {
                showToast('Clipboard access unavailable');
              }
            });
          } catch (err) {
            showToast('Failed to copy image: ' + err.message);
          }
        });

        // Download PNG
        document.getElementById('downloadPngBtn')?.addEventListener('click', () => {
          const canvas = document.getElementById('mainChart');
          if (!canvas) return;
          const link = document.createElement('a');
          link.download = (currentNoteName || 'Chart').replace(/[^a-z0-9]/gi, '_') + '_Chart.png';
          link.href = canvas.toDataURL('image/png');
          link.click();
          showToast('PNG downloaded');
        });

        // Download HTML
        document.getElementById('downloadHtmlBtn')?.addEventListener('click', () => {
          const htmlContent = '<!DOCTYPE html>' + document.documentElement.outerHTML;
          const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
          const link = document.createElement('a');
          link.download = (currentNoteName || 'GraphUtility').replace(/[^a-z0-9]/gi, '_') + '_Dashboard.html';
          link.href = URL.createObjectURL(blob);
          link.click();
          showToast('Offline HTML downloaded');
        });

        // Download CSV
        document.getElementById('downloadCsvBtn')?.addEventListener('click', async () => {
          const currentTable = parsedTables[state.activeTableIndex];
          if (!currentTable) return;
          const headerLine = currentTable.headers.map(h => '"' + (h || '').replace(/"/g, '""') + '"').join(',');
          const rowLines = currentTable.dataRows.map(row => row.map(cell => '"' + (cell || '').replace(/"/g, '""') + '"').join(','));
          const csvContent = [headerLine, ...rowLines].join(String.fromCharCode(10));
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          const link = document.createElement('a');
          link.download = (currentNoteName || 'Table').replace(/[^a-z0-9]/gi, '_') + '.csv';
          link.href = URL.createObjectURL(blob);
          link.click();
          showToast('CSV downloaded');
        });
      }

      // Initialize on Load
      function init() {
        loadPersistedState();
        applyTheme(state.theme);

        if (state.leftPanelCollapsed) document.getElementById('leftPanel')?.classList.add('collapsed');
        if (state.rightPanelCollapsed) document.getElementById('rightPanel')?.classList.add('collapsed');

        document.querySelectorAll('.toolbar-center .btn-pill').forEach(b => {
          if (b.getAttribute('data-chart-type') === state.chartType) {
            b.classList.add('active');
          } else {
            b.classList.remove('active');
          }
        });

        setupEventListeners();
        parseTables();
      }

      window.addEventListener('DOMContentLoaded', init);
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        init();
      }
    })();
  </script>
</body>
</html>`;
}

// anp-09-graph-utility/lib/features/renderEmbed.js
async function handleRenderEmbed(app, ...args) {
  try {
    let noteUUID = await app.settings["Current_Note_UUID [Do not Edit!]"];
    if (!noteUUID && args && args.length > 0 && typeof args[0] === "string") {
      noteUUID = args[0];
    }
    let rawSavedState = (app.settings || {})["Graph_Dashboard_State"];
    let savedState = null;
    if (rawSavedState) {
      try {
        savedState = typeof rawSavedState === "string" ? JSON.parse(rawSavedState) : rawSavedState;
      } catch {
        savedState = null;
      }
    }
    if (!noteUUID && savedState && savedState.lastActiveNoteUUID) {
      noteUUID = savedState.lastActiveNoteUUID;
    }
    if (!noteUUID && app.context && app.context.noteUUID) {
      noteUUID = app.context.noteUUID;
    }
    if (!noteUUID && app.filterNotes) {
      try {
        const recent = await app.filterNotes({ limit: 1 });
        if (recent && recent.length > 0 && recent[0].uuid) {
          noteUUID = recent[0].uuid;
        }
      } catch {
      }
    }
    let noteName = "Graph Utility Dashboard";
    let noteTags = [];
    let markdown = "";
    let cleanedContent = "";
    let transposeContent = "";
    let structuredTables = [];
    if (noteUUID) {
      const note = await app.notes.find(noteUUID);
      if (note) {
        noteName = note.name || "Untitled Note";
        noteTags = note.tags || [];
        markdown = await app.getNoteContent({ uuid: noteUUID }) || "";
        cleanedContent = extractTablesFromMarkdown(markdown, noteName);
        transposeContent = transposeMarkdownTables(cleanedContent);
        structuredTables = extractStructuredTables(markdown, noteName);
      }
    }
    const htmlTemplate = buildChartHtml({
      cleanedContent,
      transposeContent,
      structuredTables,
      noteName,
      noteTags,
      noteUUID: noteUUID || "",
      savedState
    });
    return htmlTemplate;
  } catch (error) {
    console.error("Error in handleRenderEmbed:", error);
    return `<div style="padding: 20px; font-family: sans-serif; color: #d9534f;">
      <h2>Error rendering Graph Utility:</h2>
      <p>${error.message}</p>
    </div>`;
  }
}

// anp-09-graph-utility/Graph Utility.js
var plugin = {
  appOption: {
    "Open Graph Dashboard": async function(app) {
      return launchGraphDashboard(app);
    }
  },
  noteOption: {
    "Open Graph Dashboard": async function(app, noteUUID) {
      return launchGraphDashboard(app, noteUUID);
    }
  },
  /**
   * Renders the interactive Chart.js embed using the current note's tables and persisted state.
   * @param {Object} app - The Amplenote plugin application context.
   * @param {...any} args - Additional arguments passed to renderEmbed.
   * @returns {Promise<string>} The generated HTML template.
   */
  async renderEmbed(app, ...args) {
    return handleRenderEmbed(app, ...args);
  },
  /**
   * Responds to messages and action calls from within the interactive embed.
   * Handles note switching, table refreshing, image saving to note, and state persistence.
   * @param {Object} app - The Amplenote plugin application context.
   * @param {string} actionName - Name of the action invoked by the embed.
   * @param {Object} [payload] - Optional parameters.
   * @returns {Promise<any>}
   */
  async onEmbedCall(app, actionName, payload) {
    return handleEmbedCall(app, actionName, payload);
  }
};
var Graph_Utility_default = plugin;


return Graph_Utility_default;
})()