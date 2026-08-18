import { transposeArray, transposeMarkdownTables, transposeStructuredTable } from '../lib/utils/tableTranspose.js';

describe('transposeArray', () => {
  it('should transpose a valid 2D array (Happy Path)', () => {
    const input = [
      ['A', 'B'],
      ['C', 'D'],
    ];
    const expected = [
      ['A', 'C'],
      ['B', 'D'],
    ];
    expect(transposeArray(input)).toEqual(expected);
  });

  it('should return empty array for empty input (Edge Case)', () => {
    expect(transposeArray([])).toEqual([]);
    expect(transposeArray(null)).toEqual([]);
    expect(transposeArray(undefined)).toEqual([]);
  });

  it('should handle non-square arrays cleanly without undefined cells (Edge Case)', () => {
    const input = [
      ['A', 'B', 'E'],
      ['C', 'D'],
    ];
    const expected = [
      ['A', 'C'],
      ['B', 'D'],
      ['E', '']
    ];
    expect(transposeArray(input)).toEqual(expected);
  });
});

describe('transposeStructuredTable', () => {
  it('should transpose a structured table descriptor object preserving metadata', () => {
    const table = {
      id: 'table-1',
      index: 1,
      heading: 'Q1 Sales',
      noteName: 'Revenue 2026',
      baseName: 'Revenue 2026 > Q1 Sales > Table 1',
      displayName: 'Revenue 2026 > Q1 Sales > Table 1 (3 cols × 2 rows)',
      headers: ['Month', 'Product A', 'Product B'],
      dataRows: [
        ['Jan', '100', '200'],
        ['Feb', '150', '250']
      ],
      rowCount: 2,
      columnCount: 3
    };

    const transposed = transposeStructuredTable(table);
    expect(transposed.headers).toEqual(['Month', 'Jan', 'Feb']);
    expect(transposed.dataRows).toEqual([
      ['Product A', '100', '150'],
      ['Product B', '200', '250']
    ]);
    expect(transposed.columnCount).toBe(3);
    expect(transposed.rowCount).toBe(2);
    expect(transposed.displayName).toContain('Transposed: 3 cols × 2 rows');
  });
});

describe('transposeMarkdownTables', () => {
  it('should transpose markdown table correctly with intact headers (Happy Path)', () => {
    const content = `# Table 1\n\n\n| header 1 | header 2 |\n| - | - |\n| A | B |\n| C | D |`;

    const result = transposeMarkdownTables(content);
    
    expect(result).toContain('# Table 1 (Transposed)');
    expect(result).toContain('| header 1 | A | C |');
    expect(result).toContain('| --- | --- | --- |');
    expect(result).toContain('| header 2 | B | D |');
  });

  it('should ignore sections without tables (Edge Case)', () => {
    const content = `Not a table\nJust some text`;
    expect(transposeMarkdownTables(content)).toEqual(content);
  });

  it('should ignore sections with empty content (Edge Case)', () => {
    const content = `# Table 1\n\n\n`;
    expect(transposeMarkdownTables(content)).toEqual(content);
  });
});

