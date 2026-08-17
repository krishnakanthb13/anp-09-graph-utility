import { transposeArray, transposeMarkdownTables } from '../lib/utils/tableTranspose.js';

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

  it('should handle non-square arrays (Edge Case)', () => {
    const input = [
      ['A', 'B', 'E'],
      ['C', 'D'],
    ];
    // map uses array[0] length, so 'E' is ignored for second row resulting in undefined
    const expected = [
      ['A', 'C'],
      ['B', 'D'],
      ['E', undefined]
    ];
    expect(transposeArray(input)).toEqual(expected);
  });
});

describe('transposeMarkdownTables', () => {
  it('should transpose markdown table correctly (Happy Path)', () => {
    const content = `# Table 1\n\n\n| header 1 | header 2 |\n| - | - |\n| A | B |\n| C | D |`;

    const result = transposeMarkdownTables(content);
    
    // Result should have transposed header and empty headers/separators for data
    expect(result).toContain('# Table 1 (Transposed)');
    expect(result).toContain('|   |   |');
    expect(result).toContain('| - | - |');
    expect(result).toContain('| A | C |');
    expect(result).toContain('| B | D |');
  });

  it('should ignore sections with less than 3 lines (Edge Case)', () => {
    const content = `Not a table\nJust some text`;
    expect(transposeMarkdownTables(content)).toEqual(content);
  });

  it('should ignore sections with empty table rows (Edge Case)', () => {
    const content = `# Table 1\n\n\n`;
    expect(transposeMarkdownTables(content)).toEqual(content);
  });
});
