import { describe, it, expect } from 'vitest';
import { getArtifactContentInputSchema } from './inputSchema.js';

describe('getArtifactContentInputSchema', () => {
  it('should validate basic artifact URL', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://circleci.com/artifacts/123/test-results.xml',
    });
    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('should validate maxSize within bounds', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
      maxSize: 5 * 1024 * 1024, // 5MB
    });
    expect(result.success).toBe(true);
  });

  it('should reject maxSize above maximum', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
      maxSize: 20 * 1024 * 1024, // 20MB - over 10MB limit
    });
    expect(result.success).toBe(false);
  });

  it('should validate encoding options', () => {
    for (const encoding of ['text', 'base64', 'auto']) {
      const result = getArtifactContentInputSchema.safeParse({
        artifactUrl: 'https://example.com/artifact.txt',
        encoding,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid encoding', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
      encoding: 'invalid',
    });
    expect(result.success).toBe(false);
  });

  it('should validate tailLines', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
      tailLines: 500,
    });
    expect(result.success).toBe(true);
  });

  it('should reject tailLines below minimum', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
      tailLines: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should apply default values', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.maxSize).toBe(1024 * 1024);
      expect(result.data.encoding).toBe('auto');
      expect(result.data.parse).toBe('none');
    }
  });

  it('should validate parse options', () => {
    for (const parse of ['none', 'json', 'junit', 'auto']) {
      const result = getArtifactContentInputSchema.safeParse({
        artifactUrl: 'https://example.com/artifact.txt',
        parse,
      });
      expect(result.success).toBe(true);
    }
  });

  it('should reject invalid parse option', () => {
    const result = getArtifactContentInputSchema.safeParse({
      artifactUrl: 'https://example.com/artifact.txt',
      parse: 'xml',
    });
    expect(result.success).toBe(false);
  });
});
