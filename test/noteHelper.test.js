import { getNote } from '../lib/utils/noteHelper.js';

describe('getNote helper', () => {
  it('should return null for empty or null uuid', async () => {
    expect(await getNote({}, null)).toBeNull();
    expect(await getNote({}, '')).toBeNull();
    expect(await getNote(null, 'uuid')).toBeNull();
  });

  it('should use app.findNote if available', async () => {
    const mockApp = {
      findNote: async ({ uuid }) => ({ uuid, name: 'Primary Note' })
    };
    const res = await getNote(mockApp, 'test-uuid');
    expect(res).toEqual({ uuid: 'test-uuid', name: 'Primary Note' });
  });

  it('should fallback to app.notes.find if app.findNote is not available', async () => {
    const mockApp = {
      notes: {
        find: async (uuid) => ({ uuid, name: 'Fallback Note' })
      }
    };
    const res = await getNote(mockApp, 'test-uuid');
    expect(res).toEqual({ uuid: 'test-uuid', name: 'Fallback Note' });
  });

  it('should return null if neither find method is available', async () => {
    const mockApp = {};
    const res = await getNote(mockApp, 'test-uuid');
    expect(res).toBeNull();
  });
});
