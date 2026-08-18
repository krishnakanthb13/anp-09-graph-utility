/**
 * Removes HTML comments from content.
 * @param {string} content
 * @returns {string}
 */
export function removeHtmlComments(content) {
  return (content || '').replace(/<!--[\s\S]*?-->/g, '').trim();
}

/**
 * Safely splits a markdown table row string into individual cell strings,
 * properly respecting escaped pipes (\|).
 * @param {string} rowStr
 * @returns {string[]}
 */
export function splitTableRow(rowStr) {
  if (!rowStr || typeof rowStr !== 'string') return [];
  const trimmed = rowStr.trim().replace(/^\|/, '').replace(/\|$/, '');
  const cells = [];
  let current = '';
  let escaped = false;

  for (let i = 0; i < trimmed.length; i++) {
    const char = trimmed[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\' && i + 1 < trimmed.length && trimmed[i + 1] === '|') {
      escaped = true;
    } else if (char === '|') {
      cells.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  cells.push(current.trim());
  return cells;
}

/**
 * Cleans completely empty outer rows and normalizes row widths in a markdown table string.
 * Preserves deliberate empty columns so data model columns (e.g. Q2 placeholders) are not lost.
 * @param {string} table
 * @returns {string}
 */
export function removeEmptyRowsAndColumns(table) {
  if (!table || typeof table !== 'string') return '';
  const rows = table.split('\n').filter(row => row.trim().startsWith('|'));
  if (rows.length === 0) return '';

  const parsedRows = rows.map(r => splitTableRow(r));
  const columnCount = Math.max(...parsedRows.map(r => r.length));
  if (columnCount === 0) return '';

  const normalized = parsedRows.map(row => 
    Array.from({ length: columnCount }, (_, i) => row[i] ?? "")
  );

  // Keep all rows that have at least one non-empty cell (or delimiter rows)
  const cleanedRows = normalized
    .filter(row => row.some(cell => cell.trim() !== ''))
    .map(row => `| ${row.map(cell => (cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`);

  return cleanedRows.join('\n');
}

/**
 * Checks if a row string or array of cell strings is purely delimiter/placeholder characters (dashes, colons, whitespace).
 * @param {string|string[]} row
 * @returns {boolean}
 */
export function isDelimiterOrPlaceholderRow(row) {
  if (!row) return true;
  if (typeof row === 'string') {
    const trimmed = row.trim();
    if (!trimmed.startsWith('|')) return false;
    const cells = splitTableRow(trimmed);
    return cells.every(c => /^[\s\-:]*$/.test(c));
  }
  if (Array.isArray(row)) {
    return row.every(c => typeof c === 'string' && /^[\s\-:]*$/.test(c));
  }
  return false;
}

/**
 * Cleans an individual header name, falling back to 'Column N' if empty or just dashes.
 * @param {string} rawHeader
 * @param {number} index
 * @returns {string}
 */
export function cleanHeaderName(rawHeader, index) {
  const cleaned = removeHtmlComments(rawHeader || '').trim();
  if (!cleaned || /^[\s\-:]+$/.test(cleaned)) {
    return `Column ${index + 1}`;
  }
  return cleaned;
}

/**
 * Helper to parse clean table markdown into a structured table object with robust header extraction.
 */
function parseTableLinesIntoObject(cleanedTableMarkdown, tableIndex, heading, noteName) {
  const rawRows = cleanedTableMarkdown.split('\n').filter(r => r.trim().startsWith('|'));
  if (rawRows.length < 1) return null;

  const parseCells = (rowStr) => {
    return splitTableRow(rowStr).map(c => removeHtmlComments(c).trim());
  };

  const parsedRows = rawRows.map(parseCells).filter(row => row.some(c => c !== ''));
  if (parsedRows.length === 0) return null;

  let headerRowIndex = 0;

  // Skip leading pure delimiter rows
  while (headerRowIndex < parsedRows.length && isDelimiterOrPlaceholderRow(parsedRows[headerRowIndex])) {
    headerRowIndex++;
  }

  if (headerRowIndex >= parsedRows.length) return null;

  const candidateHeaders = parsedRows[headerRowIndex];
  const headers = candidateHeaders.map((h, idx) => cleanHeaderName(h, idx));

  let dataStartIndex = headerRowIndex + 1;
  // If next row is a delimiter, skip it
  if (dataStartIndex < parsedRows.length && isDelimiterOrPlaceholderRow(parsedRows[dataStartIndex])) {
    dataStartIndex++;
  }

  const dataRows = [];
  for (let i = dataStartIndex; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    if (!isDelimiterOrPlaceholderRow(row) && row.some(c => c !== '')) {
      const paddedRow = headers.map((_, colIdx) => (row[colIdx] !== undefined ? row[colIdx] : ''));
      dataRows.push(paddedRow);
    }
  }

  const labelParts = [];
  if (noteName) labelParts.push(noteName);
  if (heading) labelParts.push(heading);
  labelParts.push(`Table ${tableIndex}`);
  const baseName = labelParts.join(' > ');
  const displayName = `${baseName} (${headers.length} cols × ${dataRows.length} rows)`;

  return {
    id: `table-${tableIndex}`,
    index: tableIndex,
    heading: heading || '',
    noteName: noteName || '',
    baseName,
    displayName,
    headers,
    dataRows,
    rowCount: dataRows.length,
    columnCount: headers.length,
    rawTableMarkdown: cleanedTableMarkdown
  };
}

/**
 * Extracts all tables from note markdown, labels them, and returns cleaned content.
 * Tables are separated by '---' delimiters and labeled as '# Table N' (or with heading context).
 * @param {string} markdown - Raw note markdown
 * @param {string} [noteName] - Optional note name for display context
 * @returns {string} Cleaned content with labeled tables
 */
export function extractTablesFromMarkdown(markdown, noteName = '') {
  const lines = (markdown || '').split('\n');

  let tableCount = 0;
  let inTable = false;
  let currentHeading = '';
  const tables = [];
  let currentTable = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
      const headingMatch = trimmed.match(/^#+\s*(.+)$/);
      if (headingMatch && headingMatch[1]) {
        currentHeading = removeHtmlComments(headingMatch[1]).trim();
      }
    }

    if (trimmed.startsWith('|')) {
      if (!inTable) {
        tableCount++;
        if (tableCount > 1) {
          tables.push('---');
        }

        let label = `# Table ${tableCount}`;
        if (noteName || currentHeading) {
          const parts = [];
          if (noteName) parts.push(noteName);
          if (currentHeading) parts.push(currentHeading);
          parts.push(`Table ${tableCount}`);
          label = `# ${parts.join(' > ')}`;
        }

        tables.push(`${label}\n`);
        inTable = true;
      }
      currentTable.push(line);
    } else if (inTable) {
      inTable = false;
      const tableContent = currentTable.join('\n');
      tables.push(removeEmptyRowsAndColumns(tableContent));
      tables.push('');
      currentTable = [];
    }
  });

  if (currentTable.length > 0) {
    const tableContent = currentTable.join('\n');
    tables.push(removeEmptyRowsAndColumns(tableContent));
  }

  const processedContent = tables.join('\n\n');
  return removeHtmlComments(processedContent);
}

