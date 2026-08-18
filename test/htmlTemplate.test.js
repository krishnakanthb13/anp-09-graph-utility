import { buildChartHtml } from '../lib/ui/htmlTemplate.js';

describe('buildChartHtml', () => {
  it('should generate valid HTML document with embedded favicon and theme attributes', () => {
    const html = buildChartHtml({
      cleanedContent: '| Header 1 | Header 2 |\n|---|---|\n| A | 10 |',
      transposeContent: '',
      structuredTables: [
        {
          id: 'table-1',
          displayName: 'Test Note > Section > Table 1',
          headers: ['Header 1', 'Header 2'],
          dataRows: [['A', '10']],
          columnCount: 2,
          rowCount: 1
        }
      ],
      noteName: 'Quarterly Report',
      noteTags: ['finance', '2026'],
      noteUUID: 'note-uuid-1234'
    });

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Quarterly Report — Graph Utility');
    expect(html).toContain('data:image/svg+xml');
    expect(html).toContain('note-uuid-1234');
    expect(html).toContain('Quarterly Report');
    expect(html).toContain('#finance');
    expect(html).toContain('themeToggleBtn');
    expect(html).toContain('mainChart');
    expect(html).toContain('saveImageToNoteBtn');
    expect(html).toContain('selectAllSeriesBtn');
    expect(html).toContain('amplenote_graph_utility_state');
  });

  it('should have 100% syntactically valid JavaScript inside script tags', () => {
    const html = buildChartHtml({
      cleanedContent: '| Header 1 | Header 2 |\n|---|---|\n| A | 10 |',
      transposeContent: '| Header 1 | A |\n| Header 2 | 10 |',
      noteName: 'Validation Note',
      noteUUID: 'note-val-1'
    });

    const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
    expect(scriptMatch).not.toBeNull();
    const scriptBody = scriptMatch[1];
    
    // Evaluating new Function(scriptBody) will throw SyntaxError if any token is invalid
    expect(() => {
      new Function(scriptBody);
    }).not.toThrow();
  });
});

