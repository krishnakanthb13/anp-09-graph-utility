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
    expect(html).toContain('data:image/png;base64');
    expect(html).toContain('rel="shortcut icon"');
    expect(html).toContain('rel="apple-touch-icon"');
    expect(html).toContain('note-uuid-1234');
    expect(html).toContain('Quarterly Report');
    expect(html).toContain('themeToggleBtn');
    expect(html).toContain('mainChart');
    expect(html).toContain('saveImageToNoteBtn');
    expect(html).toContain('selectAllSeriesBtn');
    expect(html).toContain('amplenote_graph_utility_state');
    expect(html).toContain('theme-dracula');
    expect(html).toContain('theme-nord');
    expect(html).toContain('theme-tokyo-night');
    expect(html).toContain('theme-solarized-light');
    expect(html).toContain('theme-monokai');
    expect(html).toContain('oceanic');
    expect(html).toContain('aurora');
    expect(html).toContain('autumn');
    expect(html).toContain('vintage');
    expect(html).toContain('candy');
  });

  it('should have 100% syntactically valid JavaScript inside all script tags without breakout', () => {
    const html = buildChartHtml({
      cleanedContent: '| Header 1 | Header 2 |\n|---|---|\n| A | 10 |',
      transposeContent: '| Header 1 | A |\n| Header 2 | 10 |',
      noteName: 'Validation Note',
      noteUUID: 'note-val-1'
    });

    const scriptMatches = [...html.matchAll(/<script(?![^>]*type="application\/json")>([\s\S]*?)<\/script>/gi)];
    expect(scriptMatches.length).toBeGreaterThanOrEqual(2);

    scriptMatches.forEach((match, idx) => {
      const scriptBody = match[1];
      expect(() => {
        new Function(scriptBody);
      }).not.toThrow();
    });
  });
});

