import { launchGraphDashboard } from '../lib/features/launcher.js';

describe('launchGraphDashboard', () => {
  it('should save noteUUID and open fullscreen embed when selected', async () => {
    const settings = {};
    let embedOpened = false;
    let sidebarOpened = false;

    const mockApp = {
      settings,
      setSetting: async (key, val) => {
        settings[key] = val;
      },
      prompt: async () => ["fullscreen"],
      openEmbed: async () => {
        embedOpened = true;
      },
      openSidebarEmbed: async () => {
        sidebarOpened = true;
      },
      context: { pluginUUID: "test-plugin-uuid" },
      navigate: async () => {}
    };

    await launchGraphDashboard(mockApp, "note-uuid-1");
    expect(settings["Current_Note_UUID [Do not Edit!]"]).toBe("note-uuid-1");
    expect(settings["Last Embed View"]).toBe("fullscreen");
    expect(embedOpened).toBe(true);
    expect(sidebarOpened).toBe(false);
  });

  it('should open sidebar embed when sidebar selected', async () => {
    const settings = {};
    let sidebarParam = null;

    const mockApp = {
      settings,
      setSetting: async (key, val) => {
        settings[key] = val;
      },
      prompt: async () => ["sidebar"],
      openSidebarEmbed: async (p) => {
        sidebarParam = p;
      }
    };

    await launchGraphDashboard(mockApp);
    expect(sidebarParam).toBe(1);
    expect(settings["Last Embed View"]).toBe("sidebar");
  });

  it('should gracefully exit when prompt is cancelled', async () => {
    let opened = false;
    const mockApp = {
      settings: {},
      prompt: async () => null,
      openEmbed: async () => { opened = true; }
    };

    await launchGraphDashboard(mockApp);
    expect(opened).toBe(false);
  });

  it('should alert on error', async () => {
    let alertMsg = '';
    const mockApp = {
      settings: {},
      prompt: async () => { throw new Error('Prompt failed'); },
      alert: (msg) => { alertMsg = msg; }
    };

    await launchGraphDashboard(mockApp);
    expect(alertMsg).toContain('Prompt failed');
  });
});
