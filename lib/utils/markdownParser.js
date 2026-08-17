/**
 * Removes HTML comments from content.
 * @param {string} content
 * @returns {string}
 */
export function removeHtmlComments(content) {
  return content.replace(/<!--[\s\S]*?-->/g, '').trim();
}

/**
 * Removes completely empty rows and columns from a markdown table string.
 * @param {string} table
 * @returns {string}
 */
export function removeEmptyRowsAndColumns(table) {
  const rows = table.split('\n').filter(row => row.trim().startsWith('|'));

  // Remove completely empty rows
  const filteredRows = rows.filter(row => {
    const cells = row.split('|').slice(1, -1); // Exclude the leading and trailing empty cells
    const hasContent = cells.some(cell => cell.trim() !== '');
    return hasContent;
  });

  if (filteredRows.length === 0) {
    return ''; // If all rows are empty, return empty string
  }

  // Determine the columns that are not empty across all rows
  const columnCount = filteredRows[0].split('|').length - 2;
  const nonEmptyColumns = Array.from({ length: columnCount }, (_, colIndex) =>
    filteredRows.some(row => row.split('|')[colIndex + 1].trim() !== '')
  );

  // Remove empty columns
  const cleanedRows = filteredRows.map(row => {
    const cells = row.split('|').slice(1, -1); // Exclude the leading and trailing empty cells
    const filteredCells = cells.filter((_, i) => nonEmptyColumns[i]);
    return `| ${filteredCells.join(' | ')} |`;
  });

  return cleanedRows.join('\n');
}

/**
 * Extracts all tables from note markdown, labels them, and returns cleaned content.
 * Tables are separated by '---' delimiters and labeled as '# Table N'.
 * @param {string} markdown - Raw note markdown
 * @returns {string} Cleaned content with labeled tables
 */
export function extractTablesFromMarkdown(markdown) {
  const lines = markdown.split('\n');

  let tableCount = 0;
  let inTable = false;
  const tables = [];
  let currentTable = [];

  lines.forEach((line) => {
    if (line.trim().startsWith('|')) {  // Identifying table rows
      if (!inTable) {
        tableCount++;

        if (tableCount > 1) {
          tables.push('---');  // Add separator between tables
        }
        tables.push(`# Table ${tableCount}\n`);
        inTable = true;
      }

      if (currentTable.length === 0 && line.split('|').every(cell => cell.trim() === '')) {
        // Automatically Adding Columns is disabled for now!
      }

      currentTable.push(line);
    } else if (inTable) {
      inTable = false;

      const tableContent = currentTable.join('\n');
      tables.push(tableContent);
      tables.push('');  // Add an additional blank line between tables

      currentTable = [];
    }
  });

  // Ensure the last table is pushed if the markdown ends with a table
  if (currentTable.length > 0) {
    const tableContent = currentTable.join('\n');
    tables.push(removeEmptyRowsAndColumns(tableContent));
  }

  // Join all tables and remove HTML comments at the end
  const processedContent = tables.join('\n\n');
  return removeHtmlComments(processedContent);
}
