import { getStepLogsInputSchema } from './inputSchema.js';

export const getStepLogsTool = {
  name: 'circleci_get_step_logs' as const,
  description: `
    Fetches actual log output for specific steps in a CircleCI job. Supports filtering by step name/status and pagination for large logs.

    Common use cases:
    - Debugging specific test failures by examining logs
    - Extracting error messages from failed steps
    - Analyzing output from specific build steps
    - Token-efficient log retrieval with pagination

    Input options for job identification (EXACTLY ONE required):

    Option 1 - Direct Parameters (both required):
    - projectSlug: The CircleCI project slug (format: "gh/organization/project")
    - jobNumber: The CircleCI job number

    Option 2 - URL-based:
    - projectURL: The URL of the CircleCI job

    Option 3 - Project Detection (both required):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository

    Step Selection Options:
    - stepNames: Array of exact step names to fetch logs for (e.g., ["Run Tests", "Build"])
    - stepNamePattern: Glob or regex pattern to match step names (e.g., "test-*")
    - stepStatus: Filter by status - 'success', 'failure', or 'all' (default: 'all')

    Pagination Options:
    - offset: Character offset for pagination (default: 0)
    - limit: Maximum characters to return per step (default: 50000)

    Output Options:
    - outputFormat: 'full', 'excerpt', or 'summary' (default: 'full')
      * full: Complete logs with pagination
      * excerpt: First/last portions with context
      * summary: Metadata only

    Returns:
    - steps: Array of step logs with:
      * stepId: Unique step identifier
      * stepName: Name of the step
      * status: 'success' or 'failure'
      * logs: Object containing log content and excerpt flag
      * pagination: Metadata for fetching more content

    Recommended Workflow:
    1. Use circleci_get_job_steps first to see available steps
    2. Identify which steps you need logs for (typically failed steps)
    3. Use this tool to fetch logs for those specific steps
    4. Use pagination if logs are truncated

    This is token-efficient as it only fetches logs you specifically request.
  `,
  inputSchema: getStepLogsInputSchema,
};
