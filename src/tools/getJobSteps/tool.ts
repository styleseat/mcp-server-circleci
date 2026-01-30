import { getJobStepsInputSchema } from './inputSchema.js';

export const getJobStepsTool = {
  name: 'get_job_steps' as const,
  description: `
    Retrieves lightweight metadata for all steps in a CircleCI job. Returns step names, status, duration, and log sizes without fetching actual logs.

    Common use cases:
    - Understanding job structure and step organization
    - Identifying which steps failed in a job
    - Deciding which steps to fetch logs for
    - Analyzing step execution times
    - Estimating log sizes before fetching

    Input options (EXACTLY ONE of these options must be used):

    Option 1 - Direct Parameters (both required):
    - projectSlug: The CircleCI project slug (format: "gh/organization/project")
    - jobNumber: The CircleCI job number

    Option 2 - URL-based (provide one):
    - projectURL: The URL of the CircleCI job in any of these formats:
      * Job URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def/jobs/xyz
      * Workflow URL: https://app.circleci.com/pipelines/gh/organization/project/123/workflows/abc-def
      * Pipeline URL: https://app.circleci.com/pipelines/gh/organization/project/123

    Option 3 - Project Detection (ALL required together):
    - workspaceRoot: The absolute path to the workspace root
    - gitRemoteURL: The URL of the git remote repository
    - branch: The name of the current branch

    Returns:
    - jobName: Name of the job
    - jobNumber: The job number
    - steps: Array of step metadata with:
      * stepId: Unique identifier for the step
      * name: Step name
      * index: Order index
      * status: 'success', 'failure', 'canceled', or 'running'
      * exitCode: Exit code if available
      * startTime: ISO timestamp
      * duration: Human-readable duration (e.g., "2m 34s")
      * durationMs: Duration in milliseconds
      * logSize: Estimated size in bytes and category
      * hasLogs: Whether logs are available
    - totalSteps: Total number of steps
    - failedSteps: Number of failed steps
    - metadata: Pipeline number, workflow ID, branch

    Recommended Workflow:
    1. Use this tool first to understand the job structure
    2. Review step statuses and log sizes
    3. Use get_step_logs to fetch actual logs for specific steps

    This is a token-efficient approach as it only fetches metadata, not full logs.
  `,
  inputSchema: getJobStepsInputSchema,
};
