import { extractTablesFromMarkdown, transposeMarkdownTables, extractStructuredTables } from "../utils/index.js";
import { buildChartHtml } from "../ui/htmlTemplate.js";

/**
 * Handles the renderEmbed plugin lifecycle method.
 * Reads the current note UUID from settings, extracts structured tables,
 * retrieves persisted state, and returns the interactive chart HTML for embedding.
 */
export async function handleRenderEmbed(app, ...args) {
  try {
    let noteUUID = await app.settings["Current_Note_UUID [Do not Edit!]"];
    
    // Check args or fallback
    if (!noteUUID && args && args.length > 0 && typeof args[0] === 'string') {
      noteUUID = args[0];
    }

    let rawSavedState = (app.settings || {})["Graph_Dashboard_State"];
    let savedState = null;
    if (rawSavedState) {
      try {
        savedState = typeof rawSavedState === 'string' ? JSON.parse(rawSavedState) : rawSavedState;
      } catch {
        savedState = null;
      }
    }

    // If still no note UUID, try to get last saved note UUID from state
    if (!noteUUID && savedState && savedState.lastActiveNoteUUID) {
      noteUUID = savedState.lastActiveNoteUUID;
    }

    // Context or recent note fallback
    if (!noteUUID && app.context && app.context.noteUUID) {
      noteUUID = app.context.noteUUID;
    }

    if (!noteUUID && app.filterNotes) {
      try {
        const recent = await app.filterNotes({ limit: 1 });
        if (recent && recent.length > 0 && recent[0].uuid) {
          noteUUID = recent[0].uuid;
        }
      } catch {}
    }

    let noteName = "Graph Utility Dashboard";
    let noteTags = [];
    let markdown = "";
    let cleanedContent = "";
    let transposeContent = "";
    let structuredTables = [];

    if (noteUUID) {
      const note = await app.notes.find(noteUUID);
      if (note) {
        noteName = note.name || "Untitled Note";
        noteTags = note.tags || [];
        markdown = (await app.getNoteContent({ uuid: noteUUID })) || "";
        cleanedContent = extractTablesFromMarkdown(markdown, noteName);
        transposeContent = transposeMarkdownTables(cleanedContent);
        structuredTables = extractStructuredTables(markdown, noteName);
      }
    }

    const htmlTemplate = buildChartHtml({
      cleanedContent,
      transposeContent,
      structuredTables,
      noteName,
      noteTags,
      noteUUID: noteUUID || "",
      savedState
    });

    return htmlTemplate;
  } catch (error) {
    console.error("Error in handleRenderEmbed:", error);
    return `<div style="padding: 20px; font-family: sans-serif; color: #d9534f;">
      <h2>Error rendering Graph Utility:</h2>
      <p>${error.message}</p>
    </div>`;
  }
}
