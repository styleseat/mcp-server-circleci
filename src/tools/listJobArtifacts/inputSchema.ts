import { z } from 'zod';
import { projectSlugDescription } from '../shared/constants.js';

export const listJobArtifactsInputSchema = z.object({
  projectSlug: z.string().describe(projectSlugDescription),
  jobNumber: z.number().describe('The CircleCI job number'),
  pathPattern: z
    .string()
    .describe('Glob pattern to filter artifacts (e.g., "*.log", "test-results/**/*.xml")')
    .optional(),
  minSize: z
    .string()
    .describe('Minimum file size (e.g., "1MB")')
    .optional(),
  maxSize: z
    .string()
    .describe('Maximum file size (e.g., "100MB")')
    .optional(),
  nodeIndex: z
    .number()
    .describe('Filter to artifacts from specific parallel node')
    .optional(),
});
