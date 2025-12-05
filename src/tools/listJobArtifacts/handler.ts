import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { listJobArtifactsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import { minimatch } from 'minimatch';

export const listJobArtifacts: ToolCallback<{
  params: typeof listJobArtifactsInputSchema;
}> = async (args) => {
  const {
    projectSlug,
    jobNumber,
    pathPattern,
    minSize,
    maxSize,
    nodeIndex,
  } = args.params ?? {};

  const circleci = getCircleCIClient();
  const artifacts = await circleci.jobs.getJobArtifacts({
    projectSlug,
    jobNumber,
  });

  // Apply filters
  let filtered = artifacts;

  if (pathPattern) {
    filtered = filtered.filter((a) => minimatch(a.path, pathPattern));
  }

  if (nodeIndex !== undefined) {
    filtered = filtered.filter((a) => a.node_index === nodeIndex);
  }

  // Parse size filters
  const parseSize = (size: string): number => {
    const match = size.match(/^(\d+)(KB|MB|GB)?$/i);
    if (!match) return 0;
    const value = parseInt(match[1], 10);
    const unit = (match[2] || '').toUpperCase();
    switch (unit) {
      case 'KB':
        return value * 1024;
      case 'MB':
        return value * 1024 * 1024;
      case 'GB':
        return value * 1024 * 1024 * 1024;
      default:
        return value;
    }
  };

  if (minSize) {
    const minBytes = parseSize(minSize);
    filtered = filtered.filter((a) => a.size >= minBytes);
  }

  if (maxSize) {
    const maxBytes = parseSize(maxSize);
    filtered = filtered.filter((a) => a.size <= maxBytes);
  }

  // Format output
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const totalSize = filtered.reduce((sum, a) => sum + a.size, 0);

  const result = {
    jobNumber,
    artifacts: filtered.map((a) => ({
      artifactId: a.path,
      path: a.path,
      url: a.url,
      size: {
        bytes: a.size,
        readable: formatSize(a.size),
      },
      nodeIndex: a.node_index,
      prettyPath: a.path.split('/').pop() || a.path,
    })),
    totalArtifacts: filtered.length,
    totalSize: {
      bytes: totalSize,
      readable: formatSize(totalSize),
    },
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
};
