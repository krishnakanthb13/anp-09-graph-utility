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
});
