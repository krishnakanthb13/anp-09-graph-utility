import { getCurrentDateTime } from '../lib/utils/dateTime.js';

describe('getCurrentDateTime', () => {
  it('should return correct YYYYMMDD (8-digit), YYMMDD (6-digit) and HHMMSS (6-digit) format', () => {
    const { YYYYMMDD, YYMMDD, HHMMSS } = getCurrentDateTime();
    // Validate 8-digit YYYYMMDD (e.g. 20260821)
    expect(YYYYMMDD).toMatch(/^\d{8}$/);
    // Validate 6-digit YYMMDD (e.g. 260821)
    expect(YYMMDD).toMatch(/^\d{6}$/);
    expect(YYYYMMDD.endsWith(YYMMDD)).toBe(true);
    // Validate 6-digit HHMMSS (e.g. 143000)
    expect(HHMMSS).toMatch(/^\d{6}$/);
  });
});
