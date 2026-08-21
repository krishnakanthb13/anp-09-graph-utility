/**
 * Safely retrieves a note object from the Amplenote app context.
 * Supports both app.findNote and app.notes.find fallback patterns.
 * @param {Object} app - Amplenote app context
 * @param {string} uuid - Note UUID
 * @returns {Promise<Object|null>} Note object or null
 */
export async function getNote(app, uuid) {
  if (!app || !uuid) return null;
  if (typeof app.findNote === "function") {
    return await app.findNote({ uuid });
  }
  if (app.notes && typeof app.notes.find === "function") {
    return await app.notes.find(uuid);
  }
  return null;
}
