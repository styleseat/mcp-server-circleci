import { z } from 'zod';
import {
  branchDescription,
  projectSlugDescription,
} from '../shared/constants.js';

export const getStepLogsInputSchema = z.object({
  projectSlug: z.string().describe(projectSlugDescription).optional(),
  jobNumber: z.number().describe('The CircleCI job number').optional(),
  projectURL: z
    .string()
    .describe('The URL of the CircleCI job')
    .optional(),
  branch: z.string().describe(branchDescription).optional(),
  workspaceRoot: z.string().describe('Workspace root path').optional(),
  gitRemoteURL: z.string().describe('Git remote URL').optional(),

  // Step selection
  stepNames: z
    .array(z.string())
    .describe('Array of step names to fetch logs for')
    .optional(),
  stepNamePattern: z
    .string()
    .describe('Glob or regex pattern to match step names (e.g., "test-*")')
    .optional(),
  stepStatus: z
    .enum(['success', 'failure', 'all'])
    .describe('Filter steps by status')
    .default('all'),

  // Pagination
  offset: z
    .number()
    .describe('Character offset for pagination')
    .default(0),
  limit: z
    .number()
    .describe('Maximum characters to return per step')
    .default(50000),

  // Output format
  outputFormat: z
    .enum(['full', 'excerpt', 'summary'])
    .describe('Output format: full logs, excerpts, or summary')
    .default('full'),
});
