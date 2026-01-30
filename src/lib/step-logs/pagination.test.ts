import { describe, it, expect } from 'vitest';
import { paginateText, tailText } from './pagination.js';

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

describe('tailText', () => {
  it('should return full text when fewer lines than requested', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = tailText(text, { lines: 10 });

    expect(result.content).toBe(text);
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(3);
    expect(result.returnedLines).toBe(3);
  });

  it('should return last N lines when text has more lines', () => {
    const text = 'Line 1\nLine 2\nLine 3\nLine 4\nLine 5';
    const result = tailText(text, { lines: 2 });

    expect(result.content).toBe('Line 4\nLine 5');
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(5);
    expect(result.returnedLines).toBe(2);
  });

  it('should handle empty text', () => {
    const result = tailText('', { lines: 10 });

    expect(result.content).toBe('');
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(0);
    expect(result.returnedLines).toBe(0);
  });

  it('should handle single line', () => {
    const text = 'Single line';
    const result = tailText(text, { lines: 1 });

    expect(result.content).toBe('Single line');
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(1);
    expect(result.returnedLines).toBe(1);
  });

  it('should handle exact line count match', () => {
    const text = 'Line 1\nLine 2\nLine 3';
    const result = tailText(text, { lines: 3 });

    expect(result.content).toBe(text);
    expect(result.truncated).toBe(false);
    expect(result.totalLines).toBe(3);
    expect(result.returnedLines).toBe(3);
  });

  it('should preserve empty lines', () => {
    const text = 'Line 1\n\nLine 3\n\nLine 5';
    const result = tailText(text, { lines: 3 });

    expect(result.content).toBe('Line 3\n\nLine 5');
    expect(result.truncated).toBe(true);
    expect(result.totalLines).toBe(5);
    expect(result.returnedLines).toBe(3);
  });
});
