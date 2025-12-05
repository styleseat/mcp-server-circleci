import { listJobArtifactsInputSchema } from './inputSchema.js';

export const listJobArtifactsTool = {
  name: 'circleci_list_job_artifacts' as const,
  description: `
    Lists all artifacts for a CircleCI job with metadata. Supports filtering by path pattern, file size, and parallel node. Returns artifact paths, sizes, and download URLs.

    Common use cases:
    - Finding specific test result files (e.g., JUnit XML, coverage reports)
    - Locating build artifacts (e.g., compiled binaries, Docker images)
    - Filtering artifacts by size before downloading
    - Identifying artifacts from specific parallel nodes
    - Getting download URLs for artifacts

    Input parameters:
    - projectSlug (required): The CircleCI project slug (format: "gh/organization/project")
    - jobNumber (required): The CircleCI job number

    Optional filters:
    - pathPattern: Glob pattern to filter artifacts (e.g., "*.log", "test-results/**/*.xml")
    - minSize: Minimum file size (e.g., "1MB", "500KB")
    - maxSize: Maximum file size (e.g., "100MB")
    - nodeIndex: Filter to artifacts from specific parallel node (0-based)

    Returns:
    - jobNumber: The job number
    - artifacts: Array of artifact metadata with:
      * artifactId: Unique identifier for the artifact
      * path: Full path of the artifact
      * url: Download URL for the artifact
      * size: Size in bytes and human-readable format
      * nodeIndex: Index of the parallel node that generated it
      * prettyPath: Just the filename for easier reading
    - totalArtifacts: Total number of artifacts matching filters
    - totalSize: Total size of all matching artifacts

    Example usage:
    - Find all test result XML files: pathPattern="**/*.xml"
    - Get large artifacts only: minSize="10MB"
    - Get artifacts from node 0: nodeIndex=0
  `,
  inputSchema: listJobArtifactsInputSchema,
};
