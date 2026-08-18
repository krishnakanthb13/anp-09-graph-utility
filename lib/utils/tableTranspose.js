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

    const tableLines = lines.filter(line => line.trim().startsWith('|'));

    if (tableLines.length === 0) {
      return section;
    }

    const tableRows = tableLines.map(row => row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()));
    
    const isDelim = r => r.every(c => !c || (c + '').replace(/[-:\s]/g, '').trim().length === 0);
    const dataRows = tableRows.filter(row => !isDelim(row));

    const transposedRows = transposeArray(dataRows);

    if (transposedRows.length === 0) return section;

    const columnCount = transposedRows[0].length;
    const firstRow = '| ' + transposedRows[0].join(' | ') + ' |';
    const separatorRow = '| ' + Array(columnCount).fill('---').join(' | ') + ' |';

    const restTransposed = transposedRows.slice(1).map(row => '| ' + row.join(' | ') + ' |');

    const transposedTable = [
      firstRow,
      separatorRow,
      ...restTransposed
    ].join('\n');

    // Step 2e: Combine header with transposed table
    return `${transposedHeader}\n\n\n${transposedTable}`;
  });

  // Step 3: Reassemble the processed sections
  return processedSections.join('\n\n---\n\n');
}
