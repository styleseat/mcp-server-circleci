import { getStepLogsInputSchema } from './inputSchema.js';

export const getStepLogsTool = {
  name: 'get_step_logs' as const,
  description: `
    Fetches log output for specific steps in a CircleCI job. Supports filtering by step name and status, with pagination for large logs.

    IMPORTANT: For quickly diagnosing failures, use stepStatus='failure' and tailLines=500 to get just the last 500 lines of failed steps (where errors typically appear).

    Common use cases:
    - Debugging test failures by examining error output
    - Extracting error messages from failed build steps
    - Token-efficient retrieval of just the relevant log portions

    Input options for job identification (EXACTLY ONE required):

    Option 1 - Direct Parameters (both required):
    - projectSlug: The CircleCI project slug (format: "gh/organization/project")
    - jobNumber: The CircleCI job number

    Option 2 - URL-based:
    - projectURL: The URL of the CircleCI job

    Option 3 - Project Detection (both required):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository

    Step Selection:
    - stepNames: Array of exact step names to fetch logs for (e.g., ["Run Tests", "Build"])
    - stepStatus: Filter by status - 'success', 'failure', or 'all' (default: 'all')

    Pagination (two modes):

    Character-based pagination:
    - offset: Character offset (default: 0)
    - limit: Maximum characters per step (default: 50000, max: 500000)

    Line-based tail mode (recommended for error diagnosis):
    - tailLines: Return only the last N lines (overrides offset/limit)
      Use tailLines=200-500 for typical error diagnosis

    Returns:
    - steps: Array of step logs with:
      * stepId: Unique step identifier
      * stepName: Name of the step
      * status: 'success' or 'failure'
      * logs: { content: string, truncated: boolean }
      * pagination: { offset, limit, totalSize, hasMore }

    Recommended Workflow:
    1. Use get_job_steps to see available steps and identify failures
    2. Call this tool with stepStatus='failure' and tailLines=500
    3. If more context needed, increase tailLines or use offset/limit pagination
  `,
  inputSchema: getStepLogsInputSchema,
};
