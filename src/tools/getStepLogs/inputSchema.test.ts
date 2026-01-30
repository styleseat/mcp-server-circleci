import { describe, it, expect } from 'vitest';
import { getStepLogsInputSchema } from './inputSchema.js';

describe('getStepLogsInputSchema', () => {
  it('should validate basic inputs with projectSlug and jobNumber', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      stepNames: ['test', 'build'],
    });
    expect(result.success).toBe(true);
  });

  it('should validate projectURL input', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectURL:
        'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc/jobs/456',
    });
    expect(result.success).toBe(true);
  });

  it('should validate pagination options', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      offset: 0,
      limit: 5000,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.offset).toBe(0);
      expect(result.data.limit).toBe(5000);
    }
  });

  it('should validate tailLines option', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      tailLines: 500,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.tailLines).toBe(500);
    }
  });

  it('should reject tailLines below minimum', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      tailLines: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should reject tailLines above maximum', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      tailLines: 20000,
    });
    expect(result.success).toBe(false);
  });

  it('should validate stepStatus filter', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      stepStatus: 'failure',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepStatus).toBe('failure');
    }
  });

  it('should reject invalid stepStatus', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      stepStatus: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should apply default values', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stepStatus).toBe('all');
      expect(result.data.offset).toBe(0);
      expect(result.data.limit).toBe(50000);
    }
  });

  it('should reject negative offset', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      offset: -1,
    });
    expect(result.success).toBe(false);
  });

  it('should reject limit above maximum', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      limit: 600000,
    });
    expect(result.success).toBe(false);
  });
});
