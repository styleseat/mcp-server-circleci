import { getArtifactContentInputSchema } from './inputSchema.js';

export const getArtifactContentTool = {
  name: 'get_artifact_content' as const,
  description: `
    Fetches the content of a CircleCI artifact. Use this after list_job_artifacts to read artifact contents.

    Common use cases:
    - Reading log files from build artifacts
    - Viewing test result files
    - Examining coverage reports
    - Reading any text or binary artifact

    Input parameters:
    - artifactUrl (required): The artifact download URL from list_job_artifacts
    - maxSize: Maximum bytes to fetch (default: 1MB, max: 10MB)
    - encoding: How to return content - "text", "base64", or "auto" (default: "auto")
    - tailLines: For text files, return only the last N lines (useful for logs)
    - parse: How to parse content (default: "none")
      * "none": Return raw content only
      * "json": Parse as JSON
      * "junit": Parse as JUnit XML test results (extracts failures)
      * "auto": Detect format from content-type and parse if recognized

    Returns:
    - url: The artifact URL that was fetched
    - contentType: The MIME type of the artifact
    - size: Size in bytes (total and fetched)
    - encoding: How the content is encoded ("text" or "base64")
    - content: The artifact content (text or base64-encoded)
    - truncated: Whether the content was truncated due to size limits
    - parsed: (only if parse != "none") Structured data extracted from the content

    JUnit parsing (parse="junit") returns:
    - summary.totalTests, totalFailures, totalErrors, totalSkipped
    - summary.failedTests: Array of {name, classname, message}

    Recommended Workflow:
    1. Use list_job_artifacts to find artifacts (e.g., pathPattern="**/*.xml")
    2. Use this tool to fetch content
    3. For test results, use parse="junit" to extract structured failure info
  `,
  inputSchema: getArtifactContentInputSchema,
};
