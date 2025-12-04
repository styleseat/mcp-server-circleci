import { describe, it, expect } from 'vitest';
import { parseDurationToMs, formatDuration, estimateLogSize } from './durationParsing.js';

describe('durationParsing', () => {
  describe('parseDurationToMs', () => {
    it('should parse seconds', () => {
      expect(parseDurationToMs('30s')).toBe(30000);
      expect(parseDurationToMs('1s')).toBe(1000);
    });

    it('should parse minutes', () => {
      expect(parseDurationToMs('5m')).toBe(300000);
      expect(parseDurationToMs('1m')).toBe(60000);
    });

    it('should parse hours', () => {
      expect(parseDurationToMs('2h')).toBe(7200000);
    });

    it('should handle invalid input', () => {
      expect(() => parseDurationToMs('invalid')).toThrow();
      expect(() => parseDurationToMs('')).toThrow();
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds to human readable', () => {
      expect(formatDuration(30000)).toBe('30s');
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0s');
    });
  });

  describe('estimateLogSize', () => {
    it('should categorize small logs', () => {
      expect(estimateLogSize(5000)).toBe('small');
    });

    it('should categorize medium logs', () => {
      expect(estimateLogSize(50000)).toBe('medium');
    });

    it('should categorize large logs', () => {
      expect(estimateLogSize(500000)).toBe('large');
    });

    it('should categorize huge logs', () => {
      expect(estimateLogSize(5000000)).toBe('huge');
    });
  });
});
