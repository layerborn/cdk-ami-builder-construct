import { App } from 'aws-cdk-lib';

import { ImageBuilderTestStack } from '../src/TestStacks/ImageBuilderTestStack';

const app = new App();

new ImageBuilderTestStack(app, 'ImageBuildTestStack', {
  vpcCidr: '12.0.0.0/16',
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
});


new ImageBuilderTestStack(app, 'ImageBuildShareImagesTestStack', {
  vpcCidr: '13.0.0.0/16',
  env: {
    account: process.env.AWS_ACCOUNT,
    region: process.env.AWS_REGION,
  },
  distributionAccountIds: process.env.DISTRIBUTION_ACCOUNT_IDS?.split(','),
  distributionRegions: process.env.DISTRIBUTION_REGIONS?.split(','),
  distributionKmsKeyAlias: 'alias/ec2-image-builder',
  version: '0.0.20',
  debugImagePipeline: true,
});

app.synth();

