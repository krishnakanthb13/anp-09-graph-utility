import { extractTablesFromMarkdown, transposeMarkdownTables, extractStructuredTables, getNote } from "../utils/index.js";
import { buildChartHtml, escapeHTML } from "../ui/htmlTemplate.js";

/**
 * Handles the renderEmbed plugin lifecycle method.
 * Reads the current note UUID from settings, extracts structured tables,
 * retrieves persisted state, and returns the interactive chart HTML for embedding.
 */
export async function handleRenderEmbed(app, ...args) {
  try {
    let noteUUID = (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
    
    // Check args or fallback
    if (!noteUUID && args && args.length > 0 && typeof args[0] === 'string') {
      noteUUID = args[0];
    }

    let rawSavedState = (app.settings || {})["Graph_Dashboard_State"];
    let savedState = null;
    if (rawSavedState) {
      try {
        const parsed = typeof rawSavedState === 'string' ? JSON.parse(rawSavedState) : rawSavedState;
        if (parsed && parsed.notes && noteUUID && parsed.notes[noteUUID]) {
          savedState = parsed.notes[noteUUID];
        } else if (parsed && parsed.notes && parsed.activeNoteUUID && parsed.notes[parsed.activeNoteUUID]) {
          savedState = parsed.notes[parsed.activeNoteUUID];
        } else {
          savedState = parsed;
        }
      } catch {
        savedState = null;
      }
    }

    // If still no note UUID, try to get last saved note UUID from state
    if (!noteUUID && savedState && savedState.noteUUID) {
      noteUUID = savedState.noteUUID;
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
      const note = await getNote(app, noteUUID);
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
    const safeErrorMsg = escapeHTML(error && error.message ? error.message : String(error));
    return `<div style="padding: 20px; font-family: sans-serif; color: #d9534f;">
      <h2>Error rendering Graph Utility:</h2>
      <p>${safeErrorMsg}</p>
    </div>`;
  }
}
