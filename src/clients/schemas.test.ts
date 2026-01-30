import { describe, it, expect } from 'vitest';
import { Artifact } from './schemas.js';

describe('Artifact schema', () => {
  it('should validate a valid artifact', () => {
    const validArtifact = {
      path: 'test-results/junit.xml',
      url: 'https://circleci.com/artifacts/...',
      node_index: 0,
      size: 1024
    };

    const result = Artifact.safeParse(validArtifact);
    expect(result.success).toBe(true);
  });

  it('should reject artifact with missing required fields', () => {
    const invalidArtifact = {
      path: 'test.xml'
      // missing url, node_index, size
    };

    const result = Artifact.safeParse(invalidArtifact);
    expect(result.success).toBe(false);
  });
});
