import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStepLogs } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import { getCircleCIClient, getCircleCIPrivateClient } from '../../clients/client.js';

vi.mock('../../lib/project-detection/index.js');
vi.mock('../../clients/client.js');

describe('getStepLogs handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return MCP error when no inputs provided', async () => {
    const args = { params: {} } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });

    expect(response).toHaveProperty('isError', true);
  });

  it('should fetch logs for specified steps', async () => {
    const mockJobDetails = {
      build_num: 123,
      workflows: { job_name: 'test' },
      steps: [
        {
          name: 'Test Step',
          actions: [{
            index: 0,
            step: 1,
            failed: false,
            has_output: true,
          }]
        }
      ]
    };

    const mockLogs = {
      output: 'Test output',
      error: ''
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails)
      }
    };

    const mockPrivateClient = {
      jobs: {
        getStepOutput: vi.fn().mockResolvedValue(mockLogs)
      }
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);
    vi.mocked(getCircleCIPrivateClient).mockReturnValue(mockPrivateClient as any);

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123,
        stepNames: ['Test Step']
      }
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('Test output');
  });
});
