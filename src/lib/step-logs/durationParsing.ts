/**
 * Parse natural duration string to milliseconds
 * @param duration String like "5m", "30s", "2h"
 * @returns Duration in milliseconds
 */
export function parseDurationToMs(duration: string): number {
  const match = duration.match(/^(\d+)([smh])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 's':
      return value * 1000;
    case 'm':
      return value * 60 * 1000;
    case 'h':
      return value * 60 * 60 * 1000;
    default:
      throw new Error(`Unknown duration unit: ${unit}`);
  }
}

/**
 * Format milliseconds to human-readable duration
 * @param ms Duration in milliseconds
 * @returns Human-readable string like "2m 34s"
 */
export function formatDuration(ms: number): string {
  if (ms === 0) return '0s';

  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (seconds > 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

/**
 * Estimate log size category based on bytes
 * @param bytes Number of bytes
 * @returns Size category
 */
export function estimateLogSize(
  bytes: number,
): 'small' | 'medium' | 'large' | 'huge' {
  if (bytes < 10 * 1024) return 'small'; // < 10KB
  if (bytes < 100 * 1024) return 'medium'; // < 100KB
  if (bytes < 1024 * 1024) return 'large'; // < 1MB
  return 'huge'; // >= 1MB
}
