import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getArtifactContentInputSchema } from './inputSchema.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { tailText } from '../../lib/step-logs/pagination.js';

// Text-based MIME types that should be returned as text
const TEXT_MIME_TYPES = [
  'text/',
  'application/json',
  'application/xml',
  'application/javascript',
  'application/x-yaml',
  'application/x-sh',
];

function isTextContent(contentType: string | null): boolean {
  if (!contentType) return false;
  const lower = contentType.toLowerCase();
  return TEXT_MIME_TYPES.some((prefix) => lower.includes(prefix));
}

interface JUnitTestCase {
  name: string;
  classname: string;
  time?: number;
  failure?: string;
  error?: string;
  skipped?: boolean;
}

interface JUnitTestSuite {
  name: string;
  tests: number;
  failures: number;
  errors: number;
  skipped: number;
  time?: number;
  testcases: JUnitTestCase[];
}

interface ParsedJUnit {
  format: 'junit';
  suites: JUnitTestSuite[];
  summary: {
    totalTests: number;
    totalFailures: number;
    totalErrors: number;
    totalSkipped: number;
    failedTests: Array<{
      name: string;
      classname: string;
      message: string;
    }>;
  };
}

interface ParsedJSON {
  format: 'json';
  data: unknown;
}

type ParsedContent = ParsedJUnit | ParsedJSON | null;

/**
 * Simple JUnit XML parser - extracts test results without full XML parsing library
 */
function parseJUnitXml(content: string): ParsedJUnit | null {
  // Check if this looks like JUnit XML
  if (!content.includes('<testsuite') && !content.includes('<testsuites')) {
    return null;
  }

  const suites: JUnitTestSuite[] = [];
  const failedTests: Array<{
    name: string;
    classname: string;
    message: string;
  }> = [];

  // Match testsuite elements
  const suiteRegex = /<testsuite\s+([^>]*)>([\s\S]*?)<\/testsuite>/gi;
  let suiteMatch;

  while ((suiteMatch = suiteRegex.exec(content)) !== null) {
    const attrs = suiteMatch[1];
    const suiteContent = suiteMatch[2];

    // Extract attributes
    const getName = (s: string) => {
      const m = s.match(/name=["']([^"']*)["']/);
      return m ? m[1] : '';
    };
    const getNum = (s: string, attr: string) => {
      const m = s.match(new RegExp(`${attr}=["']([^"']*)["']`));
      return m ? parseInt(m[1], 10) || 0 : 0;
    };

    const suite: JUnitTestSuite = {
      name: getName(attrs),
      tests: getNum(attrs, 'tests'),
      failures: getNum(attrs, 'failures'),
      errors: getNum(attrs, 'errors'),
      skipped: getNum(attrs, 'skipped'),
      time: getNum(attrs, 'time'),
      testcases: [],
    };

    // Match testcase elements
    const caseRegex = /<testcase\s+([^>]*?)(?:\/>|>([\s\S]*?)<\/testcase>)/gi;
    let caseMatch;

    while ((caseMatch = caseRegex.exec(suiteContent)) !== null) {
      const caseAttrs = caseMatch[1];
      const caseContent = caseMatch[2] || '';

      const testCase: JUnitTestCase = {
        name: getName(caseAttrs),
        classname: caseAttrs.match(/classname=["']([^"']*)["']/)?.[1] || '',
        time: parseFloat(caseAttrs.match(/time=["']([^"']*)["']/)?.[1] || '0'),
      };

      // Check for failure
      const failureMatch = caseContent.match(
        /<failure[^>]*(?:message=["']([^"']*)["'])?[^>]*>?([\s\S]*?)<\/failure>/i,
      );
      if (failureMatch) {
        testCase.failure =
          failureMatch[1] || failureMatch[2]?.trim() || 'Test failed';
        failedTests.push({
          name: testCase.name,
          classname: testCase.classname,
          message: testCase.failure,
        });
      }

      // Check for error
      const errorMatch = caseContent.match(
        /<error[^>]*(?:message=["']([^"']*)["'])?[^>]*>?([\s\S]*?)<\/error>/i,
      );
      if (errorMatch) {
        testCase.error = errorMatch[1] || errorMatch[2]?.trim() || 'Test error';
        failedTests.push({
          name: testCase.name,
          classname: testCase.classname,
          message: testCase.error,
        });
      }

      // Check for skipped
      if (caseContent.includes('<skipped')) {
        testCase.skipped = true;
      }

      suite.testcases.push(testCase);
    }

    suites.push(suite);
  }

  if (suites.length === 0) {
    return null;
  }

  return {
    format: 'junit',
    suites,
    summary: {
      totalTests: suites.reduce((sum, s) => sum + s.tests, 0),
      totalFailures: suites.reduce((sum, s) => sum + s.failures, 0),
      totalErrors: suites.reduce((sum, s) => sum + s.errors, 0),
      totalSkipped: suites.reduce((sum, s) => sum + s.skipped, 0),
      failedTests,
    },
  };
}

