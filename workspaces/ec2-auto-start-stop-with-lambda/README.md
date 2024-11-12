# ec2-auto-start-stop

[日本語](README.ja.md) | English

EC2 Auto Start , Stop

## Overview

This project is a CDK application for starting and stopping EC2 according to a schedule.

## Architecture

![overview](overview.drawio.svg)

- Lambda Function: Function to start or stop EC2
- EventBridge: Schedule to launch Lambda

## Prerequisites

- Node.js (>= 14.x)
- AWS CDK CLI (>= 2.x)
- AWS CLI (configured)

## Deploy

```sh
npm run cdk:deploy:all --env=dev --project=hogehgoe -w workspaces\ec2-auto-start-stop
```

## Usage

N/A

### Important Notes

Before using this application, ensure that you have an EC2 instance in your account with the appropriate tags.

### Troubleshooting

If you encounter issues, check the following:

- Lambda function logs (in CloudWatch Logs)

## License

This project is released under the Apache License 2.0. See the [LICENSE](../../LICENSE) file for details.