/**
 * Extracts structured table objects from markdown including heading metadata,
 * row/column counts, headers, and parsed data rows.
 * @param {string} markdown - Raw note markdown
 * @param {string} [noteName] - Source note name
 * @returns {Array<Object>} Array of structured table descriptor objects
 */
export function extractStructuredTables(markdown, noteName = '') {
  const lines = (markdown || '').split('\n');
  let tableCount = 0;
  let inTable = false;
  let currentHeading = '';
  const result = [];
  let currentTableLines = [];

  lines.forEach((line) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('#')) {
      const headingMatch = trimmed.match(/^#+\s*(.+)$/);
      if (headingMatch && headingMatch[1]) {
        currentHeading = removeHtmlComments(headingMatch[1]).trim();
      }
    }

    if (trimmed.startsWith('|')) {
      if (!inTable) {
        tableCount++;
        inTable = true;
      }
      currentTableLines.push(line);
    } else if (inTable) {
      inTable = false;
      const cleaned = removeEmptyRowsAndColumns(currentTableLines.join('\n'));
      if (cleaned) {
        const tableObj = parseTableLinesIntoObject(cleaned, tableCount, currentHeading, noteName);
        if (tableObj) result.push(tableObj);
      }
      currentTableLines = [];
    }
  });

  if (currentTableLines.length > 0) {
    const cleaned = removeEmptyRowsAndColumns(currentTableLines.join('\n'));
    if (cleaned) {
      const tableObj = parseTableLinesIntoObject(cleaned, tableCount, currentHeading, noteName);
      if (tableObj) result.push(tableObj);
    }
  }

  return result;
}
