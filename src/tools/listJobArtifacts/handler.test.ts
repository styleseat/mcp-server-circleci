import { describe, it, expect, vi, beforeEach } from 'vitest';
import { listJobArtifacts } from './handler.js';
import { getCircleCIClient } from '../../clients/client.js';

vi.mock('../../clients/client.js');

describe('listJobArtifacts handler', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return artifacts list', async () => {
    const mockArtifacts = [
      {
        path: 'test.xml',
        url: 'https://example.com/test.xml',
        node_index: 0,
        size: 1024
      }
    ];

    const mockClient = {
      jobs: {
        getJobArtifacts: vi.fn().mockResolvedValue(mockArtifacts)
      }
    };

    vi.mocked(getCircleCIClient).mockReturnValue(mockClient as any);

    const args = {
      params: {
        projectSlug: 'gh/org/repo',
        jobNumber: 123
      }
    } as any;
    const controller = new AbortController();

    const response = await listJobArtifacts(args, { signal: controller.signal });

    expect(response).not.toHaveProperty('isError');
    expect(response.content[0].text).toContain('test.xml');
  });
});
