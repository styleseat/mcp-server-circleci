import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getJobSteps } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import { getCircleCIClient } from '../../clients/client.js';

vi.mock('../../lib/project-detection/index.js');
vi.mock('../../clients/client.js');

describe('getJobSteps handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return MCP error when no inputs provided', async () => {
    const args = { params: {} } as any;
    const controller = new AbortController();

    const response = await getJobSteps(args, { signal: controller.signal });

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].type).toBe('text');
  });

  it('should return MCP error when projectSlug provided without jobNumber', async () => {
    const args = {
      params: { projectSlug: 'gh/org/repo' }
    } as any;
    const controller = new AbortController();

    const response = await getJobSteps(args, { signal: controller.signal });

    expect(response).toHaveProperty('isError', true);
    expect(response.content[0].text).toContain('jobNumber');
  });

  it('should fetch and return job steps metadata', async () => {
    const mockJobDetails = {
      build_num: 123,
      workflows: { job_name: 'test-job' },
      steps: [
        {
          name: 'Checkout code',
          actions: [{
            index: 0,
            step: 1,
            failed: false,
            start_time: '2025-01-01T10:00:00Z',
            end_time: '2025-01-01T10:00:05Z',
            exit_code: 0,
            has_output: true,
          }]
        }
      ]
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails)
      }
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);

    const args = {
      params: { projectSlug: 'gh/org/repo', jobNumber: 123 }
    } as any;
    const controller = new AbortController();

    const response = await getJobSteps(args, { signal: controller.signal });

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].type).toBe('text');
    expect(response.content[0].text).toContain('stepId');
    expect(response.content[0].text).toContain('Checkout code');
  });
});
