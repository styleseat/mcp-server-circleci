import { ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  getPipelineNumberFromURL,
  getProjectSlugFromURL,
  getBranchFromURL,
  identifyProjectSlug,
  getJobNumberFromURL,
} from '../../lib/project-detection/index.js';
import { getJobStepsInputSchema } from './inputSchema.js';
import { getCircleCIClient } from '../../clients/client.js';
import mcpErrorOutput from '../../lib/mcpErrorOutput.js';
import { formatDuration, estimateLogSize } from '../../lib/step-logs/durationParsing.js';

export const getJobSteps: ToolCallback<{
  params: typeof getJobStepsInputSchema;
}> = async (args) => {
  const {
    workspaceRoot,
    gitRemoteURL,
    branch,
    projectURL,
    projectSlug: inputProjectSlug,
    jobNumber: inputJobNumber,
  } = args.params ?? {};

  let projectSlug: string | undefined;
  let jobNumber: number | undefined;
  let pipelineNumber: number | undefined;
  let branchFromURL: string | undefined;

  // Parse inputs
  if (inputProjectSlug && inputJobNumber) {
    projectSlug = inputProjectSlug;
    jobNumber = inputJobNumber;
  } else if (projectURL) {
    projectSlug = getProjectSlugFromURL(projectURL);
    pipelineNumber = getPipelineNumberFromURL(projectURL);
    branchFromURL = getBranchFromURL(projectURL);
    jobNumber = getJobNumberFromURL(projectURL);
  } else if (workspaceRoot && gitRemoteURL && branch) {
    projectSlug = await identifyProjectSlug({ gitRemoteURL });
  } else {
    return mcpErrorOutput(
      'Missing required inputs. Please provide either: 1) projectSlug with jobNumber, 2) projectURL, or 3) workspaceRoot with gitRemoteURL and branch.',
    );
  }

  if (!projectSlug) {
    return mcpErrorOutput('Project not found. Please provide valid project information.');
  }

  // If we don't have a job number yet, we need to find the latest job
  if (!jobNumber) {
    if (!branch && !branchFromURL) {
      return mcpErrorOutput('Branch is required when jobNumber is not provided.');
    }

    const circleci = getCircleCIClient();

    // Get pipeline
    let pipeline;
    if (pipelineNumber) {
      pipeline = await circleci.pipelines.getPipelineByNumber({
        projectSlug,
        pipelineNumber,
      });
    } else {
      const pipelines = await circleci.pipelines.getPipelines({
        projectSlug,
        branch: branchFromURL || branch,
      });
      pipeline = pipelines[0];
    }

    if (!pipeline) {
      return mcpErrorOutput('Pipeline not found.');
    }

    // Get workflows
    const workflows = await circleci.workflows.getPipelineWorkflows({
      pipelineId: pipeline.id,
    });

    if (workflows.length === 0) {
      return mcpErrorOutput('No workflows found for pipeline.');
    }

    // Get first job from first workflow
    const jobs = await circleci.jobs.getWorkflowJobs({
      workflowId: workflows[0].id,
    });

    if (jobs.length === 0) {
      return mcpErrorOutput('No jobs found in workflow.');
    }

    jobNumber = jobs[0].job_number ?? undefined;
    if (!jobNumber) {
      return mcpErrorOutput('Job number not found.');
    }
  }

  // Fetch job details
  const circleci = getCircleCIClient();
  const jobDetails = await circleci.jobsV1.getJobDetails({
    projectSlug,
    jobNumber,
  });

  // Transform to step metadata
  const steps = jobDetails.steps.flatMap((step, stepIndex) => {
    return step.actions.map((action, actionIndex) => {
      const startTime = action.start_time ? new Date(action.start_time) : null;
      const endTime = action.end_time ? new Date(action.end_time) : null;
      const durationMs = startTime && endTime ? endTime.getTime() - startTime.getTime() : 0;

      // Estimate log size (rough estimate based on output field presence)
      const estimatedBytes = action.has_output ? 50000 : 0; // Conservative estimate

      return {
        stepId: `${action.step}-${action.index}`,
        name: step.name,
        index: stepIndex * 100 + actionIndex, // Ensure unique ordering
        status: action.failed
          ? 'failure'
          : action.canceled
            ? 'canceled'
            : action.status === 'running'
              ? 'running'
              : 'success',
        exitCode: action.exit_code ?? undefined,
        startTime: action.start_time,
        duration: formatDuration(durationMs),
        durationMs,
        logSize: {
          bytes: estimatedBytes,
          estimate: estimateLogSize(estimatedBytes),
        },
        hasLogs: action.has_output,
      };
    });
  });

  const failedSteps = steps.filter((s) => s.status === 'failure').length;

  const metadata = {
    jobName: jobDetails.workflows.job_name,
    jobNumber: jobDetails.build_num,
    steps,
    totalSteps: steps.length,
    failedSteps,
    metadata: {
      pipelineNumber: pipelineNumber ?? 0,
      workflowId: jobDetails.workflows.workflow_id,
      branch: branchFromURL || branch || '',
    },
  };

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(metadata, null, 2),
      },
    ],
  };
};
