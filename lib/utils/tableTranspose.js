/**
 * Transposes a 2D array.
 * @param {Array<Array>} array
 * @returns {Array<Array>}
 */
export function transposeArray(array) {
  if (!array || array.length === 0) return [];
  return array[0].map((_, colIndex) => array.map(row => row[colIndex]));
}

/**
 * Transposes all markdown tables in the content.
 * Splits content by '---', transposes each table section, and reassembles.
 * @param {string} content - Cleaned markdown content with tables separated by ---
 * @returns {string} Content with transposed tables
 */
export function transposeMarkdownTables(content) {
  // Step 1: Split content based on "---"
  const sections = content.split('---');

  const processedSections = sections.map(section => {
    const lines = section.trim().split('\n');
    if (lines.length < 3) return section; // Not a valid table section

    // Step 2a: Extract header
    const header = lines[0].trim();
    const transposedHeader = header + " (Transposed)";

    // Step 2b: Extract table rows, ignore first two lines
    const tableRows = lines.slice(3).map(row => row.split('|').slice(1, -1).map(cell => cell.trim()));

    // Check if tableRows has data
    if (tableRows.length === 0 || tableRows[0].length === 0) {
      return section; // Return original if no valid table rows are found
    }

    // Separate the rest for transposing
    const restRows = tableRows.slice(2);

    // Step 2c: Transpose the table
    const transposedRows = transposeArray(restRows);

    if (transposedRows.length === 0) return section;

    // Step 2d: Add two empty rows at the start
    const columnCount = transposedRows[0].length;
    const firstRow = '| ' + Array(columnCount).fill(' ').join(' | ') + ' |';
    const separatorRow = '| ' + Array(columnCount).fill('-').join(' | ') + ' |';

    const transposedTable = [
      firstRow,
      separatorRow,
      ...transposedRows.map(row => '| ' + row.join(' | ') + ' |')
    ].join('\n');

    // Step 2e: Combine header with transposed table
    return `${transposedHeader}\n\n\n${transposedTable}`;
  });

  // Step 3: Reassemble the processed sections
  return processedSections.join('\n\n---\n\n');
}
