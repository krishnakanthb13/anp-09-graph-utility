/* global URL */
/**
 * Downloads data as a text file via browser DOM.
 * @param {string} resultText - Content to download
 * @param {string} filename - File name suffix (e.g. "Markdown_Tables.md")
 * @param {string} YYMMDD - Date prefix
 * @param {string} HHMMSS - Time prefix
 * @param {string} noteUUID - Note UUID prefix
 */
export function downloadTextFile(resultText, filename, YYMMDD, HHMMSS, noteUUID) {
  let blob = new Blob([resultText], { type: "text/plain;charset=utf-8" });
  let link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.href = url;
  link.download = `${YYMMDD}_${HHMMSS}_${noteUUID}_${filename}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
