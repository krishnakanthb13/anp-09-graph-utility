import { removeHtmlComments, removeEmptyRowsAndColumns, splitTableRow, extractTablesFromMarkdown, extractStructuredTables } from '../lib/utils/markdownParser.js';

describe('removeHtmlComments', () => {
  it('should remove HTML comments (Happy Path)', () => {
    const input = 'Hello <!-- comment -->World';
    expect(removeHtmlComments(input)).toEqual('Hello World');
  });

  it('should handle missing comments (Edge Case)', () => {
    expect(removeHtmlComments('Hello World')).toEqual('Hello World');
  });

  it('should remove multi-line HTML comments (Edge Case)', () => {
    const input = 'Hello <!-- multi\nline\ncomment -->World';
    expect(removeHtmlComments(input)).toEqual('Hello World');
  });
});

describe('splitTableRow', () => {
  it('should split normal table row', () => {
    const input = '| Col A | Col B | Col C |';
    expect(splitTableRow(input)).toEqual(['Col A', 'Col B', 'Col C']);
  });

  it('should safely preserve escaped pipes within cells', () => {
    const input = '| Product | Type A \\| Type B | Price |';
    expect(splitTableRow(input)).toEqual(['Product', 'Type A | Type B', 'Price']);
  });
});

describe('removeEmptyRowsAndColumns', () => {
  it('should remove completely empty rows (Happy Path)', () => {
    const input = `| a | b |\n|   |   |\n| c | d |`;
    const expected = `| a | b |\n| c | d |`;
    expect(removeEmptyRowsAndColumns(input)).toEqual(expected);
  });

  it('should preserve deliberate empty columns while cleaning rows', () => {
    const input = `| a |   | b |\n| c |   | d |`;
    const expected = `| a |  | b |\n| c |  | d |`;
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
    expect(result).toContain('| 1 | 2 |');
  });

  it('should ignore non-table lines (Edge Case)', () => {
    const input = `Just text\nNo tables`;
    expect(extractTablesFromMarkdown(input)).toEqual('');
  });

  it('should include heading in table labels when present (Feature)', () => {
    const input = `# Revenue Section\n| Month | Total |\n| Jan | 100 |`;
    const result = extractTablesFromMarkdown(input, 'My Notes');
    expect(result).toContain('# My Notes > Revenue Section > Table 1');
  });
});

describe('extractStructuredTables', () => {
  it('should parse table headers, rows and headings accurately', () => {
    const input = `# Sales 2026\n| Month | Target | Actual |\n|---|---|---|\n| Jan | 100 | 120 |\n| Feb | 110 | 115 |`;
    const tables = extractStructuredTables(input, 'Financial Note');
    expect(tables).toHaveLength(1);
    expect(tables[0].heading).toEqual('Sales 2026');
    expect(tables[0].noteName).toEqual('Financial Note');
    expect(tables[0].displayName).toContain('Financial Note > Sales 2026 > Table 1 (3 cols × 2 rows)');
    expect(tables[0].headers).toEqual(['Month', 'Target', 'Actual']);
    expect(tables[0].dataRows).toEqual([
      ['Jan', '100', '120'],
      ['Feb', '110', '115']
    ]);
  });

  it('should correctly handle Amplenote placeholder dash headers and promote valid rows', () => {
    const input = `| - | - | - |\n|---|---|---|\n| Product | Q1 | Q2 |\n| Widget | 50 | 75 |`;
    const tables = extractStructuredTables(input, 'Store Note');
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Product', 'Q1', 'Q2']);
    expect(tables[0].dataRows).toEqual([['Widget', '50', '75']]);
  });

  it('should auto-name empty or dash headers as Column N', () => {
    const input = `| - | Price |\n|---|---|\n| Apple | 1.50 |\n| Banana | 0.99 |`;
    const tables = extractStructuredTables(input, 'Fruit Note');
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Column 1', 'Price']);
  });

  it('should correctly parse rows with escaped pipes', () => {
    const input = `| Category | Features |\n|---|---|\n| Plan A | Option 1 \\| Option 2 |`;
    const tables = extractStructuredTables(input, 'Plans');
    expect(tables).toHaveLength(1);
    expect(tables[0].dataRows[0]).toEqual(['Plan A', 'Option 1 | Option 2']);
  });

  it('should ignore tables inside fenced code blocks', () => {
    const input = `# Guide
Here is some code:
\`\`\`markdown
| Ignored Col | Ignored Val |
|---|---|
| X | 10 |
\`\`\`
And here is a real table:
| Real Col | Real Val |
|---|---|
| Y | 20 |`;
    const tables = extractStructuredTables(input, 'Guide');
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Real Col', 'Real Val']);
    expect(tables[0].dataRows).toEqual([['Y', '20']]);
  });

  it('should correctly parse Amplenote tables with placeholder headers and promote next row to headers', () => {
    const input = `| - | - |\n|---|---|\n| Item A | 10 |\n| Item B | 20 |`;
    const tables = extractStructuredTables(input, 'Store Note');
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Item A', '10']);
    expect(tables[0].dataRows).toEqual([['Item B', '20']]);
  });

  it('should not treat regular text paragraphs with pipe characters as tables', () => {
    const input = `# My Report
> **Domain**: [-10, 10] | **Samples**: 21 points

Some notes | info in regular text.

| Month | Target |
|---|---|
| Jan | 100 |`;
    const tables = extractStructuredTables(input, 'Report');
    expect(tables).toHaveLength(1);
    expect(tables[0].headers).toEqual(['Month', 'Target']);
    expect(tables[0].dataRows).toEqual([['Jan', '100']]);
  });
});
