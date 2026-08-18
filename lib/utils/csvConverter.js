import { extractStructuredTables } from "./markdownParser.js";

/**
 * Converts markdown table content to clean, RFC 4180 compliant CSV format.
 * Leverages canonical table parsing to correctly handle escaped pipes (\|),
 * strip markdown delimiter rows (|---|), and properly quote cell values.
 * @param {string} content - Markdown content containing tables
 * @param {string} [noteName] - Optional note name for table labeling
 * @returns {string} Clean CSV formatted string
 */
export function convertMarkdownToCSV(content, noteName = "") {
  if (!content || typeof content !== "string") return "";
  const tables = extractStructuredTables(content, noteName);
  if (!tables || tables.length === 0) return "";

  const csvBlocks = [];
  tables.forEach((tbl) => {
    const headerLine = tbl.headers.map(h => `"${(h || "").replace(/"/g, '""')}"`).join(",");
    const rowLines = tbl.dataRows.map(row =>
      row.map(cell => `"${(cell || "").replace(/"/g, '""')}"`).join(",")
    );
    csvBlocks.push([headerLine, ...rowLines].join("\n"));
  });

  return csvBlocks.join("\n\n");
}

