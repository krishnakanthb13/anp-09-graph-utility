import { convertMarkdownToCSV } from '../lib/utils/csvConverter.js';

describe('convertMarkdownToCSV', () => {
  it('should convert markdown table to CSV (Happy Path)', () => {
    const input = `
# Table 1

| header 1 | header 2 |
|---|---|
| A | B |
| C | D |
`;
    const expected = `"header 1","header 2"\n"---","---"\n"A","B"\n"C","D"`;
    expect(convertMarkdownToCSV(input)).toEqual(expected);
  });

  it('should handle multiple tables separated by blank lines (Happy Path)', () => {
    const input = `| 1 | 2 |\n| 3 | 4 |\n\n| a | b |\n| c | d |`;
    const expected = `"1","2"\n"3","4"\n"a","b"\n"c","d"`;
    expect(convertMarkdownToCSV(input)).toEqual(expected);
  });

  it('should return empty string if no tables present (Edge Case)', () => {
    const input = `# Just a heading\nSome text\nNo pipes here`;
    expect(convertMarkdownToCSV(input)).toEqual('');
  });

  it('should handle cells with extra spaces and preserve internal spaces (Edge Case)', () => {
    const input = `|  spaced val  |  val 2 |`;
    const expected = `"spaced val","val 2"`;
    expect(convertMarkdownToCSV(input)).toEqual(expected);
  });
});
