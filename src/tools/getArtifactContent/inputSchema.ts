import { z } from 'zod';

export const getArtifactContentInputSchema = z.object({
  // Artifact URL from list_job_artifacts
  artifactUrl: z
    .string()
    .url()
    .describe(
      'The artifact download URL from list_job_artifacts. This is the "url" field from the artifact metadata.',
    ),

  // Size limit for content
  maxSize: z
    .number()
    .min(1)
    .max(10 * 1024 * 1024) // 10MB max
    .default(1024 * 1024) // 1MB default
    .describe(
      'Maximum bytes to fetch. Default 1MB, max 10MB. Larger artifacts will be truncated.',
    ),

  // Encoding hint
  encoding: z
    .enum(['text', 'base64', 'auto'])
    .default('auto')
    .describe(
      'How to return content. "text" for text files, "base64" for binary, "auto" to detect from content-type.',
    ),

  // Line-based tail for text files
  tailLines: z
    .number()
    .min(1)
    .max(10000)
    .optional()
    .describe(
      'For text files, return only the last N lines. Useful for log files where errors are at the end.',
    ),

  // Parsing options
  parse: z
    .enum(['none', 'json', 'junit', 'auto'])
    .default('none')
    .describe(
      'How to parse the content. "none" returns raw content, "json" parses as JSON, "junit" parses JUnit XML test results, "auto" detects format from content-type/content.',
    ),
});
