import { awscdk } from 'projen';
import { NpmAccess } from 'projen/lib/javascript';
import { CdkRegressionTestsGitHubWorkflowUbuntu } from './cdk.github.workflows';


const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Jayson Rawlins',
  description: 'Creates an EC2 AMI using an Image Builder Pipeline and returns the AMI ID.',
  authorAddress: 'jayson.rawlins@layerborn.io',
  packageName: '@layerborn/cdk-ami-builder',
  minNodeVersion: '18.0.0',
  cdkVersion: '2.100.0',
  constructsVersion: '10.1.203',
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
  },
  defaultReleaseBranch: 'main',
  projenVersion: '^0.71.34',
  license: 'Apache-2.0',
  jsiiVersion: '~5.0.0',
  name: '@layerborn/cdk-ami-builder',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/layerborn/cdk-ami-builder-construct.git',
  depsUpgrade: true,
  workflowBootstrapSteps: [
    {
      name: 'Prepare Commit Hash',
      id: 'prepare_commit_hash',
      run: 'echo ::set-output name=COMMIT_HASH::$(echo ${GITHUB_SHA} | cut -c1-7)',
    },
    {
      name: 'configure aws credentials',
      uses: 'aws-actions/configure-aws-credentials@v13',
      with: {
        'role-to-assume': 'arn:aws:iam::${{ secrets.LBIO_DEV_ACCOUNT_ID }}:role/GitHubActions',
        'role-duration-seconds': 900,
        'aws-region': '${{ secrets.LBIO_DEV_REGION }}',
        'role-skip-session-tagging': true,
        'role-session-name': '${{ steps.prepare_commit_has.outputs.commit_hash }}',
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
      name: 'Authenticate with private NPM package',
      run: 'echo "//registry.npmjs.org/:_authToken=${{ secrets.NPM_TOKEN }}" > ~/.npmrc',
    },
  ],
  githubOptions: {
    mergify: true,
    mergifyOptions: {},
  },
  deps: [
    'cdk-iam-floyd',
    '@layerborn/cdk-git-tagger',
    'aws-cdk-lib@^2.100.0',
    '@matthewbonig/state-machine',
    '@types/node@^18',
    'crypto-js',
  ],
  devDeps: [
    'aws-cdk-lib@^2.100.0',
    'aws-cdk@^2.100.0',
    '@types/js-yaml',
    '@types/lodash.merge',
    '@types/crypto-js',
    '@types/node@^18',
  ],

  bundledDeps: [
    '@aws-sdk/client-sqs',
    '@aws-sdk/client-ec2',
    '@aws-sdk/client-ssm',
    '@aws-sdk/client-sns',
    '@aws-sdk/client-ecs',
    '@aws-sdk/client-kms',
    '@aws-sdk/client-s3',
    '@aws-sdk/client-secrets-manager',
    '@aws-sdk/client-sfn',
    '@types/node@^18',
    '@types/aws-lambda',
    '@types/js-yaml',
    'js-yaml',
    'lodash.merge',
    '@types/crypto-js',
    'crypto-js',
  ],
  tsconfig: {
    compilerOptions: {
      target: 'ES2019',
      rootDir: '.',
    },
    include: [
      'cdk.github.workflows.ts',
      'src/**/*',
      'test/**/*',
      '.projenrc.ts',
    ],
  },
  tsconfigDev: {
    include: [
      'cdk.github.workflows.ts',
      'src/**/*.ts',
      'test/**/*.ts',
      'bin/**/*.ts',
    ],
    exclude: [],
    compilerOptions: {
      rootDir: '.',
      lib: ['es2019', 'DOM'],
      esModuleInterop: true,
    },
  },
  gitignore: [
    'cdk.out',
    'cdk.out/*',
    'assets',
    'cdk.context.json',
    'tsconfig.json',
    '.dccache',
  ],
  npmAccess: NpmAccess.PUBLIC,
  releaseToNpm: true,
  publishToPypi: {
    distName: 'layerborn.cdk-ami-builder',
    module: 'layerborn.cdk_ami_builder',
  },
});

project.eslint!.allowDevDeps('./cdk.github.workflows.ts');

const regressionTests = new CdkRegressionTestsGitHubWorkflowUbuntu(project.github!, {
  workflowName: 'regression',
});

regressionTests.cdkGitHubWorkflow.on({
  workflowDispatch: {
    inputs: {
      deployment: {
        type: 'choice',
        description: 'Start Regression Tests',
        required: true,
        options: [
          'TestStackDistribution',
        ],
      },
    },
  },
});

regressionTests.createWorkflowJob({
  jobName: 'TestStackDistribution',
  taskName: 'Full-Regression-TestStack-Distribution',
});

project.github!.tryFindWorkflow('build')!.file!.addOverride('jobs.build.permissions.id-token', 'write');
project.github!.tryFindWorkflow('upgrade-main')!.file!.addOverride('jobs.upgrade.permissions.id-token', 'write');

project.synth();
