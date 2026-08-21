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
    expect(html).toContain('resetZoomBtn');
    expect(html).toContain('Use mouse wheel to zoom. Drag to pan.');
    expect(html).toContain('exportTablesGroup');
    expect(html).toContain('exportFormulasGroup');
    expect(html).toContain('downloadFormulaHtmlBtn');
    expect(html).toContain('downloadFormulaTableMDBtn');
    expect(html).toContain('downloadFormulaCSVBtn');
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

  it('should accurately match and replace payload in interactive HTML export regex', () => {
    const originalHtml = buildChartHtml({
      cleanedContent: '| Category | Amount |\n|---|---|\n| Sales | 500 |',
      noteName: 'Revenue & Profit <2026>',
      noteUUID: 'rev-uuid-1'
    });

    // Verify initial payload contains raw noteName without double HTML encoding
    const initialPayloadMatch = originalHtml.match(/<script type="application\/json" id="plugin-payload">([\s\S]*?)<\/script>/);
    expect(initialPayloadMatch).toBeTruthy();
    const initialPayload = JSON.parse(initialPayloadMatch[1]);
    expect(initialPayload.noteName).toBe('Revenue & Profit <2026>');

    // Emulate client-side interactive HTML export payload replacement
    const payloadRegex = /(<script type="application\/json" id="plugin-payload">)[\s\S]*?(<\/script>)/;
    expect(payloadRegex.test(originalHtml)).toBe(true);

    const updatedPayload = {
      ...initialPayload,
      noteName: 'Updated Custom Dashboard'
    };
    const updatedJson = JSON.stringify(updatedPayload).replace(/</g, '\\u003c');
    const replacedHtml = originalHtml.replace(
      payloadRegex,
      `$1\n    ${updatedJson}\n  $2`
    );

    const updatedPayloadMatch = replacedHtml.match(/<script type="application\/json" id="plugin-payload">([\s\S]*?)<\/script>/);
    expect(updatedPayloadMatch).toBeTruthy();
    const parsedUpdated = JSON.parse(updatedPayloadMatch[1]);
    expect(parsedUpdated.noteName).toBe('Updated Custom Dashboard');
  });

  it('should include mobile backdrop element and narrow screen resolution handling', () => {
    const html = buildChartHtml({
      cleanedContent: '| Header 1 | Header 2 |\n|---|---|\n| A | 10 |',
      noteName: 'Responsive Test Note',
      noteUUID: 'resp-uuid-1'
    });

    expect(html).toContain('id="panelBackdrop"');
    expect(html).toContain('class="panel-backdrop"');
    expect(html).toContain('isNarrowScreen');
    expect(html).toContain('series-checkbox');
    expect(html).toContain('max-width: 900px');
  });

  it('should include graph viewport fit toggle controls for standard and stretched sizing', () => {
    const html = buildChartHtml({
      cleanedContent: '| Category | Amount |\n|---|---|\n| Sales | 500 |',
      noteName: 'Fit Test Note',
      noteUUID: 'fit-uuid-1'
    });

    expect(html).toContain('id="toggleGraphFitBtn"');
    expect(html).toContain('id="stretchGraphToggle"');
    expect(html).toContain('id="graphFitLabel"');
    expect(html).toContain('is-standard');
    expect(html).toContain('is-stretched');
    expect(html).toContain('graphFit');
    expect(html).toContain('toggleGraphFit');
  });

  it('should include collapsible Display Options section with accordion controls', () => {
    const html = buildChartHtml({
      cleanedContent: '| Category | Amount |\n|---|---|\n| Sales | 500 |',
      noteName: 'Collapse Test Note',
      noteUUID: 'collapse-uuid-1'
    });

    expect(html).toContain('id="displayOptionsSection"');
    expect(html).toContain('id="toggleDisplayOptionsBtn"');
    expect(html).toContain('id="displayOptionsContent"');
    expect(html).toContain('collapsible-section');
    expect(html).toContain('collapsible-header');
    expect(html).toContain('updateDisplayOptionsCollapseUI');
    expect(html).toContain('displayOptionsCollapsed');
  });

  it('should support individual Y-Axis series custom color pickers and persistence', () => {
    const html = buildChartHtml({
      cleanedContent: '| Month | Revenue | Expenses |\n|---|---|---|\n| Jan | 1000 | 600 |',
      noteName: 'Color Picker Test Note',
      noteUUID: 'color-uuid-1'
    });

    expect(html).toContain('series-color-picker-wrapper');
    expect(html).toContain('series-color-input');
    expect(html).toContain('customSeriesColors');
    expect(html).toContain('dataset.colIdx');
  });

  it('should render mathematical function curves with matching box color pickers and clickable labels', () => {
    const html = buildChartHtml({
      cleanedContent: '',
      noteName: 'Formula UI Test Note',
      noteUUID: 'formula-uuid-1'
    });

    expect(html).toContain('formula-label');
    expect(html).toContain('formula-active-toggle');
    expect(html).toContain('formula-color-input');
    expect(html).toContain('formula_cb_');
  });

  it('should include Move Up and Move Down reordering controls for series and formulas', () => {
    const html = buildChartHtml({
      cleanedContent: '| A | B | C |\n|---|---|---|\n| 1 | 2 | 3 |',
      noteName: 'Reorder Test Note',
      noteUUID: 'reorder-uuid-1'
    });

    expect(html).toContain('move-series-up-btn');
    expect(html).toContain('move-series-down-btn');
    expect(html).toContain('move-formula-up-btn');
    expect(html).toContain('move-formula-down-btn');
    expect(html).toContain('seriesOrder');
    expect(html).toContain('series-item-actions');
    expect(html).toContain('reorder-btn');
  });
});

