import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getStepLogs } from './handler.js';
import * as projectDetection from '../../lib/project-detection/index.js';
import {
  getCircleCIClient,
  getCircleCIPrivateClient,
} from '../../clients/client.js';

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

  it('should return MCP error when projectSlug provided without jobNumber', async () => {
    const args = {
      params: {
        projectSlug: 'gh/org/repo',
      },
    } as any;
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
          actions: [
            {
              index: 0,
              step: 1,
              failed: false,
              has_output: true,
            },
          ],
        },
      ],
    };

    const mockLogs = {
      output: 'Test output',
      error: '',
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails),
      },
    };

    const mockPrivateClient = {
      jobs: {
        getStepOutput: vi.fn().mockResolvedValue(mockLogs),
      },
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);
    vi.mocked(getCircleCIPrivateClient).mockReturnValue(
      mockPrivateClient as any,
    );

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123,
        stepNames: ['Test Step'],
      },
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('Test output');
  });

  it('should filter by stepStatus=failure', async () => {
    const mockJobDetails = {
      build_num: 123,
      workflows: { job_name: 'test' },
      steps: [
        {
          name: 'Success Step',
          actions: [{ index: 0, step: 1, failed: false, has_output: true }],
        },
        {
          name: 'Failed Step',
          actions: [{ index: 0, step: 2, failed: true, has_output: true }],
        },
      ],
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails),
      },
    };

    const mockPrivateClient = {
      jobs: {
        getStepOutput: vi.fn().mockResolvedValue({
          output: 'Error: test failed',
          error: 'Stack trace here',
        }),
      },
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);
    vi.mocked(getCircleCIPrivateClient).mockReturnValue(
      mockPrivateClient as any,
    );

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123,
        stepStatus: 'failure',
      },
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });
    const parsed = JSON.parse(response.content[0].text);

    // Should only return the failed step
    expect(parsed.steps).toHaveLength(1);
    expect(parsed.steps[0].stepName).toBe('Failed Step');
    expect(parsed.steps[0].status).toBe('failure');
    expect(parsed.summary.failureSteps).toBe(1);
  });

  it('should use tailLines mode when specified', async () => {
    const mockJobDetails = {
      build_num: 123,
      workflows: { job_name: 'test' },
      steps: [
        {
          name: 'Test Step',
          actions: [{ index: 0, step: 1, failed: true, has_output: true }],
        },
      ],
    };

    // Create a multi-line log output
    const lines = Array.from({ length: 100 }, (_, i) => `Line ${i + 1}`);
    const mockLogs = {
      output: lines.join('\n'),
      error: '',
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails),
      },
    };

    const mockPrivateClient = {
      jobs: {
        getStepOutput: vi.fn().mockResolvedValue(mockLogs),
      },
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);
    vi.mocked(getCircleCIPrivateClient).mockReturnValue(
      mockPrivateClient as any,
    );

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123,
        tailLines: 10,
      },
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });
    const parsed = JSON.parse(response.content[0].text);

    // Should return last 10 lines
    expect(parsed.steps[0].logs.truncated).toBe(true);
    expect(parsed.steps[0].lineInfo.mode).toBe('tail');
    expect(parsed.steps[0].lineInfo.returnedLines).toBe(10);
    expect(parsed.steps[0].lineInfo.totalLines).toBe(100);
    expect(parsed.steps[0].logs.content).toContain('Line 100');
    expect(parsed.steps[0].logs.content).not.toContain('Line 1\n');
  });

  it('should handle step fetch errors gracefully', async () => {
    const mockJobDetails = {
      build_num: 123,
      workflows: { job_name: 'test' },
      steps: [
        {
          name: 'Broken Step',
          actions: [{ index: 0, step: 1, failed: true, has_output: true }],
        },
      ],
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails),
      },
    };

    const mockPrivateClient = {
      jobs: {
        getStepOutput: vi.fn().mockRejectedValue(new Error('API timeout')),
      },
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);
    vi.mocked(getCircleCIPrivateClient).mockReturnValue(
      mockPrivateClient as any,
    );

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123,
      },
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });
    const parsed = JSON.parse(response.content[0].text);

    // Should return error info instead of silently dropping
    expect(parsed.steps[0].status).toBe('error');
    expect(parsed.steps[0].error).toContain('API timeout');
    expect(parsed.summary.errorSteps).toBe(1);
  });

  it('should return message when no steps match filters', async () => {
    const mockJobDetails = {
      build_num: 123,
      workflows: { job_name: 'test' },
      steps: [
        {
          name: 'Success Step',
          actions: [{ index: 0, step: 1, failed: false, has_output: true }],
        },
      ],
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails),
      },
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123,
        stepStatus: 'failure', // No failures exist
      },
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.message).toContain('No steps matched');
  });

  it('should handle projectURL input', async () => {
    vi.mocked(projectDetection.getProjectSlugFromURL).mockReturnValue(
      'gh/org/repo',
    );
    vi.mocked(projectDetection.getJobNumberFromURL).mockReturnValue(456);

    const mockJobDetails = {
      build_num: 456,
      workflows: { job_name: 'test' },
      steps: [
        {
          name: 'Test Step',
          actions: [{ index: 0, step: 1, failed: false, has_output: true }],
        },
      ],
    };

    const mockClient = {
      jobsV1: {
        getJobDetails: vi.fn().mockResolvedValue(mockJobDetails),
      },
    };

    const mockPrivateClient = {
      jobs: {
        getStepOutput: vi.fn().mockResolvedValue({ output: 'OK', error: '' }),
      },
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);
    vi.mocked(getCircleCIPrivateClient).mockReturnValue(
      mockPrivateClient as any,
    );

    const args = {
      params: {
        projectURL:
          'https://app.circleci.com/pipelines/gh/org/repo/123/workflows/abc/jobs/456',
      },
    } as any;
    const controller = new AbortController();

    const response = await getStepLogs(args, { signal: controller.signal });

    expect(response).not.toHaveProperty('isError');
    expect(mockClient.jobsV1.getJobDetails).toHaveBeenCalledWith({
      projectSlug: 'gh/org/repo',
      jobNumber: 456,
    });
  });
});
