import { getCurrentDateTime } from '../lib/utils/dateTime.js';

describe('getCurrentDateTime', () => {
  it('should return correct YYMMDD and HHMMSS format (Happy Path)', () => {
    const { YYMMDD, HHMMSS } = getCurrentDateTime();
    // Validate YYMMDD (e.g. 231015)
    expect(YYMMDD).toMatch(/^\d{8}$/);
    // Validate HHMMSS (e.g. 143000)
    expect(HHMMSS).toMatch(/^\d{6}$/);
  });
});
