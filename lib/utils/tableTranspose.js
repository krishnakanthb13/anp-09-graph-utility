import { cleanHeaderName, splitTableRow } from "./markdownParser.js";

/**
 * Transposes a 2D array matrix safely handling ragged rows.
 * @param {Array<Array>} array
 * @returns {Array<Array>}
 */
export function transposeArray(array) {
  if (!array || !Array.isArray(array) || array.length === 0) return [];
  
  const numRows = array.length;
  let maxCols = 0;
  for (let i = 0; i < numRows; i++) {
    const row = array[i];
    if (Array.isArray(row) && row.length > maxCols) {
      maxCols = row.length;
    }
  }
  if (maxCols === 0) return [];

  const result = new Array(maxCols);
  for (let col = 0; col < maxCols; col++) {
    const newRow = new Array(numRows);
    for (let row = 0; row < numRows; row++) {
      const cell = (array[row] && array[row][col] !== undefined) ? array[row][col] : '';
      newRow[row] = cell;
    }
    result[col] = newRow;
  }
  return result;
}

/**
 * Transposes a structured table object in memory.
 * Preserves metadata, inverts rows and columns, updates headers, and recalculates counts.
 * @param {Object} table - Structured table descriptor object
 * @returns {Object} Transposed structured table descriptor object
 */
export function transposeStructuredTable(table) {
  if (!table || !table.headers) return table;

  const originalMatrix = [
    table.headers,
    ...(table.dataRows || [])
  ];

  const transposedMatrix = transposeArray(originalMatrix);
  if (transposedMatrix.length === 0) return table;

  const rawHeaders = transposedMatrix[0];
  const newHeaders = rawHeaders.map((h, idx) => cleanHeaderName(h, idx));
  const newDataRows = transposedMatrix.slice(1);

  const baseName = table.baseName || table.heading || (`Table ${table.index || 1}`);
  const displayName = `${baseName} (Transposed: ${newHeaders.length} cols × ${newDataRows.length} rows)`;

  // Generate clean transposed markdown
  const colCount = newHeaders.length;
  const headerLine = '| ' + newHeaders.map(h => String(h).replace(/\|/g, '\\|')).join(' | ') + ' |';
  const delimLine = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
  const dataLines = newDataRows.map(row => '| ' + row.map(c => String(c !== undefined && c !== null ? c : '').replace(/\|/g, '\\|')).join(' | ') + ' |');
  const rawTableMarkdown = [headerLine, delimLine, ...dataLines].join('\n');

  return {
    id: `${table.id || 'table'}-transposed`,
    index: table.index || 1,
    heading: table.heading ? `${table.heading} (Transposed)` : 'Transposed Table',
    noteName: table.noteName || '',
    baseName: `${baseName} (Transposed)`,
    displayName,
    headers: newHeaders,
    dataRows: newDataRows,
    rowCount: newDataRows.length,
    columnCount: newHeaders.length,
    rawTableMarkdown,
    isTransposed: true
  };
}

/**
 * Transposes all markdown tables in the content string.
 * Splits content only by standalone '---' dividers (not table separator rows).
 * @param {string} content - Cleaned markdown content with tables separated by standalone ---
 * @returns {string} Content with transposed tables
 */
export function transposeMarkdownTables(content) {
  if (!content || typeof content !== 'string') return '';

  // Split strictly on standalone '---' lines (not table rows with |---|)
  const sections = content.split(/(?:^|\n)\s*---+\s*(?:\n|$)/);

  const processedSections = sections.map(section => {
    const trimmed = section.trim();
    if (!trimmed) return '';

    const lines = trimmed.split('\n');
    let heading = '';
    const tableLines = [];

    lines.forEach(line => {
      const l = line.trim();
      if (l.startsWith('#')) {
        heading = l;
      } else if (l.startsWith('|')) {
        tableLines.push(l);
      }
    });

    if (tableLines.length === 0) {
      return section;
    }

    const parseCells = rowStr => splitTableRow(rowStr);
    const tableRows = tableLines.map(parseCells);

    const isDelim = r => r.every(c => !c || /^[\s\-:]*$/.test(c));
    const contentRows = tableRows.filter(row => !isDelim(row) && row.some(c => c !== ''));

    if (contentRows.length === 0) return section;

    const transposedMatrix = transposeArray(contentRows);
    if (transposedMatrix.length === 0) return section;

    const rawHeaders = transposedMatrix[0];
    const newHeaders = rawHeaders.map((h, idx) => cleanHeaderName(h, idx));
    const newDataRows = transposedMatrix.slice(1);

    const colCount = newHeaders.length;
    const headerLine = '| ' + newHeaders.map(h => String(h).replace(/\|/g, '\\|')).join(' | ') + ' |';
    const delimLine = '| ' + Array(colCount).fill('---').join(' | ') + ' |';
    const dataLines = newDataRows.map(row => '| ' + row.map(c => String(c !== undefined && c !== null ? c : '').replace(/\|/g, '\\|')).join(' | ') + ' |');

    const transposedTable = [headerLine, delimLine, ...dataLines].join('\n');
    const transposedHeader = heading ? (heading.includes('(Transposed)') ? heading : `${heading} (Transposed)`) : '';

    return transposedHeader ? `${transposedHeader}\n\n${transposedTable}` : transposedTable;
  });

  return processedSections.join('\n\n---\n\n');
}
