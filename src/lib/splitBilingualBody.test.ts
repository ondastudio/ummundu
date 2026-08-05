import { describe, it, expect } from 'vitest';
import { splitBilingualBody } from './splitBilingualBody';

describe('splitBilingualBody', () => {
  it('splits a body with EN before PT', () => {
    const body = '## EN\nHello there.\n\n## PT\nOlá ali.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('Hello there.');
    expect(result.pt).toBe('Olá ali.');
  });

  it('splits a body with PT before EN', () => {
    const body = '## PT\nOlá ali.\n\n## EN\nHello there.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('Hello there.');
    expect(result.pt).toBe('Olá ali.');
  });

  it('throws when a section is missing', () => {
    const body = '## EN\nHello there.';
    expect(() => splitBilingualBody(body)).toThrow(
      'Destination body must contain both "## EN" and "## PT" sections'
    );
  });

  it('preserves multi-sentence markdown within a section', () => {
    const body =
      '## EN\nFirst sentence. Second sentence.\n\n## PT\nPrimeira frase.';
    const result = splitBilingualBody(body);
    expect(result.en).toBe('First sentence. Second sentence.');
  });
});
