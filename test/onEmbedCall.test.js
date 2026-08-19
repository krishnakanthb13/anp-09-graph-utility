import { jest } from '@jest/globals';
import { handleEmbedCall } from '../lib/features/onEmbedCall.js';

describe('handleEmbedCall', () => {
  let mockApp;

  beforeEach(() => {
    mockApp = {
      settings: {},
      setSetting: jest.fn(async (k, v) => { mockApp.settings[k] = v; }),
      getNoteContent: jest.fn(),
      replaceNoteContent: jest.fn(),
      insertNoteContent: jest.fn(),
      navigate: jest.fn(),
      notes: {
        find: jest.fn()
      },
      filterNotes: jest.fn(),
      prompt: jest.fn(),
      alert: jest.fn()
    };
  });

  it('should handle saveState and getState accurately with note isolation', async () => {
    const testStateA = { noteUUID: 'note-A', theme: 'forest', chartType: 'radar', selectedYIndices: [1, 2] };
    const testStateB = { noteUUID: 'note-B', theme: 'midnight', chartType: 'bar', selectedYIndices: [0] };

    await handleEmbedCall(mockApp, 'saveState', testStateA);
    await handleEmbedCall(mockApp, 'saveState', testStateB);

    const getResA = await handleEmbedCall(mockApp, 'getState', { noteUUID: 'note-A' });
    expect(getResA).toEqual(testStateA);

    const getResB = await handleEmbedCall(mockApp, 'getState', { noteUUID: 'note-B' });
    expect(getResB).toEqual(testStateB);
  });

  it('should handle refreshData by extracting updated tables and notes', async () => {
    mockApp.notes.find.mockResolvedValue({
      name: 'Metrics Note',
      tags: ['metrics']
    });
    mockApp.getNoteContent.mockResolvedValue(`| Month | Value |\n|---|---|\n| Jan | 50 |`);

    const res = await handleEmbedCall(mockApp, 'refreshData', { noteUUID: 'note-123' });
    expect(res.success).toBe(true);
    expect(res.noteName).toBe('Metrics Note');
    expect(res.tables).toHaveLength(1);
    expect(res.tables[0].headers).toEqual(['Month', 'Value']);
  });

  it('should handle openNote navigation', async () => {
    const res = await handleEmbedCall(mockApp, 'openNote', { noteUUID: 'note-xyz' });
    expect(res.success).toBe(true);
    expect(mockApp.navigate).toHaveBeenCalledWith('https://www.amplenote.com/notes/note-xyz');
  });

  it('should handle saveImageToNote with fresh note content check and attachMedia', async () => {
    const initialMarkdown = `# Header\n\n| Table 1 Col |\n|---|\n| T1 |\n\n# Second Section\n\n| Table 2 Col |\n|---|\n| T2 |`;
    mockApp.getNoteContent.mockResolvedValue(initialMarkdown);
    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart.png')
    });

    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 1
    });

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalled();
    const replacedContent = mockApp.replaceNoteContent.mock.calls[0][1];
    expect(replacedContent).toContain('![](https://images.amplenote.com/chart.png)');
    const table2Pos = replacedContent.indexOf('| Table 2 Col |');
    const imagePos = replacedContent.indexOf('https://images.amplenote.com/chart.png');
    expect(imagePos).toBeLessThan(table2Pos);
  });

  it('should locate target table by rawTableMarkdown identity when tables are shifted', async () => {
    const rawTargetTable = `| Target Col |\n|---|\n| Target Val |`;
    const initialMarkdown = `| Target Col |\n|---|\n| Target Val |`;
    // A new table was prepended before saving
    const modifiedFreshMarkdown = `| Prepended Table |\n|---|\n| New Val |\n\n${rawTargetTable}`;

    mockApp.getNoteContent
      .mockResolvedValueOnce(initialMarkdown)
      .mockResolvedValueOnce(modifiedFreshMarkdown);

    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart.png')
    });

    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 0, // stale index 0 would point to Prepended Table, but rawTableMarkdown points to Target Table
      rawTableMarkdown: rawTargetTable
    });

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalled();
    const replacedContent = mockApp.replaceNoteContent.mock.calls[0][1];
    
    // Image must be inserted directly above Target Table, NOT above Prepended Table
    const prependedPos = replacedContent.indexOf('| Prepended Table |');
    const imagePos = replacedContent.indexOf('https://images.amplenote.com/chart.png');
    const targetPos = replacedContent.indexOf('| Target Col |');
    expect(prependedPos).toBeLessThan(imagePos);
    expect(imagePos).toBeLessThan(targetPos);
  });

  it('should abort saveImageToNote safely if the note content changes concurrently and target table cannot be verified', async () => {
    const initialMarkdown = `| Table 1 Col |\n|---|\n| T1 |`;
    // First read returns initialMarkdown, second read after attachMedia returns completely changed content without tables
    mockApp.getNoteContent
      .mockResolvedValueOnce(initialMarkdown)
      .mockResolvedValueOnce(`Entirely new note text without any tables`);
    
    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart.png')
    });

    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 0
    });

    expect(res.success).toBe(false);
    expect(res.error).toContain('modified during save');
    expect(mockApp.replaceNoteContent).not.toHaveBeenCalled();
  });

  it('should abort saveImageToNote when note changes concurrently and raw table is no longer present, preventing write above wrong table', async () => {
    const initialMarkdown = `# Section 1\n\n| Table A |\n|---|\n| 1 |\n\n# Section 2\n\n| Table B |\n|---|\n| 2 |`;
    // Note changed concurrently: Table X was inserted at top and Table B was edited/removed
    const freshModifiedMarkdown = `# Section 0\n\n| Table X |\n|---|\n| 0 |\n\n# Section 1\n\n| Table A |\n|---|\n| 1 |`;
    
    mockApp.getNoteContent
      .mockResolvedValueOnce(initialMarkdown)
      .mockResolvedValueOnce(freshModifiedMarkdown);

    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart.png')
    });

    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 1, // Stale index points to Table A in fresh markdown, but raw table was Table B
      rawTableMarkdown: `| Table B |\n|---|\n| 2 |`
    });

    // Must abort and MUST NOT write above Table A
    expect(res.success).toBe(false);
    expect(res.error).toContain('modified during save');
    expect(mockApp.replaceNoteContent).not.toHaveBeenCalled();
  });

  it('should correctly disambiguate duplicate identical tables and insert image above the selected occurrence', async () => {
    const duplicateTableMarkdown = `| Item | Score |\n|---|---|\n| Alpha | 100 |`;
    const fullMarkdown = `# Q1 Results\n\n${duplicateTableMarkdown}\n\n# Q2 Results\n\n${duplicateTableMarkdown}`;

    mockApp.getNoteContent.mockResolvedValue(fullMarkdown);
    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart-q2.png')
    });

    // Target the second duplicate table (index 1)
    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 1,
      rawTableMarkdown: duplicateTableMarkdown
    });

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalled();
    const replaced = mockApp.replaceNoteContent.mock.calls[0][1];
    
    const firstTablePos = replaced.indexOf('# Q1 Results');
    const secondHeaderPos = replaced.indexOf('# Q2 Results');
    const imagePos = replaced.indexOf('https://images.amplenote.com/chart-q2.png');
    
    // Image must be placed after Q2 Results heading and before second table, NOT in Q1
    expect(imagePos).toBeGreaterThan(secondHeaderPos);
    expect(imagePos).toBeGreaterThan(firstTablePos);
  });

  it('should correctly insert image above the second identical table when preceded by non-duplicate tables (Table A, B, C, C at index 3)', async () => {
    const tableA = `| Table A |\n|---|\n| Val A |`;
    const tableB = `| Table B |\n|---|\n| Val B |`;
    const tableC = `| Table C Duplicate |\n|---|\n| Val C |`;
    const fullMarkdown = `# Section A\n\n${tableA}\n\n# Section B\n\n${tableB}\n\n# Section C1\n\n${tableC}\n\n# Section C2\n\n${tableC}`;

    mockApp.getNoteContent.mockResolvedValue(fullMarkdown);
    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart-c2.png')
    });

    // Table 0 = A, Table 1 = B, Table 2 = C1, Table 3 = C2 (selected: index 3)
    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 3,
      rawTableMarkdown: tableC
    });

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalled();
    const replaced = mockApp.replaceNoteContent.mock.calls[0][1];

    const posSecC1 = replaced.indexOf('# Section C1');
    const posSecC2 = replaced.indexOf('# Section C2');
    const posImg = replaced.indexOf('https://images.amplenote.com/chart-c2.png');

    // Image MUST be after Section C2 heading and BEFORE the second Table C, NOT above Section C1 or Table A/B
    expect(posImg).toBeGreaterThan(posSecC2);
    expect(posImg).toBeGreaterThan(posSecC1);
  });

  it('should abort saveImageToNote when note changes concurrently and multiple identical tables exist, even if stale index matches identical table (TOCTOU guard)', async () => {
    const tableA = `| Table A |\n|---|\n| Val A |`;
    const tableX = `| Table X |\n|---|\n| Val X |`;
    const tableC = `| Table C Duplicate |\n|---|\n| Val C |`;

    // Original: Table A (0), Table C (1), Table C (2)
    const initialMarkdown = `# Section A\n\n${tableA}\n\n# Section C1\n\n${tableC}\n\n# Section C2\n\n${tableC}`;
    
    // Concurrent edit: Table X was inserted at index 1 -> note is now Table A (0), Table X (1), Table C (2), Table C (3)
    const freshModifiedMarkdown = `# Section A\n\n${tableA}\n\n# Section X\n\n${tableX}\n\n# Section C1\n\n${tableC}\n\n# Section C2\n\n${tableC}`;

    mockApp.getNoteContent
      .mockResolvedValueOnce(initialMarkdown)
      .mockResolvedValueOnce(freshModifiedMarkdown);

    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/chart-c.png')
    });

    // User was targeting Table C at index 2 (the second C in initialMarkdown).
    // In freshModifiedMarkdown, index 2 is now the FIRST C!
    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      tableIndex: 2,
      rawTableMarkdown: tableC
    });

    // Because noteChanged is true and matchingTableIndices > 1, it MUST abort and NOT write above the wrong C!
    expect(res.success).toBe(false);
    expect(res.error).toContain('modified during save');
    expect(mockApp.replaceNoteContent).not.toHaveBeenCalled();
  });

  it('should handle downloadCSV', async () => {
    const markdown = `| Header 1 | Header 2 |\n| A | B |`;
    const res = await handleEmbedCall(mockApp, 'downloadCSV', { content: markdown });
    expect(res.success).toBe(true);
    expect(res.csv).toContain('"Header 1","Header 2"');
    expect(res.csv).toContain('"A","B"');
  });

  it('should handle copyTablesToNewNote by creating and populating new note', async () => {
    mockApp.createNote = jest.fn().mockResolvedValue('new-note-uuid-999');
    const res = await handleEmbedCall(mockApp, 'copyTablesToNewNote', {
      noteName: 'Source Note',
      markdownContent: '| Table 1 Col | Table 1 Val |\n|---|---|\n| A | 1 |'
    });
    expect(res.success).toBe(true);
    expect(mockApp.createNote).toHaveBeenCalledWith('Source Note — Extracted Tables', ['-reports/-tables-copy']);
    expect(mockApp.insertNoteContent).toHaveBeenCalledWith({ uuid: 'new-note-uuid-999' }, expect.stringContaining('| Table 1 Col |'));
    expect(mockApp.navigate).toHaveBeenCalledWith('https://www.amplenote.com/notes/new-note-uuid-999');
  });

  it('should handle insertFormulaTableToNote by creating a new note with tag -reports/-math-graph', async () => {
    mockApp.createNote = jest.fn().mockResolvedValue('new-math-note-1');
    mockApp.insertNoteContent = jest.fn().mockResolvedValue(true);
    mockApp.navigate = jest.fn().mockResolvedValue(true);

    const res = await handleEmbedCall(mockApp, 'insertFormulaTableToNote', {
      markdownTable: '| x | sin(x) |\n|---|---|\n| 0 | 0 |',
      heading: 'sin(x)',
      formulas: [{ name: 'f1(x) = sin(x)', expression: 'sin(x)' }],
      xMin: -10,
      xMax: 10,
      formulaPoints: 21
    });

    expect(res.success).toBe(true);
    expect(mockApp.createNote).toHaveBeenCalledWith('Math Graph — sin(x)', ['-reports/-math-graph']);
    expect(mockApp.insertNoteContent).toHaveBeenCalledWith(
      { uuid: 'new-math-note-1' },
      expect.stringContaining('# Math Graph — sin(x)')
    );
    expect(mockApp.insertNoteContent).toHaveBeenCalledWith(
      { uuid: 'new-math-note-1' },
      expect.stringContaining('| x | sin(x) |')
    );
    expect(mockApp.navigate).toHaveBeenCalledWith('https://www.amplenote.com/notes/new-math-note-1');
  });

  it('should handle saveFormulaImageToNote by creating a new note, attaching media, and inserting markdown', async () => {
    mockApp.createNote = jest.fn().mockResolvedValue('new-math-note-2');
    mockApp.notes.find.mockResolvedValue({
      attachMedia: jest.fn().mockResolvedValue('https://images.amplenote.com/formula_plot.png')
    });
    mockApp.insertNoteContent = jest.fn().mockResolvedValue(true);
    mockApp.navigate = jest.fn().mockResolvedValue(true);

    const res = await handleEmbedCall(mockApp, 'saveFormulaImageToNote', {
      dataUrl: 'data:image/png;base64,mockformula',
      formulaTitle: 'sin(x)',
      formulas: [{ name: 'f1(x) = sin(x)', expression: 'sin(x)' }],
      xMin: -10,
      xMax: 10,
      formulaPoints: 200
    });

    expect(res.success).toBe(true);
    expect(mockApp.createNote).toHaveBeenCalledWith('Math Graph — sin(x)', ['-reports/-math-graph']);
    expect(mockApp.insertNoteContent).toHaveBeenCalledWith(
      { uuid: 'new-math-note-2' },
      expect.stringContaining('https://images.amplenote.com/formula_plot.png')
    );
    expect(mockApp.insertNoteContent).toHaveBeenCalledWith(
      { uuid: 'new-math-note-2' },
      expect.stringContaining('# Math Graph — sin(x)')
    );
    expect(mockApp.navigate).toHaveBeenCalledWith('https://www.amplenote.com/notes/new-math-note-2');
  });
});

