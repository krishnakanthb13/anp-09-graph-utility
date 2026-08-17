import { extractTablesFromMarkdown, transposeMarkdownTables, convertMarkdownToCSV, getCurrentDateTime } from "../utils/index.js";
import { downloadTextFile } from "../ui/downloadHelper.js";
import { buildChartHtml } from "../ui/htmlTemplate.js";

/**
 * Handles the "Download!" noteOption.
 * Prompts the user for export format, then downloads/copies tables accordingly.
 */
export async function handleDownload(app, noteUUID) {
  try {
    // Prompt the user to select tags and choose options
    const result = await app.prompt(
      "Select any one of the Option Below!",
      {
        inputs: [
          {
            label: "Select the format that you want to download / copy in!",
            type: "radio",
            options: [
              { label: "Download - Interactive Charts (Recommended)", value: "1" },
              { label: "Download all Tables - MD", value: "2" },
              { label: "Download all Tables - CSV", value: "4" },
              { label: "Copy all Tables from this Note to a new Note", value: "3" }
            ]
          }
        ]
      }
    );

    if (!result) return;

    const markdown = await app.getNoteContent({ uuid: noteUUID });

    // Extract and process tables
    const cleanedContent = extractTablesFromMarkdown(markdown);
    const transposeContent = transposeMarkdownTables(cleanedContent);

    const note = await app.notes.find(noteUUID);

    const fullNoteContent = `
Note Name: ${note.name}
Note Tags: ${note.tags}
Note UUID: ${noteUUID}

---

${cleanedContent}

---

${transposeContent}

`;

    const { YYMMDD, HHMMSS } = getCurrentDateTime();

    // Determine the format and trigger the appropriate download
    switch (result) {
      case "1": {
        const htmlTemplate = buildChartHtml({
          cleanedContent,
          transposeContent,
          noteName: note.name,
          noteTags: note.tags,
          noteUUID
        });
        downloadTextFile(htmlTemplate, "InteractiveCharts.html", YYMMDD, HHMMSS, noteUUID);
        break;
      }
      case "2": {
        downloadTextFile(fullNoteContent, "Markdown_Tables.md", YYMMDD, HHMMSS, noteUUID);
        break;
      }
      case "3": {
        const newNoteName = `Tables Copy ${YYMMDD}_${HHMMSS}`;
        const newTagName = ['-reports/-tables-copy'];
        const newNoteUUID = await app.createNote(newNoteName, newTagName);
        await app.replaceNoteContent({ uuid: newNoteUUID }, fullNoteContent);
        await app.navigate(`https://www.amplenote.com/notes/${newNoteUUID}`);
        break;
      }
      case "4": {
        const csvContent = convertMarkdownToCSV(fullNoteContent);
        downloadTextFile(csvContent, "Markdown_Tables.csv", YYMMDD, HHMMSS, noteUUID);
        break;
      }
    }
  } catch (error) {
    console.error("Error in handleDownload:", error);
    app.alert(`An error occurred: ${error.message}`);
  }
}
