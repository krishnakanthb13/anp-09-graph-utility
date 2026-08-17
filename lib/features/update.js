/**
 * Handles the "Update!" noteOption.
 * Sets the current note UUID in settings and alerts the user.
 */
export async function handleUpdate(app, noteUUID) {
  try {
    await app.setSetting("Current_Note_UUID [Do not Edit!]", noteUUID);
    app.alert("Current Note is updated for your Graph Utlity Viewer!");
  } catch (error) {
    console.error("Error in handleUpdate:", error);
    app.alert(`An error occurred while updating settings: ${error.message}`);
  }
  return null;
}
