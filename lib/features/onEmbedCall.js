import { extractTablesFromMarkdown, transposeMarkdownTables, extractStructuredTables, convertMarkdownToCSV } from "../utils/index.js";

async function getNote(app, uuid) {
  if (!uuid) return null;
  if (typeof app.findNote === "function") {
    return await app.findNote({ uuid });
  }
  if (app.notes && typeof app.notes.find === "function") {
    return await app.notes.find(uuid);
  }
  return null;
}

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

        const note = await getNote(app, targetUUID);
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

        const note = await getNote(app, selectedUUID);
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
        const { noteUUID, dataUrl, tableIndex = 0, rawTableMarkdown } = payload;
        const targetUUID = noteUUID || (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
        if (!targetUUID || !dataUrl) {
          return { success: false, error: "Missing note UUID or image data." };
        }

        const note = await getNote(app, targetUUID);
        const noteContent = await app.getNoteContent({ uuid: targetUUID });
        if (typeof noteContent !== "string") {
          return { success: false, error: "Could not read note content." };
        }

        // 1. Attach media to get a clean, permanent Amplenote CDN image URL (avoids massive base64 in note markdown)
        let imageSrc = dataUrl;
        if (note && typeof note.attachMedia === "function") {
          try {
            imageSrc = await note.attachMedia(dataUrl);
          } catch (attachErr) {
            console.warn("[GraphUtility] note.attachMedia fallback:", attachErr);
          }
        } else if (typeof app.attachNoteMedia === "function") {
          try {
            imageSrc = await app.attachNoteMedia({ uuid: targetUUID }, dataUrl);
          } catch (attachErr) {
            console.warn("[GraphUtility] app.attachNoteMedia fallback:", attachErr);
          }
        }

        const imageBlock = `\n\\\n\n![](${imageSrc})\n\n\\\n\n`;

        // 2. Accurately find the line where Table N begins in note markdown
        const lines = noteContent.split('\n');
        let currentTblIdx = -1;
        let inTable = false;
        let targetLine = -1;

        for (let i = 0; i < lines.length; i++) {
          const trimmed = lines[i].trim();
          if (trimmed.startsWith('|')) {
            if (!inTable) {
              currentTblIdx++;
              inTable = true;
              if (currentTblIdx === tableIndex) {
                targetLine = i;
                break;
              }
            }
          } else {
            inTable = false;
          }
        }

        let updatedContent = "";
        if (targetLine !== -1) {
          // Splice image directly above the first line of the target table
          const newLines = [
            ...lines.slice(0, targetLine),
            imageBlock.trim(),
            ...lines.slice(targetLine)
          ];
          updatedContent = newLines.join('\n');
        } else if (rawTableMarkdown && noteContent.includes(rawTableMarkdown)) {
          updatedContent = noteContent.replace(rawTableMarkdown, `${imageBlock}${rawTableMarkdown}`);
        } else {
          // Fallback: prepend to note
          updatedContent = `${imageBlock}\n${noteContent}`;
        }

        await app.replaceNoteContent({ uuid: targetUUID }, updatedContent);

        return {
          success: true,
          message: `Chart image saved directly above Table ${tableIndex + 1} in your note!`
        };
      }

      case "downloadCSV": {
        const content = payload.content || "";
        const csv = convertMarkdownToCSV(content);
        return { success: true, csv };
      }

      case "copyTablesToNewNote": {
        const { noteUUID, noteName, markdownContent } = payload;
        const sourceUUID = noteUUID || (app.settings || {})["Current_Note_UUID [Do not Edit!]"];
        const sourceNote = sourceUUID ? await getNote(app, sourceUUID) : null;
        const title = (noteName || (sourceNote ? sourceNote.name : 'Note')) + ' — Extracted Tables';
        
        let contentToCopy = markdownContent;
        if (!contentToCopy && sourceUUID) {
          const raw = await app.getNoteContent({ uuid: sourceUUID });
          contentToCopy = extractTablesFromMarkdown(raw, sourceNote ? sourceNote.name : '');
        }

        if (!contentToCopy || !contentToCopy.trim()) {
          return { success: false, error: 'No tables found to copy.' };
        }

        const newNoteUUID = await app.createNote(title, ['-reports/-tables-copy']);
        if (newNoteUUID) {
          await app.insertNoteContent({ uuid: newNoteUUID }, contentToCopy);
          await app.navigate(`https://www.amplenote.com/notes/${newNoteUUID}`);
          return {
            success: true,
            newNoteUUID,
            message: `Created new note "${title}" with all tables!`
          };
        }
        return { success: false, error: 'Failed to create new note.' };
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
