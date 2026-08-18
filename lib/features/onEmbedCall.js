import { extractTablesFromMarkdown, transposeMarkdownTables, extractStructuredTables, convertMarkdownToCSV } from "../utils/index.js";

/**
 * Handles communication from the embedded Graph Dashboard iframe.
 * @param {Object} app - The Amplenote plugin application context.
 * @param {string} actionName - The action requested by the embed.
 * @param {Object} payload - Optional parameters passed from the embed.
 * @returns {Promise<any>} Response sent back to window.callAmplenotePlugin promise.
 */
export async function handleEmbedCall(app, actionName, payload = {}) {
  try {
    switch (actionName) {
      case "saveState": {
        const stateStr = typeof payload === "string" ? payload : JSON.stringify(payload);
        if (typeof app.setSetting === "function") {
          await app.setSetting("Graph_Dashboard_State", stateStr);
        }
        return { success: true };
      }

      case "getState": {
        const raw = (app.settings || {})["Graph_Dashboard_State"];
        if (!raw) return null;
        try {
          return JSON.parse(raw);
        } catch {
          return null;
        }
      }

      case "refreshData": {
        const targetUUID = payload.noteUUID || (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
        if (!targetUUID) {
          return { success: false, error: "No active note UUID found." };
        }

        const note = await app.notes.find(targetUUID);
        if (!note) {
          return { success: false, error: "Note could not be found." };
        }

        const markdown = await app.getNoteContent({ uuid: targetUUID });
        if (!markdown) {
          return { success: false, error: "Note content is empty." };
        }

        const cleanedContent = extractTablesFromMarkdown(markdown, note.name);
        const transposeContent = transposeMarkdownTables(cleanedContent);
        const structuredTables = extractStructuredTables(markdown, note.name);

        return {
          success: true,
          noteUUID: targetUUID,
          noteName: note.name,
          noteTags: note.tags,
          cleanedContent,
          transposeContent,
          tables: structuredTables
        };
      }

      case "pickNote": {
        // Prompt user to search or enter a tag/note name
        const promptResult = await app.prompt("Switch Graph Note:", {
          inputs: [
            {
              label: "Search note title or tag (leave empty for recent):",
              type: "string",
              value: ""
            }
          ]
        });

        if (promptResult === null || promptResult === undefined) {
          return { success: false, cancelled: true };
        }

        const query = (Array.isArray(promptResult) ? promptResult[0] : promptResult) || "";
        let matchedNotes = [];
        
        if (query.trim()) {
          const byTag = await app.filterNotes({ tag: query.trim() });
          const byQuery = await app.filterNotes({ query: query.trim() });
          const seen = new Set();
          for (const n of [...byTag, ...byQuery]) {
            if (n && n.uuid && !seen.has(n.uuid)) {
              seen.add(n.uuid);
              matchedNotes.push(n);
            }
          }
        } else {
          matchedNotes = await app.filterNotes({ limit: 15 });
        }

        if (matchedNotes.length === 0) {
          await app.alert("No matching notes found.");
          return { success: false, error: "No notes found matching query." };
        }

        const selectOptions = matchedNotes.map(n => ({
          label: `${n.name || 'Untitled Note'} (${(n.tags || []).join(', ')})`,
          value: n.uuid
        }));

        const pickResult = await app.prompt("Select a Note to visualize:", {
          inputs: [
            {
              label: "Choose Note",
              type: "select",
              options: selectOptions,
              value: selectOptions[0].value
            }
          ]
        });

        if (!pickResult) return { success: false, cancelled: true };
        const selectedUUID = Array.isArray(pickResult) ? pickResult[0] : pickResult;

        if (typeof app.setSetting === "function") {
          await app.setSetting("Current_Note_UUID [Do not Edit!]", selectedUUID);
        }

        const note = await app.notes.find(selectedUUID);
        const markdown = await app.getNoteContent({ uuid: selectedUUID });
        const cleanedContent = extractTablesFromMarkdown(markdown, note ? note.name : "");
        const transposeContent = transposeMarkdownTables(cleanedContent);
        const structuredTables = extractStructuredTables(markdown, note ? note.name : "");

        return {
          success: true,
          noteUUID: selectedUUID,
          noteName: note ? note.name : "Untitled Note",
          noteTags: note ? note.tags : [],
          cleanedContent,
          transposeContent,
          tables: structuredTables
        };
      }

      case "openNote": {
        const targetUUID = payload.noteUUID || (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
        if (targetUUID) {
          await app.navigate(`https://www.amplenote.com/notes/${targetUUID}`);
          return { success: true };
        }
        return { success: false, error: "No note UUID provided." };
      }

      case "saveImageToNote": {
        const { noteUUID, dataUrl, rawTableMarkdown } = payload;
        if (!noteUUID || !dataUrl) {
          return { success: false, error: "Missing note UUID or image data." };
        }

        const noteContent = await app.getNoteContent({ uuid: noteUUID });
        if (!noteContent) {
          return { success: false, error: "Could not read note content." };
        }

        // Standard Amplenote image insertion markdown with vertical break spacing
        const imageMarkdown = `\n\\\n\n![](${dataUrl})\n\n\\\n\n`;

        // If the specific table markdown was matched in note, insert image directly above it
        if (rawTableMarkdown && noteContent.includes(rawTableMarkdown)) {
          const updatedContent = noteContent.replace(rawTableMarkdown, `${imageMarkdown}${rawTableMarkdown}`);
          await app.replaceNoteContent({ uuid: noteUUID }, updatedContent);
        } else {
          // Fallback: insert at top of note
          await app.insertNoteContent({ uuid: noteUUID }, imageMarkdown);
        }

        return {
          success: true,
          message: "Chart image saved directly above the table in your note!"
        };
      }

      case "downloadCSV": {
        const content = payload.content || "";
        const csv = convertMarkdownToCSV(content);
        return { success: true, csv };
      }

      default:
        console.warn(`[GraphUtility] Unknown embed action: ${actionName}`);
        return { success: false, error: `Unknown action: ${actionName}` };
    }
  } catch (error) {
    console.error(`[GraphUtility] Error in onEmbedCall (${actionName}):`, error);
    return { success: false, error: error.message };
  }
}
