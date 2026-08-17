/**
 * Gets the current date and time in YYMMDD and HHMMSS format.
 * @returns {{ YYMMDD: string, HHMMSS: string }}
 */
export function getCurrentDateTime() {
  const now = new Date();
  const YYMMDD = now.toLocaleDateString('en-GB').split('/').reverse().join('');
  const HHMMSS = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '');
  return { YYMMDD, HHMMSS };
}
