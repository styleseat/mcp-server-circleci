import { z } from 'zod';
import { projectSlugDescription } from '../shared/constants.js';

export const getStepLogsInputSchema = z.object({
  // Job identification - Option 1: Direct parameters
  projectSlug: z.string().describe(projectSlugDescription).optional(),
  jobNumber: z.number().describe('The CircleCI job number').optional(),

  // Job identification - Option 2: URL
  projectURL: z.string().describe('The URL of the CircleCI job').optional(),

  // Job identification - Option 3: Workspace detection
  workspaceRoot: z.string().describe('Workspace root path').optional(),
  gitRemoteURL: z.string().describe('Git remote URL').optional(),

  // Step selection
  stepNames: z
    .array(z.string())
    .describe('Array of exact step names to fetch logs for')
    .optional(),
  stepStatus: z
    .enum(['success', 'failure', 'all'])
    .describe('Filter steps by status. Use "failure" to get only failed steps.')
    .default('all'),

  // Pagination - character-based
  offset: z
    .number()
    .min(0)
    .describe('Character offset for pagination (0-indexed)')
    .default(0),
  limit: z
    .number()
    .min(1)
    .max(500000)
    .describe('Maximum characters to return per step (default 50000)')
    .default(50000),

  // Tail mode - line-based (alternative to offset/limit)
  tailLines: z
    .number()
    .min(1)
    .max(10000)
    .describe(
      'Return only the last N lines of each step log. Useful for finding errors which typically appear at the end. Overrides offset/limit when specified.',
    )
    .optional(),
});
