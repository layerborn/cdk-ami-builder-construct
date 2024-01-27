import { App, Stack } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { ImagePipeline } from '../src';

describe('Image Building Tests', () => {


  test('ImageBuildingSimpleTest', () => {
    const app = new App();
    const testStack = new Stack(app, 'TestStack',
      {
        env: {
          account: process.env.AWS_ACCOUNT,
          region: process.env.AWS_REGION,
        },
      });
    const vpc = new Vpc(testStack, 'Vpc', {
      ipAddresses: IpAddresses.cidr('17.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
      natGateways: 1,
    });

    new ImagePipeline(testStack, 'ImagePipelineTest', {
      parentImage: 'ami-09694bfab577e90b0',
      vpc: vpc,
      components: [
        {
          name: 'TestComponent',
          description: 'Test Component',
          componentVersion: '1.0.0',
          platform: 'Linux',
          componentDocument: {
            name: 'TestComponent',
            description: 'Test Component',
            schemaVersion: '1.0',
            phases: [{
              name: 'build',
              steps: [
                {
                  name: 'hello',
                  action: 'ExecuteBash',
                  inputs: {
                    commands: [
                      'echo "Hello World"',
                    ],
                  },
                },
              ],
            }],
          },
        },
      ],
    });

    const template = Template.fromStack(testStack);
    expect(template.toJSON()).toMatchSnapshot();
  });
});
