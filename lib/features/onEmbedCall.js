import { 
  extractTablesFromMarkdown, 
  transposeMarkdownTables, 
  extractStructuredTables, 
  findMarkdownTableBlocks, 
  convertMarkdownToCSV, 
  compileMathExpression, 
  generateFormulaMarkdownTable,
  getNote
} from "../utils/index.js";

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
        const incoming = typeof payload === "string" ? JSON.parse(payload) : payload;
        if (!incoming || typeof incoming !== 'object' || !incoming.noteUUID || typeof incoming.noteUUID !== 'string') {
          return { success: false, error: "Invalid state payload or missing noteUUID." };
        }

        const currentSetting = (app.settings || {})["Graph_Dashboard_State"];
        let stateMap = { version: 1, notes: {} };

        if (currentSetting) {
          try {
            const parsed = typeof currentSetting === 'string' ? JSON.parse(currentSetting) : currentSetting;
            if (parsed && typeof parsed === 'object') {
              stateMap = parsed.notes && typeof parsed.notes === 'object' ? parsed : { version: 1, notes: parsed };
              if (!stateMap.notes || typeof stateMap.notes !== 'object') {
                stateMap.notes = {};
              }
            }
          } catch {}
        }

        stateMap.version = 1;
        stateMap.notes[incoming.noteUUID] = {
          ...incoming,
          updatedAt: Date.now()
        };
        stateMap.activeNoteUUID = incoming.noteUUID;

        // Bound storage size: Keep at most 50 most recently updated notes (preserving active note)
        const noteKeys = Object.keys(stateMap.notes);
        if (noteKeys.length > 50) {
          const sortedKeys = noteKeys
            .filter(k => k !== stateMap.activeNoteUUID)
            .sort((a, b) => {
              const timeA = stateMap.notes[a]?.updatedAt || 0;
              const timeB = stateMap.notes[b]?.updatedAt || 0;
              return timeA - timeB;
            });
          const keysToRemove = sortedKeys.slice(0, noteKeys.length - 50);
          for (const k of keysToRemove) {
            delete stateMap.notes[k];
          }
        }

        if (typeof app.setSetting === "function") {
          await app.setSetting("Graph_Dashboard_State", JSON.stringify(stateMap));
        }
        return { success: true };
      }

      case "getState": {
        const raw = (app.settings || {})["Graph_Dashboard_State"];
        if (!raw) return null;
        try {
          const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
          const targetUUID = payload?.noteUUID;
          if (parsed && parsed.notes && targetUUID && parsed.notes[targetUUID]) {
            return parsed.notes[targetUUID];
          }
          return parsed;
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
        if (!markdown) {
          return {
            success: true,
            noteUUID: selectedUUID,
            noteName: note ? note.name : "Untitled Note",
            noteTags: note ? note.tags : [],
            cleanedContent: "",
            transposeContent: "",
            tables: []
          };
        }
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
        if (!note && !app.getNoteContent) {
          return { success: false, error: "Note could not be found." };
        }

        // 1. Snapshot initial note content before network/media operations
        const initialContent = await app.getNoteContent({ uuid: targetUUID });
        if (typeof initialContent !== "string") {
          return { success: false, error: "Could not read initial note content." };
        }

        // 2. Attach media to get a permanent Amplenote CDN image URL
        let imageSrc = dataUrl;
        let mediaAttached = false;
        if (note && typeof note.attachMedia === "function") {
          try {
            imageSrc = await note.attachMedia(dataUrl);
            mediaAttached = true;
          } catch (attachErr) {
            console.warn("[GraphUtility] note.attachMedia fallback:", attachErr);
          }
        } else if (typeof app.attachNoteMedia === "function") {
          try {
            imageSrc = await app.attachNoteMedia({ uuid: targetUUID }, dataUrl);
            mediaAttached = true;
          } catch (attachErr) {
            console.warn("[GraphUtility] app.attachNoteMedia fallback:", attachErr);
          }
        }

        const imageBlock = `\n\\\n\n![](${imageSrc})\n\n\\\n\n`;

        // 3. Fetch fresh note content immediately before replacing (Optimistic Concurrency Verification)
        const freshContent = await app.getNoteContent({ uuid: targetUUID });
        if (typeof freshContent !== "string") {
          return { 
            success: false, 
            error: mediaAttached 
              ? "Image uploaded, but could not read latest note content to insert." 
              : "Could not read note content." 
          };
        }

        // 4. Locate target table in fresh note content using the canonical table tokenizer
        const foundTables = findMarkdownTableBlocks(freshContent);
        if (foundTables.length === 0) {
          return {
            success: false,
            error: mediaAttached
              ? "Image uploaded, but no target tables were found in the note."
              : "No target tables were found in the note."
          };
        }

        const normalizedRaw = (rawTableMarkdown || '').trim();
        const noteChanged = initialContent !== freshContent;
        let targetLine = -1;

        if (!noteChanged) {
          // Case 1: Note did not change. Verify table index & optional raw content match.
          if (typeof tableIndex === 'number' && tableIndex >= 0 && tableIndex < foundTables.length) {
            const candidate = foundTables[tableIndex];
            if (!normalizedRaw || candidate.rawTableMarkdown === normalizedRaw || candidate.sourceRaw === normalizedRaw) {
              targetLine = candidate.startLine;
            }
          }
          
          // If index didn't match directly but raw content was provided, search for unique match
          if (targetLine === -1 && normalizedRaw) {
            const matchingIndices = [];
            for (let idx = 0; idx < foundTables.length; idx++) {
              if (foundTables[idx].rawTableMarkdown === normalizedRaw || foundTables[idx].sourceRaw === normalizedRaw) {
                matchingIndices.push(idx);
              }
            }
            if (matchingIndices.length === 1) {
              targetLine = foundTables[matchingIndices[0]].startLine;
            }
          }
        } else {
          // Case 2: Note changed concurrently. Require an unambiguous unique content match.
          if (normalizedRaw) {
            const matchingTableIndices = [];
            for (let idx = 0; idx < foundTables.length; idx++) {
              if (foundTables[idx].rawTableMarkdown === normalizedRaw || foundTables[idx].sourceRaw === normalizedRaw) {
                matchingTableIndices.push(idx);
              }
            }

            if (matchingTableIndices.length === 1) {
              targetLine = foundTables[matchingTableIndices[0]].startLine;
            } else {
              return {
                success: false,
                error: mediaAttached
                  ? "Image uploaded, but the note was modified during save and the target table could not be safely verified. Please retry."
                  : "Note was modified during save. Please retry."
              };
            }
          } else {
            return {
              success: false,
              error: mediaAttached
                ? "Image uploaded, but the note was modified during save and the target table could not be verified. Please retry."
                : "Note was modified during save. Please retry."
            };
          }
        }

        // Fail closed: If target table cannot be positively verified, DO NOT write or fall back to prepend
        if (targetLine === -1) {
          return {
            success: false,
            error: mediaAttached
              ? "Image uploaded, but target table could not be verified in the note. Please retry."
              : "Target table could not be verified in the note."
          };
        }

        const lines = freshContent.replace(/\r\n/g, '\n').split('\n');
        const newLines = [
          ...lines.slice(0, targetLine),
          imageBlock.trim(),
          ...lines.slice(targetLine)
        ];
        const updatedContent = newLines.join('\n');

        try {
          await app.replaceNoteContent({ uuid: targetUUID }, updatedContent);
        } catch (replaceErr) {
          return {
            success: false,
            error: mediaAttached
              ? `Image uploaded, but note update failed: ${replaceErr.message}`
              : `Failed to update note content: ${replaceErr.message}`
          };
        }

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
        const safeNoteName = (noteName || (sourceNote ? sourceNote.name : 'Note')).replace(/[\r\n]+/g, ' ').trim();
        const title = `${safeNoteName} — Extracted Tables`;
        
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

      case "insertFormulaTableToNote": {
        const { heading, formulas, xMin, xMax, formulaPoints } = payload;
        
        // 1. Validate formulas server-side
        if (!Array.isArray(formulas) || formulas.length === 0) {
          return { success: false, error: "No formulas provided." };
        }

        const validFormulas = [];
        for (const f of formulas) {
          const expr = typeof f === 'string' ? f : f?.expression;
          if (expr && typeof expr === 'string' && expr.trim()) {
            const compiled = compileMathExpression(expr.trim());
            if (!compiled.error) {
              validFormulas.push({
                expression: expr.trim(),
                name: (typeof f === 'object' && f.name) ? String(f.name).trim() : `f(x) = ${expr.trim()}`
              });
            }
          }
        }

        if (validFormulas.length === 0) {
          return { success: false, error: "No valid mathematical formulas to plot." };
        }

        // 2. Normalize and sanitize title
        const rawHeading = typeof heading === 'string' ? heading.replace(/[\r\n]+/g, ' ').trim() : '';
        const sanitizedHeading = rawHeading.replace(/[`*#_~[\]]/g, '').slice(0, 100).trim();
        const noteTitle = sanitizedHeading 
          ? (sanitizedHeading.startsWith("Math Graph") ? sanitizedHeading : `Math Graph — ${sanitizedHeading}`) 
          : "Math Graph — Coordinates";

        const newNoteUUID = await app.createNote(noteTitle, ["-reports/-math-graph"]);
        if (!newNoteUUID) {
          return { success: false, error: "Failed to create new note in Amplenote." };
        }

        // 3. Generate markdown table server-side with verified formula sampler
        const minX = (typeof xMin === 'number' && isFinite(xMin)) ? xMin : -10;
        const maxX = (typeof xMax === 'number' && isFinite(xMax) && xMax > minX) ? xMax : 10;
        const points = (typeof formulaPoints === 'number' && formulaPoints >= 2) ? Math.min(101, formulaPoints) : 21;

        const markdownTable = generateFormulaMarkdownTable(validFormulas, { xMin: minX, xMax: maxX, points });

        const formulaListMd = validFormulas.map(f => {
          const safeName = f.name.replace(/[`*#_~[\]]/g, '').trim();
          const safeExpr = f.expression.replace(/[`\r\n]/g, '').trim();
          return `- **${safeName}** (\`${safeExpr}\`)`;
        }).join('\n');

        const domainText = `[${minX}, ${maxX}]`;
        const resolutionText = `${points} points`;

        const markdownContent = 
`# ${noteTitle}

> 📐 **Generated by Graph Utility Plugin**  
> **Domain**: \`${domainText}\` | **Samples**: \`${resolutionText}\`

---

## 📊 Coordinate Table

${markdownTable}

---

### Active Formulas
${formulaListMd}

---
`;

        if (typeof app.insertNoteContent === "function") {
          await app.insertNoteContent({ uuid: newNoteUUID }, markdownContent);
        } else if (typeof app.replaceNoteContent === "function") {
          await app.replaceNoteContent({ uuid: newNoteUUID }, markdownContent);
        }

        if (typeof app.navigate === "function") {
          await app.navigate(`https://www.amplenote.com/notes/${newNoteUUID}`);
        }

        return {
          success: true,
          newNoteUUID,
          message: `Created new note "${noteTitle}" with coordinate table!`
        };
      }

      case "saveFormulaImageToNote": {
        const { dataUrl, formulaTitle, formulas, xMin, xMax, formulaPoints } = payload;
        if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image/')) {
          return { success: false, error: "Missing or invalid image data to save." };
        }

        const validFormulas = [];
        if (Array.isArray(formulas)) {
          for (const f of formulas) {
            const expr = typeof f === 'string' ? f : f?.expression;
            if (expr && typeof expr === 'string' && expr.trim()) {
              const compiled = compileMathExpression(expr.trim());
              if (!compiled.error) {
                validFormulas.push({
                  expression: expr.trim(),
                  name: (typeof f === 'object' && f.name) ? String(f.name).trim() : `f(x) = ${expr.trim()}`
                });
              }
            }
          }
        }

        if (validFormulas.length === 0) {
          return { success: false, error: "No valid mathematical formulas to save." };
        }

        const rawTitle = typeof formulaTitle === 'string' ? formulaTitle.replace(/[\r\n]+/g, ' ').trim() : '';
        const sanitizedTitle = rawTitle.replace(/[`*#_~[\]]/g, '').slice(0, 100).trim();
        const noteTitle = sanitizedTitle 
          ? (sanitizedTitle.startsWith("Math Graph") ? sanitizedTitle : `Math Graph — ${sanitizedTitle}`) 
          : "Math Graph — Plot";

        const newNoteUUID = await app.createNote(noteTitle, ["-reports/-math-graph"]);
        if (!newNoteUUID) {
          return { success: false, error: "Failed to create new note in Amplenote." };
        }

        const newNote = await getNote(app, newNoteUUID);
        let imageSrc = dataUrl;
        if (newNote && typeof newNote.attachMedia === "function") {
          try {
            imageSrc = await newNote.attachMedia(dataUrl);
          } catch (attachErr) {
            console.warn("[GraphUtility] newNote.attachMedia fallback:", attachErr);
          }
        } else if (typeof app.attachNoteMedia === "function") {
          try {
            imageSrc = await app.attachNoteMedia({ uuid: newNoteUUID }, dataUrl);
          } catch (attachErr) {
            console.warn("[GraphUtility] app.attachNoteMedia fallback:", attachErr);
          }
        }

        const formulaListMd = validFormulas.map(f => {
          const safeName = f.name.replace(/[`*#_~[\]]/g, '').trim();
          const safeExpr = f.expression.replace(/[`\r\n]/g, '').trim();
          return `- **${safeName}** (\`${safeExpr}\`)`;
        }).join('\n');

        const minX = (typeof xMin === 'number' && isFinite(xMin)) ? xMin : -10;
        const maxX = (typeof xMax === 'number' && isFinite(xMax) && xMax > minX) ? xMax : 10;
        const points = (typeof formulaPoints === 'number' && formulaPoints >= 2) ? formulaPoints : 200;

        const domainText = `[${minX}, ${maxX}]`;
        const resolutionText = `${points} samples`;

        const markdownContent = 
`# ${noteTitle}

> 📈 **Generated by Graph Utility Plugin**  
> **Domain**: \`${domainText}\` | **Resolution**: \`${resolutionText}\`

---

## 🎨 Function Plot

![](${imageSrc})

---

### Active Formulas
${formulaListMd}

---
`;

        if (typeof app.insertNoteContent === "function") {
          await app.insertNoteContent({ uuid: newNoteUUID }, markdownContent);
        } else if (typeof app.replaceNoteContent === "function") {
          await app.replaceNoteContent({ uuid: newNoteUUID }, markdownContent);
        }

        if (typeof app.navigate === "function") {
          await app.navigate(`https://www.amplenote.com/notes/${newNoteUUID}`);
        }

        return {
          success: true,
          newNoteUUID,
          message: `Created new note "${noteTitle}" with formula plot!`
        };
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
