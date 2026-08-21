import { handleRenderEmbed } from '../lib/features/renderEmbed.js';

describe('handleRenderEmbed', () => {
  it('should render chart HTML when note UUID is found in settings', async () => {
    const mockApp = {
      settings: {
        "Current_Note_UUID [Do not Edit!]": "uuid-123"
      },
      findNote: async ({ uuid }) => ({
        uuid,
        name: "Sales Q1",
        tags: ["sales", "2026"]
      }),
      getNoteContent: async ({ uuid }) => "# Sales\n\n| Month | Revenue |\n|---|---|\n| Jan | 100 |\n| Feb | 150 |"
    };

    const html = await handleRenderEmbed(mockApp);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('uuid-123');
    expect(html).toContain('Sales Q1');
    expect(html).toContain('#sales');
  });

  it('should gracefully handle missing or undefined app.settings without throwing (BUG-01)', async () => {
    const mockApp = {
      settings: null,
      context: { noteUUID: "uuid-from-context" },
      findNote: async ({ uuid }) => ({ uuid, name: "Context Note", tags: [] }),
      getNoteContent: async () => "| Item | Qty |\n|---|---|\n| A | 5 |"
    };

    const html = await handleRenderEmbed(mockApp);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('uuid-from-context');
  });

  it('should escape error message in HTML error fallback (AN-05)', async () => {
    const mockApp = {
      get settings() {
        throw new Error('<script>alert("xss")</script>');
      }
    };

    const html = await handleRenderEmbed(mockApp);
    expect(html).toContain('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    expect(html).not.toContain('<script>alert("xss")</script>');
  });

  it('should resolve noteUUID from args if not in settings', async () => {
    const mockApp = {
      settings: {},
      findNote: async ({ uuid }) => ({ uuid, name: "Arg Note", tags: [] }),
      getNoteContent: async () => "| A | B |\n|---|---|\n| 1 | 2 |"
    };

    const html = await handleRenderEmbed(mockApp, "uuid-arg-999");
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('uuid-arg-999');
    expect(html).toContain('Arg Note');
  });
});
