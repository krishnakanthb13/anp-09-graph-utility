import { removeHtmlComments, removeEmptyRowsAndColumns, extractTablesFromMarkdown } from '../lib/utils/markdownParser.js';

describe('removeHtmlComments', () => {
  it('should remove HTML comments (Happy Path)', () => {
    const input = 'Hello <!-- comment -->World';
    expect(removeHtmlComments(input)).toEqual('Hello World');
  });

  it('should handle missing comments (Edge Case)', () => {
    expect(removeHtmlComments('Hello World')).toEqual('Hello World');
  });

  it('should remove multi-line HTML comments (Edge Case)', () => {
    const input = 'Hello <!-- multi\\nline\\ncomment -->World';
    expect(removeHtmlComments(input)).toEqual('Hello World');
  });
});

describe('removeEmptyRowsAndColumns', () => {
  it('should remove completely empty rows (Happy Path)', () => {
    const input = `| a | b |\n|   |   |\n| c | d |`;
    const expected = `|  a  |  b  |\n|  c  |  d  |`;
    expect(removeEmptyRowsAndColumns(input)).toEqual(expected);
  });

  it('should remove completely empty columns (Happy Path)', () => {
    const input = `| a |   | b |\n| c |   | d |`;
    const expected = `|  a  |  b  |\n|  c  |  d  |`;
    expect(removeEmptyRowsAndColumns(input)).toEqual(expected);
  });

  it('should return empty string if table is entirely empty (Edge Case)', () => {
    const input = `|   |   |\n|   |   |`;
    expect(removeEmptyRowsAndColumns(input)).toEqual('');
  });
});

describe('extractTablesFromMarkdown', () => {
  it('should extract and label multiple tables (Happy Path)', () => {
    const input = `Some text before\n| a | b |\n| c | d |\nSome text between\n| 1 | 2 |\n| 3 | 4 |`;
    const result = extractTablesFromMarkdown(input);
    expect(result).toContain('# Table 1');
    expect(result).toContain('| a | b |');
    expect(result).toContain('---');
    expect(result).toContain('# Table 2');
    expect(result).toContain('|  1  |  2  |');
  });

  it('should ignore non-table lines (Edge Case)', () => {
    const input = `Just text\nNo tables`;
    expect(extractTablesFromMarkdown(input)).toEqual('');
  });
});
