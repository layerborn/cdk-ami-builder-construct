### Cross Account Distribution

https://docs.aws.amazon.com/imagebuilder/latest/userguide/cross-account-dist.html

### Cross Account Distribution

Currently, AMI distribution is supported automatically via sharing with other accounts.
In order to set up the distribution in Image Pipeline, that would need to be done manually currently.

### Sharing AMIs with other accounts

https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/sharingamis-explicit.html

Provide the account ID of the accounts you wish to share and the following things will happen:

- The account will be able to see the AMI in the console
- The account will be able to launch an instance from the AMI (KMS Grant will be created automatically)
- The account will be able to copy the AMI to their account (KMS Grant will be created automatically)
