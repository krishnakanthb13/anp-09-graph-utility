/**
 * Gets the current date and time formatted for filenames and audit stamps.
 * Provides both 8-digit YYYYMMDD and 6-digit YYMMDD aliases along with HHMMSS.
 * @returns {{ YYYYMMDD: string, YYMMDD: string, HHMMSS: string }}
 */
export function getCurrentDateTime() {
  const now = new Date();
  const YYYYMMDD = now.toLocaleDateString('en-GB').split('/').reverse().join('');
  const YYMMDD = YYYYMMDD.slice(2);
  const HHMMSS = now.toLocaleTimeString('en-GB', { hour12: false }).replace(/:/g, '');
  return { YYYYMMDD, YYMMDD, HHMMSS };
}
