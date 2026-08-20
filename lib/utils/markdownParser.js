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
  if (!trimmed.includes('\\')) {
    return trimmed.split('|').map(s => s.trim());
  }

  const cells = [];
  let current = '';
  let escaped = false;
  const len = trimmed.length;

  for (let i = 0; i < len; i++) {
    const char = trimmed[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === '\\' && i + 1 < len && trimmed[i + 1] === '|') {
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
 * Normalizes row widths and cleans outer whitespace in a markdown table string.
 * Preserves empty columns and rows so data model placeholders are intact.
 * @param {string} table
 * @returns {string}
 */
export function removeEmptyRowsAndColumns(table) {
  if (!table || typeof table !== 'string') return '';
  const lines = table.split('\n');
  const rows = lines.filter(row => row.trim().startsWith('|'));
  if (rows.length === 0) return '';

  const parsedRows = rows.map(splitTableRow);
  let columnCount = 0;
  for (let i = 0; i < parsedRows.length; i++) {
    if (parsedRows[i].length > columnCount) {
      columnCount = parsedRows[i].length;
    }
  }
  if (columnCount === 0) return '';

  const cleanedRows = [];
  for (let i = 0; i < parsedRows.length; i++) {
    const row = parsedRows[i];
    let hasNonEmpty = false;
    while (row.length < columnCount) {
      row.push('');
    }
    for (let c = 0; c < columnCount; c++) {
      if (row[c] && row[c].trim() !== '') {
        hasNonEmpty = true;
        break;
      }
    }
    if (hasNonEmpty) {
      cleanedRows.push(`| ${row.map(cell => (cell ?? '').replace(/\|/g, '\\|')).join(' | ')} |`);
    }
  }

  return cleanedRows.join('\n');
}

/**
 * Checks if a row string or array of cell strings is a markdown table delimiter row (e.g. |---|---| or |:---:|).
 * Requires hyphens (-) in every cell; does NOT treat regular empty cells as delimiters.
 * @param {string|string[]} row
 * @returns {boolean}
 */
export function isDelimiterOrPlaceholderRow(row) {
  if (!row) return false;
  let cells = [];
  if (typeof row === 'string') {
    const trimmed = row.trim();
    if (!trimmed.startsWith('|')) return false;
    cells = splitTableRow(trimmed);
  } else if (Array.isArray(row)) {
    cells = row;
  }
  if (cells.length === 0) return false;
  // A delimiter row MUST have at least one hyphen in each cell
  return cells.every(c => typeof c === 'string' && /^[\s:]*-+[\s\-:]*$/.test(c.trim()));
}

/**
 * Cleans an individual header name, falling back to 'Column N' if empty or just dashes.
 * @param {string} rawHeader
 * @param {number} index
 * @returns {string}
 */
export function cleanHeaderName(rawHeader, index) {
  const cleaned = removeHtmlComments(rawHeader || '')
    .trim()
    .replace(/^[*_~`]+|[*_~`]+$/g, '')
    .trim();
  if (!cleaned || /^[\s\-:]+$/.test(cleaned)) {
    return `Column ${index + 1}`;
  }
  return cleaned;
}

/**
 * Parses cleaned table lines into a structured table object with robust header extraction.
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

  // Skip leading pure delimiter rows (e.g. if table accidentally starts with |---|)
  while (headerRowIndex < parsedRows.length && isDelimiterOrPlaceholderRow(parsedRows[headerRowIndex])) {
    headerRowIndex++;
  }

  if (headerRowIndex >= parsedRows.length) return null;

  const candidateHeaders = parsedRows[headerRowIndex];
  const headers = candidateHeaders.map((h, idx) => cleanHeaderName(h, idx));

  let dataStartIndex = headerRowIndex + 1;
  // If next row is a delimiter row (|---|---|), skip it for data rows
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
 * Canonical markdown table tokenizer for Amplenote.
 * Scans markdown, tracks fenced code blocks, extracts table line positions,
 * raw representations, and structured metadata.
 * @param {string} markdown - Source note markdown
 * @param {string} [noteName] - Optional note name
 * @returns {Array<Object>} List of discovered table descriptor blocks
 */
export function findMarkdownTableBlocks(markdown, noteName = '') {
  if (!markdown || typeof markdown !== 'string') return [];

  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  const blocks = [];
  let inCodeFence = false;
  let currentHeading = '';
  let currentTableLines = [];
  let tableStartLine = -1;

  const processAccumulatedTable = () => {
    if (currentTableLines.length === 0) return;

    const rawText = currentTableLines.map(t => t.text).join('\n');
    const startLine = tableStartLine;
    const endLine = currentTableLines[currentTableLines.length - 1].lineIndex;
    const cleaned = removeEmptyRowsAndColumns(rawText);

    if (cleaned) {
      const tableIndex = blocks.length + 1;
      const tableObj = parseTableLinesIntoObject(cleaned, tableIndex, currentHeading, noteName);
      if (tableObj) {
        tableObj.startLine = startLine;
        tableObj.endLine = endLine;
        tableObj.sourceRaw = rawText.trim();
        blocks.push(tableObj);
      }
    }

    currentTableLines = [];
    tableStartLine = -1;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Track fenced code blocks (``` or ~~~) so code examples are not parsed as tables
    if (/^(```|~~~)/.test(trimmed)) {
      inCodeFence = !inCodeFence;
      if (currentTableLines.length > 0) {
        processAccumulatedTable();
      }
      continue;
    }

    if (inCodeFence) {
      continue;
    }

    // Check for Markdown headings
    if (trimmed.startsWith('#')) {
      const headingMatch = trimmed.match(/^#+\s*(.+)$/);
      if (headingMatch && headingMatch[1]) {
        currentHeading = removeHtmlComments(headingMatch[1]).trim();
      }
      if (currentTableLines.length > 0) {
        processAccumulatedTable();
      }
      continue;
    }

    // In Amplenote, markdown table lines start with '|'
    const isTableRow = trimmed.startsWith('|');

    if (isTableRow && trimmed.length > 0) {
      if (currentTableLines.length === 0) {
        tableStartLine = i;
      }
      currentTableLines.push({ lineIndex: i, text: line });
    } else {
      if (currentTableLines.length > 0) {
        processAccumulatedTable();
      }
    }
  }

  if (currentTableLines.length > 0) {
    processAccumulatedTable();
  }

  return blocks;
}

/**
 * Extracts all tables from note markdown, labels them, and returns cleaned content.
 * Tables are separated by '---' delimiters and labeled as '# Table N' (or with heading context).
 * @param {string} markdown - Raw note markdown
 * @param {string} [noteName] - Optional note name for display context
 * @returns {string} Cleaned content with labeled tables
 */
export function extractTablesFromMarkdown(markdown, noteName = '') {
  const blocks = findMarkdownTableBlocks(markdown, noteName);
  if (blocks.length === 0) return '';

  const sections = [];
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    let label = `# Table ${block.index}`;
    if (noteName || block.heading) {
      const parts = [];
      if (noteName) parts.push(noteName);
      if (block.heading) parts.push(block.heading);
      parts.push(`Table ${block.index}`);
      label = `# ${parts.join(' > ')}`;
    }
    sections.push(`${label}\n\n${block.rawTableMarkdown}`);
  }

  const processedContent = sections.join('\n\n---\n\n');
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
  return findMarkdownTableBlocks(markdown, noteName);
}
