/**
 * Handles the "Viewer!" noteOption.
 * Sets the current note UUID in settings and inserts an embed object tag.
 */
export async function handleViewer(app, noteUUID) {
  try {
    await app.setSetting("Current_Note_UUID [Do not Edit!]", noteUUID);
    await app.insertNoteContent({ uuid: noteUUID }, `<object data="plugin://${app.context.pluginUUID}" data-aspect-ratio="2" />`);
  } catch (error) {
    console.error("Error in handleViewer:", error);
    app.alert(`An error occurred in Viewer: ${error.message}`);
  }
  return null;
}
