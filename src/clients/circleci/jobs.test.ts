import { describe, it, expect, vi, beforeEach } from 'vitest';
import { JobsAPI } from './jobs.js';
import { HTTPClient } from './httpClient.js';

describe('JobsAPI', () => {
  let jobsAPI: JobsAPI;
  let mockClient: HTTPClient;

  beforeEach(() => {
    mockClient = {
      get: vi.fn(),
    } as any;
    jobsAPI = new JobsAPI(mockClient);
  });

  describe('getJobArtifacts', () => {
    it('should fetch artifacts for a job', async () => {
      const mockArtifacts = {
        items: [
          {
            path: 'test.xml',
            url: 'https://example.com/test.xml',
            node_index: 0,
            size: 1024
          }
        ],
        next_page_token: null
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockArtifacts);

      const result = await jobsAPI.getJobArtifacts({
        projectSlug: 'gh/org/repo',
        jobNumber: 123
      });

      expect(mockClient.get).toHaveBeenCalledWith(
        '/project/gh/org/repo/123/artifacts',
        {}
      );
      expect(result).toHaveLength(1);
      expect(result[0].path).toBe('test.xml');
    });

    it('should handle pagination for artifacts', async () => {
      const page1 = {
        items: [{ path: 'a.xml', url: 'http://a', node_index: 0, size: 100 }],
        next_page_token: 'token1'
      };
      const page2 = {
        items: [{ path: 'b.xml', url: 'http://b', node_index: 0, size: 200 }],
        next_page_token: null
      };

      vi.spyOn(mockClient, 'get')
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const result = await jobsAPI.getJobArtifacts({
        projectSlug: 'gh/org/repo',
        jobNumber: 123
      });

      expect(mockClient.get).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });
  });
});
