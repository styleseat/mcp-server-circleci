import { describe, it, expect } from 'vitest';
import { listJobArtifactsInputSchema } from './inputSchema.js';

describe('listJobArtifactsInputSchema', () => {
  it('should validate basic inputs', () => {
    const result = listJobArtifactsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123
    });
    expect(result.success).toBe(true);
  });

  it('should validate with path pattern', () => {
    const result = listJobArtifactsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123,
      pathPattern: '*.xml'
    });
    expect(result.success).toBe(true);
  });
});
