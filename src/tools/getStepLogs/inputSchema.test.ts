import { describe, it, expect } from 'vitest';
import { getStepLogsInputSchema } from './inputSchema.js';

describe('getStepLogsInputSchema', () => {
  it('should validate basic inputs', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      stepNames: ['test', 'build']
    });
    expect(result.success).toBe(true);
  });

  it('should validate pagination options', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      offset: 0,
      limit: 5000
    });
    expect(result.success).toBe(true);
  });

  it('should validate output format', () => {
    const result = getStepLogsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      outputFormat: 'excerpt'
    });
    expect(result.success).toBe(true);
  });
});
