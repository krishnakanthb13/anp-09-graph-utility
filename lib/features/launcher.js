/**
 * Handles launching the Graph Utility Dashboard in either Fullscreen or Peek Viewer mode.
 * @param {Object} app - The Amplenote plugin application context.
 * @param {string} [noteUUID] - Optional UUID of the note to visualize.
 */
export async function launchGraphDashboard(app, noteUUID) {
  try {
    if (noteUUID) {
      await app.setSetting("Current_Note_UUID [Do not Edit!]", noteUUID);
    }

    let lastChoice = (app.settings || {})["Last Embed View"];
    const choiceResult = await app.prompt("Choose Graph Dashboard Launch Target:", {
      inputs: [
        {
          label: "Launch Target",
          type: "select",
          options: [
            { label: "Fullscreen Tab (Dedicated Workspace)", value: "fullscreen" },
            { label: "Peek Viewer (Sidebar)", value: "sidebar" }
          ],
          value: lastChoice || "fullscreen"
        }
      ]
    });

    if (!choiceResult) return;
    const target = Array.isArray(choiceResult) ? choiceResult[0] : choiceResult;
    
    if (typeof app.setSetting === 'function') {
      await app.setSetting("Last Embed View", target);
    }

    if (target === "fullscreen") {
      await app.openEmbed();
      if (app.context && app.context.pluginUUID) {
        try {
          await app.navigate("https://www.amplenote.com/notes/plugins/" + app.context.pluginUUID);
        } catch (navErr) {
          console.warn("[GraphUtility] Optional navigation warning:", navErr);
        }
      }
    } else {
      await app.openSidebarEmbed(1);
    }
  } catch (error) {
    console.error("Error in launchGraphDashboard:", error);
    app.alert(`An error occurred while opening dashboard: ${error.message}`);
  }
}
