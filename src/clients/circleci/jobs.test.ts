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

    it('should throw timeout error when timeout is reached', async () => {
      const mockArtifacts = {
        items: [{ path: 'test.xml', url: 'https://example.com/test.xml', node_index: 0, size: 1024 }],
        next_page_token: 'token1'
      };

      vi.spyOn(mockClient, 'get').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return mockArtifacts;
      });

      await expect(
        jobsAPI.getJobArtifacts({
          projectSlug: 'gh/org/repo',
          jobNumber: 123,
          options: { timeoutMs: 100 }
        })
      ).rejects.toThrow('Timeout reached after 100ms');
    });

    it('should throw max pages error when max pages limit reached', async () => {
      const mockPage = {
        items: [{ path: 'test.xml', url: 'https://example.com/test.xml', node_index: 0, size: 1024 }],
        next_page_token: 'token1'
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockPage);

      await expect(
        jobsAPI.getJobArtifacts({
          projectSlug: 'gh/org/repo',
          jobNumber: 123,
          options: { maxPages: 2 }
        })
      ).rejects.toThrow('Maximum number of pages (2) reached');
    });

    it('should throw schema validation error when API returns invalid data', async () => {
      const invalidResponse = {
        items: [
          {
            path: 'test.xml',
            // missing required fields: url, node_index, size
          }
        ],
        next_page_token: null
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(invalidResponse);

      await expect(
        jobsAPI.getJobArtifacts({
          projectSlug: 'gh/org/repo',
          jobNumber: 123
        })
      ).rejects.toThrow();
    });
  });

  describe('getWorkflowJobs', () => {
    it('should throw timeout error when timeout is reached', async () => {
      const mockJobs = {
        items: [{
          id: 'job-1',
          status: 'success',
          name: 'test-job',
          job_number: 123,
          type: 'build',
          started_at: '2024-01-01T00:00:00Z',
          stopped_at: '2024-01-01T00:01:00Z'
        }],
        next_page_token: 'token1'
      };

      vi.spyOn(mockClient, 'get').mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return mockJobs;
      });

      await expect(
        jobsAPI.getWorkflowJobs({
          workflowId: 'workflow-123',
          options: { timeoutMs: 100 }
        })
      ).rejects.toThrow('Timeout reached after 100ms');
    });

    it('should throw max pages error when max pages limit reached', async () => {
      const mockPage = {
        items: [{
          id: 'job-1',
          status: 'success',
          name: 'test-job',
          job_number: 123,
          type: 'build',
          started_at: '2024-01-01T00:00:00Z',
          stopped_at: '2024-01-01T00:01:00Z'
        }],
        next_page_token: 'token1'
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(mockPage);

      await expect(
        jobsAPI.getWorkflowJobs({
          workflowId: 'workflow-123',
          options: { maxPages: 2 }
        })
      ).rejects.toThrow('Maximum number of pages (2) reached');
    });

    it('should throw schema validation error when API returns invalid data', async () => {
      const invalidResponse = {
        items: [
          {
            // missing required field: id
            job_number: 123
          }
        ],
        next_page_token: null
      };

      vi.spyOn(mockClient, 'get').mockResolvedValue(invalidResponse);

      await expect(
        jobsAPI.getWorkflowJobs({
          workflowId: 'workflow-123'
        })
      ).rejects.toThrow();
    });
  });
});
