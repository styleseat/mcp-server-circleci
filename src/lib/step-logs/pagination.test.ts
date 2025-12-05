import { describe, it, expect } from 'vitest';
import { paginateText } from './pagination.js';

describe('paginateText', () => {
  it('should return full text when under limit', () => {
    const text = 'Short text';
    const result = paginateText(text, { offset: 0, limit: 1000 });

    expect(result.content).toBe(text);
    expect(result.pagination.hasMore).toBe(false);
    expect(result.pagination.totalSize).toBe(10);
  });

  it('should paginate text with offset and limit', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4';
    const result = paginateText(text, { offset: 0, limit: 15 });

    expect(result.content).toBe('Line 1\nLine 2\n');
    expect(result.pagination.hasMore).toBe(true);
    expect(result.pagination.nextOffset).toBe(14);
  });

  it('should split on line boundaries', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = paginateText(text, { offset: 0, limit: 10 });

    // Should include complete Line 1, not cut mid-line
    expect(result.content).toBe('Line 1\n');
  });

  it('should handle offset in middle of text', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4';
    const result = paginateText(text, { offset: 7, limit: 15 });

    expect(result.content).toBe('Line 2\nLine 3\n');
  });
});
