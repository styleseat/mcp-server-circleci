import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getProjectSlugFromURL,
  getJobNumberFromURL,
  identifyProjectSlug,
} from '../../lib/project-detection/index.js';
import { getStepLogsInputSchema } from './inputSchema.js';
import { getCircleCIClient, getCircleCIPrivateClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { paginateText } from '../../lib/step-logs/pagination.js';

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
    outputFormat,
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

        const fullContent = `${logs.output}\n${logs.error}`.trim();

        // Apply pagination
        const paginated = paginateText(fullContent, { offset: offset ?? 0, limit: limit ?? 50000 });

        return {
          stepId: `${action.step}-${action.index}`,
          stepName,
          status: action.failed ? 'failure' : 'success',
          logs: {
            content: paginated.content,
            excerpt: false,
          },
          pagination: paginated.pagination,
        };
      } catch (error) {
        console.error(`Failed to fetch logs for ${stepName}:`, error);
        return null;
      }
    }),
  );

  const validSteps = stepsWithLogs.filter((s) => s !== null);

  if (validSteps.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: 'No logs found for the specified steps.',
        },
      ],
    };
  }

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ steps: validSteps }, null, 2),
      },
    ],
  };
};
