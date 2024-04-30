import { awscdk, github } from 'projen';
import { GithubCredentials } from 'projen/lib/github';
import { NpmAccess } from 'projen/lib/javascript';


const cdkVersion = '2.130.0';
const minNodeVersion = '18.0.0';
const constructsVersion = '10.3.0';
const projenVersion = '^0.71.34';
const jsiiVersion = '~5.0.0';

const project = new awscdk.AwsCdkConstructLibrary({
  author: 'Jayson Rawlins',
  description: 'Creates an EC2 AMI using an Image Builder Pipeline and returns the AMI ID.',
  keywords: ['ami', 'imagebuilder', 'image builder', 'ec2'],
  authorAddress: 'jayson.rawlins@layerborn.io',
  packageName: '@layerborn/cdk-ami-builder',
  minNodeVersion: minNodeVersion,
  cdkVersion: cdkVersion,
  constructsVersion: constructsVersion,
  lambdaOptions: {
    runtime: awscdk.LambdaRuntime.NODEJS_18_X,
  },
  defaultReleaseBranch: 'main',
  projenVersion: projenVersion,
  license: 'Apache-2.0',
  jsiiVersion: jsiiVersion,
  name: '@layerborn/cdk-ami-builder',
  projenrcTs: true,
  repositoryUrl: 'https://github.com/layerborn/cdk-ami-builder-construct.git',
  workflowBootstrapSteps: [
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
        'role-duration-seconds': 900,
        'aws-region': '${{ secrets.LBIO_DEV_REGION }}',
        'role-skip-session-tagging': true,
        'role-session-name': '${{ steps.prepare_commit_hash.outputs.COMMIT_HASH }}',
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
    pullRequestLint: false,
    projenCredentials: GithubCredentials.fromApp({
      permissions: {
        pullRequests: github.workflows.AppPermission.WRITE,
        contents: github.workflows.AppPermission.WRITE,
        workflows: github.workflows.AppPermission.WRITE,
      },
    }),
  },
  depsUpgrade: true,
  depsUpgradeOptions: {
    workflowOptions: {
      projenCredentials: GithubCredentials.fromApp({
        permissions: {
          pullRequests: github.workflows.AppPermission.WRITE,
          contents: github.workflows.AppPermission.WRITE,
          workflows: github.workflows.AppPermission.WRITE,
        },
      }),
    },
  },
  deps: [
    `aws-cdk-lib@^${cdkVersion}`,
    '@types/node@^18',
    'crypto-js',
    '@layerborn/cdk-iam-policy-builder-helper@^0.0.4',
  ],
  devDeps: [
    `aws-cdk-lib@^${cdkVersion}`,
    `aws-cdk@^${cdkVersion}`,
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
  publishToGo: {
    moduleName: 'github.com/layerborn/cdk-ami-builder-construct',
  },
});

project.github!.tryFindWorkflow('build')!.file!.addOverride('jobs.build.permissions.id-token', 'write');
project.github!.tryFindWorkflow('build')!.file!.addOverride('jobs.package-js.permissions.id-token', 'write');
project.github!.tryFindWorkflow('build')!.file!.addOverride('jobs.package-python.permissions.id-token', 'write');
project.github!.tryFindWorkflow('build')!.file!.addOverride('jobs.release_go.permissions.id-token', 'write');
project.github!.tryFindWorkflow('upgrade-main')!.file!.addOverride('jobs.upgrade.permissions.id-token', 'write');
project.github!.tryFindWorkflow('release')!.file!.addOverride('jobs.release.permissions.id-token', 'write');
project.github!.tryFindWorkflow('release')!.file!.addOverride('jobs.release_github.permissions.id-token', 'write');
project.github!.tryFindWorkflow('release')!.file!.addOverride('jobs.release_npm.permissions.id-token', 'write');
project.github!.tryFindWorkflow('release')!.file!.addOverride('jobs.release_pypi.permissions.id-token', 'write');
project.github!.tryFindWorkflow('release')!.file!.addOverride('jobs.release_golang.permissions.id-token', 'write');

project.postCompileTask.exec('rm tsconfig.json');


project.synth();
