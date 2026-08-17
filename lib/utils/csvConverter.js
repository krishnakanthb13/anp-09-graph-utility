/**
 * Converts markdown table content to CSV format.
 * Strips heading markers, converts pipe-delimited tables to quoted CSV.
 * @param {string} content - Markdown content with tables
 * @returns {string} CSV formatted string
 */
export function convertMarkdownToCSV(content) {
  // Step 1: Split content, remove # at start of lines, then process tables
  const csvLines = content.split('\n').map(line => {
    // Remove leading # followed by spaces
    const cleanedLine = line.replace(/^#+\s*/, '');
    return cleanedLine;
  }).filter(line => {
    // Skip lines that don't represent a table
    return line.includes('|');
  }).map(line => {
    // Remove leading and trailing pipes, then trim
    const trimmedLine = line.trim().replace(/^\|/, '').replace(/\|$/, '').trim();
    
    // Replace pipes with commas, add quotes around each value
    return trimmedLine.split('|').map(cell => `"${cell.trim()}"`).join(',');
  }).filter(line => line !== ''); // Remove any empty lines

  // Join all processed lines to form CSV content
  return csvLines.join('\n');
}
