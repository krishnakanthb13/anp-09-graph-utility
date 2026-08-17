import { extractTablesFromMarkdown, transposeMarkdownTables } from "../utils/index.js";
import { buildChartHtml } from "../ui/htmlTemplate.js";

/**
 * Handles the renderEmbed plugin lifecycle method.
 * Reads the current note UUID from settings, extracts tables,
 * and returns the interactive chart HTML for embedding.
 */
export async function handleRenderEmbed(app, ...args) {
  try {
    const noteUUID = await app.settings["Current_Note_UUID [Do not Edit!]"];
    
    if (!noteUUID) {
      return "<h1>Please set a note UUID in settings using the 'Update!' option first.</h1>";
    }

    const markdown = await app.getNoteContent({ uuid: noteUUID });
    if (!markdown) {
       return "<h1>Note content is empty or note could not be found.</h1>";
    }

    // Extract and process tables
    const cleanedContent = extractTablesFromMarkdown(markdown);
    const transposeContent = transposeMarkdownTables(cleanedContent);

    const note = await app.notes.find(noteUUID);
    if (!note) {
      return "<h1>Could not find the target note.</h1>";
    }

    const htmlTemplate = buildChartHtml({
      cleanedContent,
      transposeContent,
      noteName: note.name,
      noteTags: note.tags,
      noteUUID
    });

    return htmlTemplate;
  } catch (error) {
    console.error("Error in handleRenderEmbed:", error);
    return `<h1>Error rendering embed: ${error.message}</h1>`;
  }
}
