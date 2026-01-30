import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromURL,
  getJobNumberFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getStepLogsInputSchema } from './inputSchema.js';
import {
  getCircleCIClient,
  getCircleCIPrivateClient,
} from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { paginateText, tailText } from '../../lib/step-logs/pagination.js';

export const getStepLogs: ToolCallback<{
  params: typeof getStepLogsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    projectURL,
    projectSlug: inputProjectSlug,
    jobNumber: inputJobNumber,
    stepNames,
    stepStatus,
    offset,
    limit,
    tailLines,
  } = args.params ?? {};

  let projectSlug: string | undefined;
  let jobNumber: number | undefined;

  // Parse inputs
  if (inputProjectSlug && inputJobNumber) {
    projectSlug = inputProjectSlug;
    jobNumber = inputJobNumber;
  } else if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
    jobNumber = getJobNumberFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL) {
    projectSlug = await identifyProjectSlug({ gitRemoteURL });
  } else {
    return mcpErrorOutput(
      'Missing required inputs. Provide projectSlug+jobNumber or projectURL.',
    );
  }

  if (!projectSlug || !jobNumber) {
    return mcpErrorOutput('Project slug and job number are required.');
  }

  // Fetch job details
  const circleci = getCircleCIClient();
  const circleciPrivate = getCircleCIPrivateClient();

  const jobDetails = await circleci.jobsV1.getJobDetails({
    projectSlug,
    jobNumber,
  });

  // Filter steps
  let selectedActions = jobDetails.steps.flatMap((step) => {
    return step.actions.map((action) => ({
      stepName: step.name,
      action,
    }));
  });

  // Filter by step names
  if (stepNames && stepNames.length > 0) {
    selectedActions = selectedActions.filter((sa) =>
      stepNames.includes(sa.stepName),
    );
  }

  // Filter by status
  if (stepStatus === 'failure') {
    selectedActions = selectedActions.filter((sa) => sa.action.failed);
  } else if (stepStatus === 'success') {
    selectedActions = selectedActions.filter((sa) => !sa.action.failed);
  }

  // Fetch logs for selected steps
  const stepsWithLogs = await Promise.all(
    selectedActions.map(async ({ stepName, action }) => {
      try {
        const logs = await circleciPrivate.jobs.getStepOutput({
          projectSlug,
          jobNumber,
          taskIndex: action.index,
          stepId: action.step,
        });

        // Combine output and error, filtering empty parts
        const parts = [logs.output, logs.error].filter(
          (p) => p && p.trim().length > 0,
        );
        const fullContent = parts.join('\n').trim();

        // Use tailLines mode if specified, otherwise use offset/limit pagination
        if (tailLines !== undefined) {
          const tailed = tailText(fullContent, { lines: tailLines });
          return {
            stepId: `${action.step}-${action.index}`,
            stepName,
            status: action.failed ? 'failure' : 'success',
            logs: {
              content: tailed.content,
              truncated: tailed.truncated,
            },
            lineInfo: {
              totalLines: tailed.totalLines,
              returnedLines: tailed.returnedLines,
              mode: 'tail' as const,
            },
          };
        } else {
          const paginated = paginateText(fullContent, {
            offset: offset ?? 0,
            limit: limit ?? 50000,
          });
          return {
            stepId: `${action.step}-${action.index}`,
            stepName,
            status: action.failed ? 'failure' : 'success',
            logs: {
              content: paginated.content,
              truncated: paginated.pagination.hasMore,
            },
            pagination: paginated.pagination,
          };
        }
      } catch (error) {
        // Return error info instead of silently dropping the step
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          stepId: `${action.step}-${action.index}`,
          stepName,
          status: 'error' as const,
          error: `Failed to fetch logs: ${errorMessage}`,
        };
      }
    }),
  );

  // All steps are returned (including those with errors)
  if (stepsWithLogs.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              message: 'No steps matched the specified filters.',
              filters: {
                stepNames: stepNames ?? 'all',
                stepStatus: stepStatus ?? 'all',
              },
            },
            null,
            2,
          ),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            jobNumber,
            projectSlug,
            steps: stepsWithLogs,
            summary: {
              totalSteps: stepsWithLogs.length,
              successSteps: stepsWithLogs.filter((s) => s.status === 'success')
                .length,
              failureSteps: stepsWithLogs.filter((s) => s.status === 'failure')
                .length,
              errorSteps: stepsWithLogs.filter((s) => s.status === 'error')
                .length,
            },
          },
          null,
          2,
        ),
      },
    ],
  };
};