function parseContent(
  content: string,
  contentType: string | null,
): ParsedContent {
  // Try JUnit XML
  if (
    contentType?.includes('xml') ||
    content.trimStart().startsWith('<?xml') ||
    content.includes('<testsuite')
  ) {
    const junit = parseJUnitXml(content);
    if (junit) return junit;
  }

  // Try JSON
  if (contentType?.includes('json') || content.trimStart().startsWith('{')) {
    try {
      const data = JSON.parse(content);
      return { format: 'json', data };
    } catch {
      // Not valid JSON
    }
  }

  return null;
}

export const getArtifactContent: ToolCallback<{
  params: typeof getArtifactContentInputSchema;
}> = async (args) => {
  const {
    artifactUrl,
    maxSize = 1024 * 1024,
    encoding = 'auto',
    tailLines,
    parse = 'none',
  } = args.params ?? {};

  if (!artifactUrl) {
    return mcpErrorOutput('artifactUrl is required');
  }

  try {
    // Fetch the artifact
    const response = await fetch(artifactUrl, {
      method: 'GET',
      headers: {
        Accept: '*/*',
      },
    });

    if (!response.ok) {
      return mcpErrorOutput(
        `Failed to fetch artifact: ${response.status} ${response.statusText}`,
      );
    }

    const contentType = response.headers.get('content-type');
    const contentLength = parseInt(
      response.headers.get('content-length') || '0',
      10,
    );

    // Determine if this is text content
    const isText =
      encoding === 'text' ||
      (encoding === 'auto' && isTextContent(contentType));

    // Read content with size limit
    const reader = response.body?.getReader();
    if (!reader) {
      return mcpErrorOutput('Failed to read artifact response body');
    }

    const chunks: Uint8Array[] = [];
    let totalBytes = 0;
    let truncated = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      if (totalBytes + value.length > maxSize) {
        // Truncate to maxSize
        const remaining = maxSize - totalBytes;
        if (remaining > 0) {
          chunks.push(value.slice(0, remaining));
          totalBytes += remaining;
        }
        truncated = true;
        reader.cancel();
        break;
      }

      chunks.push(value);
      totalBytes += value.length;
    }

    // Combine chunks
    const fullContent = new Uint8Array(totalBytes);
    let offset = 0;
    for (const chunk of chunks) {
      fullContent.set(chunk, offset);
      offset += chunk.length;
    }

    let content: string;
    let outputEncoding: 'text' | 'base64';
    let parsed: ParsedContent = null;

    if (isText) {
      const decoder = new TextDecoder('utf-8', { fatal: false });
      content = decoder.decode(fullContent);
      outputEncoding = 'text';

      // Apply tailLines if specified
      if (tailLines !== undefined) {
        const tailed = tailText(content, { lines: tailLines });
        content = tailed.content;
        if (tailed.truncated) {
          truncated = true;
        }
      }

      // Parse content if requested
      if (parse === 'auto') {
        parsed = parseContent(content, contentType);
      } else if (parse === 'json') {
        try {
          parsed = { format: 'json', data: JSON.parse(content) };
        } catch {
          // Not valid JSON, leave parsed as null
        }
      } else if (parse === 'junit') {
        parsed = parseJUnitXml(content);
      }
      // parse === 'none' leaves parsed as null
    } else {
      // Return as base64 for binary content
      content = Buffer.from(fullContent).toString('base64');
      outputEncoding = 'base64';
    }

    const result = {
      url: artifactUrl,
      contentType: contentType || 'application/octet-stream',
      size: {
        bytes: contentLength || totalBytes,
        fetched: totalBytes,
      },
      encoding: outputEncoding,
      content,
      truncated,
      ...(parsed && { parsed }),
    };

    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return mcpErrorOutput(`Failed to fetch artifact: ${errorMessage}`);
  }
};
