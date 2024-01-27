import { aws_ec2 as ec2, CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { IpAddresses, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { ImagePipeline } from '../ImagePipeline/ImagePipeline';

/**
 * Represents the properties for the ImageBuilderTestStack class.
 * @interface
 * extends StackProps
 * @property {string} vpcCidr - The CIDR block for the VPC.
 * @property {string} version - The version of the image recipe to use.
 * @property {string[]} distributionAccountIds - The account IDs of the accounts that will receive the image.
 * @property {string[]} distributionRegions - The regions of the accounts that will receive the image.
 */
export interface ImageBuilderTestStackProps extends StackProps {
  distributionKmsKeyAlias?: string;
  debugImagePipeline?: boolean;
  vpcCidr: string;
  version?: string;
  distributionAccountIds?: string[];
  distributionRegions?: string[]; // Default is us-east-2
}

/**
 * Represents a CloudFormation stack for creating an image builder test pipeline.
 */
export class ImageBuilderTestStack extends Stack {
  constructor(
    scope: Construct,
    id: string,
    props: ImageBuilderTestStackProps,
  ) {
    super(scope, id, props);

    const vpc = new Vpc(this, 'Vpc', {
      ipAddresses: IpAddresses.cidr(props.vpcCidr as string),
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

    const image = ec2.MachineImage.lookup({
      name: 'ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*',
      owners: ['099720109477'],
    });

    const version = props.version ?? '0.0.8';

    const imagePipeline = new ImagePipeline(this, 'ImagePipeline', {
      parentImage: image.getImage(this).imageId,
      vpc: vpc,
      imageRecipeVersion: version,
      ebsVolumeConfigurations: [
        {
          deviceName: '/dev/sda1',
          ebs: {
            encrypted: true,
            volumeSize: 30,
            volumeType: 'gp3',
          },
        },
      ],
      components: [
        {
          name: 'Install-Monitoring',
          platform: 'Linux',
          componentDocument: {
            phases: [{
              name: 'build',
              steps: [
                {
                  name: 'Install-CloudWatch-Agent',
                  action: 'ExecuteBash',
                  inputs: {
                    commands: [
                      'apt-get update',
                      'DEBIAN_FRONTEND=noninteractive apt-get install -y g++ make cmake unzip libcur14-openssl-dev',
                      'DEBIAN_FRONTEND=noninteractive apt-get install -y curl sudo jq bash zip unzip iptables software-properties-common ca-certificates',
                      'curl -sfLo /tmp/amazon-cloudwatch-agent.deb https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb',
                      'dpkg -i -E /tmp/amazon-cloudwatch-agent.deb',
                      'rm /tmp/amazon-cloudwatch-agent.deb',
                    ],
                  },
                },
              ],
            }],
          },
        },
      ],
      distributionAccountIds: props.distributionAccountIds,
      distributionRegions: props.distributionRegions,
      debugImagePipeline: props.debugImagePipeline,
      distributionKmsKeyAlias: props.distributionKmsKeyAlias,
    });

    new CfnOutput(this, `ImageId-${this.stackName}`, {
      value: imagePipeline.imageId,
      description: 'The AMI ID of the image created by the pipeline',
    });

    new CfnOutput(this, 'DistributionAccountIds', {
      value: (props.distributionAccountIds ?? []).join(','),
      description: 'The account IDs of the accounts that will receive the image.',
    });

    new CfnOutput(this, 'DistributionRegions', {
      value: (props.distributionRegions ?? []).join(','),
      description: 'The regions of the accounts that will receive the image.',
    });

    /// return an AMI ID that can be used to launch an instance of this image
  }
}
