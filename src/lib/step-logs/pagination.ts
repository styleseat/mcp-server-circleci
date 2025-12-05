export interface PaginationOptions {
  offset: number;
  limit: number;
}

export interface PaginationResult {
  content: string;
  pagination: {
    offset: number;
    limit: number;
    totalSize: number;
    hasMore: boolean;
    nextOffset?: number;
  };
}

/**
 * Paginate text content, splitting on line boundaries
 * @param text Full text content
 * @param options Pagination options
 * @returns Paginated content with metadata
 */
export function paginateText(
  text: string,
  options: PaginationOptions,
): PaginationResult {
  const { offset, limit } = options;
  const totalSize = text.length;

  if (offset >= totalSize) {
    return {
      content: '',
      pagination: {
        offset,
        limit,
        totalSize,
        hasMore: false,
      },
    };
  }

  // Get the chunk
  const endPos = Math.min(offset + limit, totalSize);
  let chunk = text.substring(offset, endPos);

  // If we're not at the end and the chunk doesn't end with a newline,
  // trim to the last newline to avoid cutting lines
  if (endPos < totalSize && !chunk.endsWith('\n')) {
    const lastNewline = chunk.lastIndexOf('\n');
    if (lastNewline !== -1) {
      chunk = chunk.substring(0, lastNewline + 1);
    }
  }

  const actualEndPos = offset + chunk.length;
  const hasMore = actualEndPos < totalSize;

  return {
    content: chunk,
    pagination: {
      offset,
      limit,
      totalSize,
      hasMore,
      nextOffset: hasMore ? actualEndPos : undefined,
    },
  };
}
