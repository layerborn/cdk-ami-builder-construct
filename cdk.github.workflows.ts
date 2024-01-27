import { github } from 'projen';
import { GitHub, GithubWorkflow, GithubWorkflowOptions } from 'projen/lib/github';
import { JobPermission } from 'projen/lib/github/workflows-model';


export interface CustomWorkflowProps extends GithubWorkflowOptions {
  // Define the properties you want to accept
  workflowName: string;

}

export interface CdkGitHubJobProps {
  taskName: string;
  jobName: string;
}

// Let's define our custom workflow
export class CdkRegressionTestsGitHubWorkflowUbuntu {
  public cdkGitHubWorkflow: GithubWorkflow;

  public constructor(project: GitHub, props: CustomWorkflowProps) {
    if (props) {
    }
    this.cdkGitHubWorkflow = new github.GithubWorkflow(project, props.workflowName);
  }

  public createWorkflowJob(jobProps: CdkGitHubJobProps) {
    this.cdkGitHubWorkflow.addJob(jobProps.jobName, {
      runsOn: ['ubuntu-latest'],
      defaults: {
        run: {
          shell: 'bash',
        },
      },
      permissions: {
        idToken: JobPermission.WRITE,
        contents: JobPermission.WRITE,
      },
      steps: [
        {
          name: 'Prepare Commit Hash',
          id: 'prepare_commit_hash',
          run: 'echo ::set-output name=COMMIT_HASH::$(echo ${GITHUB_SHA} | cut -c1-7)',
        },
        {
          name: 'configure aws credentials',
          uses: 'aws-actions/configure-aws-credentials@v3',
          with: {
            'role-to-assume': 'arn:aws:iam::${{ secrets.LBIO_DEV_ACCOUNT_ID }}:role/GitHubActions',
            'role-duration-seconds': 3600,
            'aws-region': '${{ secrets.LBIO_DEV_REGION }}',
            'role-skip-session-tagging': true,
            'role-session-name': '${{ steps.prepare_commit_hash.outputs.prepare_commit_hash.COMMIT_HASH }}',
          },
        },
        {
          name: 'Install Task',
          uses: 'arduino/setup-task@v1',
        },
        {
          uses: 'actions/setup-node@v3',
          with: {
            'node-version': '18.x',
          },
        },
        {
          name: 'install dependencies',
          run: 'npm install --global yarn',
        },
        {
          name: 'Run Task',
          run: `task ${jobProps.taskName}`,
        },
      ],
    });
  }
}
