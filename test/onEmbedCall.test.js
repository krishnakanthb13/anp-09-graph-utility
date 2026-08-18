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

  it('should handle saveState and getState accurately', async () => {
    const testState = { theme: 'forest', chartType: 'radar', selectedYIndices: [1, 2] };
    const saveRes = await handleEmbedCall(mockApp, 'saveState', testState);
    expect(saveRes).toEqual({ success: true });
    expect(mockApp.setSetting).toHaveBeenCalledWith('Graph_Dashboard_State', JSON.stringify(testState));

    const getRes = await handleEmbedCall(mockApp, 'getState');
    expect(getRes).toEqual(testState);
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

  it('should handle saveImageToNote with exact table replacement', async () => {
    const initialMarkdown = `# Header\n\n| Col1 | Col2 |\n|---|---|\n| A | B |\n\nFooter text`;
    mockApp.getNoteContent.mockResolvedValue(initialMarkdown);

    const res = await handleEmbedCall(mockApp, 'saveImageToNote', {
      noteUUID: 'note-abc',
      dataUrl: 'data:image/png;base64,mockpngdata',
      rawTableMarkdown: '| Col1 | Col2 |\n|---|---|\n| A | B |'
    });

    expect(res.success).toBe(true);
    expect(mockApp.replaceNoteContent).toHaveBeenCalled();
    const replacedContent = mockApp.replaceNoteContent.mock.calls[0][1];
    expect(replacedContent).toContain('![](data:image/png;base64,mockpngdata)');
    expect(replacedContent).toContain('| Col1 | Col2 |');
  });

  it('should handle downloadCSV', async () => {
    const markdown = `| Header 1 | Header 2 |\n| A | B |`;
    const res = await handleEmbedCall(mockApp, 'downloadCSV', { content: markdown });
    expect(res.success).toBe(true);
    expect(res.csv).toContain('"Header 1","Header 2"');
    expect(res.csv).toContain('"A","B"');
  });
});
