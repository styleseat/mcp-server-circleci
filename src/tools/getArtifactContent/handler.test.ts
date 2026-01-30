import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getArtifactContent } from './handler.js';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('getArtifactContent handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return MCP error when no artifactUrl provided', async () => {
    const args = { params: {} } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('isError', true);
  });

  it('should fetch and return text content', async () => {
    const mockContent = 'Hello, World!';
    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'text/plain',
        'content-length': String(mockContent.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockContent),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/artifact.txt',
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.content).toBe(mockContent);
    expect(parsed.encoding).toBe('text');
    expect(parsed.truncated).toBe(false);
  });

  it('should parse JUnit XML when parse="junit"', async () => {
    const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="MyTests" tests="3" failures="1" errors="0" skipped="0">
  <testcase name="testPass" classname="com.example.Test" time="0.1"/>
  <testcase name="testFail" classname="com.example.Test" time="0.2">
    <failure message="Expected true but got false">AssertionError</failure>
  </testcase>
  <testcase name="testPass2" classname="com.example.Test" time="0.1"/>
</testsuite>`;

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'application/xml',
        'content-length': String(junitXml.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(junitXml),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/test-results.xml',
        parse: 'junit',
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.parsed).toBeDefined();
    expect(parsed.parsed.format).toBe('junit');
    expect(parsed.parsed.summary.totalTests).toBe(3);
    expect(parsed.parsed.summary.totalFailures).toBe(1);
    expect(parsed.parsed.summary.failedTests).toHaveLength(1);
    expect(parsed.parsed.summary.failedTests[0].name).toBe('testFail');
  });

  it('should NOT parse when parse="none" (default)', async () => {
    const junitXml = `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="MyTests" tests="1" failures="0" errors="0" skipped="0">
  <testcase name="testPass" classname="com.example.Test" time="0.1"/>
</testsuite>`;

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'application/xml',
        'content-length': String(junitXml.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(junitXml),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/test-results.xml',
        // parse defaults to 'none'
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.parsed).toBeUndefined();
    expect(parsed.content).toContain('<testsuite');
  });

  it('should parse JSON content when parse="json"', async () => {
    const jsonContent = JSON.stringify({ foo: 'bar', count: 42 });

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'application/json',
        'content-length': String(jsonContent.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(jsonContent),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/data.json',
        parse: 'json',
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.parsed).toBeDefined();
    expect(parsed.parsed.format).toBe('json');
    expect(parsed.parsed.data.foo).toBe('bar');
  });

  it('should apply tailLines for text content', async () => {
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
    const mockContent = lines.join('\n');

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'text/plain',
        'content-length': String(mockContent.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(mockContent),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/log.txt',
        tailLines: 5,
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.truncated).toBe(true);
    expect(parsed.content).toContain('Line 100');
    expect(parsed.content).not.toContain('Line 1\n');
  });

  it('should handle fetch errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/missing.txt',
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('404');
  });

  it('should truncate content exceeding maxSize', async () => {
    const largeContent = 'x'.repeat(2000);

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'text/plain',
        'content-length': String(largeContent.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: new TextEncoder().encode(largeContent),
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/large.txt',
        maxSize: 1000, // Only fetch 1000 bytes
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.truncated).toBe(true);
    expect(parsed.content.length).toBe(1000);
  });

  it('should return binary content as base64', async () => {
    const binaryContent = new Uint8Array([0x89, 0x50, 0x4e, 0x47]); // PNG header

    mockFetch.mockResolvedValue({
      ok: true,
      headers: new Headers({
        'content-type': 'image/png',
        'content-length': String(binaryContent.length),
      }),
      body: {
        getReader: () => ({
          read: vi
            .fn()
            .mockResolvedValueOnce({
              done: false,
              value: binaryContent,
            })
            .mockResolvedValueOnce({ done: true }),
          cancel: vi.fn(),
        }),
      },
    });

    const args = {
      params: {
        artifactUrl: 'https://example.com/image.png',
      },
    } as any;
    const controller = new AbortController();

    const response = await getArtifactContent(args, {
      signal: controller.signal,
    });

    expect(response).not.toHaveProperty('isError');
    const parsed = JSON.parse(response.content[0].text);
    expect(parsed.encoding).toBe('base64');
    // Verify it's valid base64
    expect(() => Buffer.from(parsed.content, 'base64')).not.toThrow();
  });
});
