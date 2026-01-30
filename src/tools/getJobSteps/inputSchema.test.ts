import { describe, it, expect } from 'vitest';
import { getJobStepsInputSchema } from './inputSchema.js';

describe('getJobStepsInputSchema', () => {
  it('should validate projectSlug and jobNumber', () => {
    const result = getJobStepsInputSchema.safeParse({
      projectSlug: 'gh/org/repo',
      jobNumber: 123
    });
    expect(result.success).toBe(true);
  });

  it('should validate with projectURL', () => {
    const result = getJobStepsInputSchema.safeParse({
      projectURL: 'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc/jobs/456'
    });
    expect(result.success).toBe(true);
  });

  it('should allow workspace context', () => {
    const result = getJobStepsInputSchema.safeParse({
      workspaceRoot: '/workspace',
      gitRemoteURL: 'https://github.com/org/repo.git',
      branch: 'main'
    });
    expect(result.success).toBe(true);
  });
});
