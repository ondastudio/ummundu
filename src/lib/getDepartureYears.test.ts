import { describe, it, expect } from 'vitest';
import { getDepartureYears } from './getDepartureYears';

describe('getDepartureYears', () => {
  it('returns a span of consecutive years starting at baseYear', () => {
    expect(getDepartureYears(2026, 3)).toEqual([2026, 2027, 2028]);
  });

  it('returns a single year when span is 1', () => {
    expect(getDepartureYears(2030, 1)).toEqual([2030]);
  });
});
