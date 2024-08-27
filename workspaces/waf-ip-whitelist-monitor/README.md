# waf-ip-whitelist-monitor

[日本語](README.ja.md) | English

## Overview

This project is a CDK application for inventorying IP addresses in conjunction with waf-ip-whitelist-auto-updater, which automatically updates the AWS WAF IP set (whitelist). Read and check the IP set registration result file stored in the S3 bucket.

## Architecture

![overview](overview.drawio.svg)

- Lambda Function: Triggered by EventBridge, check the registered contents of the WAF IP set
- EventBridge:　Schedule to launch Lambda

## Prerequisites

- Node.js (>= 14.x)
- AWS CDK CLI (>= 2.x)
- AWS CLI (configured)

## deploy

```sh
npm run cdk:deploy:all --env=dev --project=hogehgoe -w workspaces\waf-ip-whitelist-monitor
```

## Usage

N/A

### Troubleshooting

If you encounter issues, check the following:

- Upload permissions for the S3 bucket
- Lambda function logs (in CloudWatch Logs)
- Existence of the WAF IP set and accuracy of the specified ID

## License

This project is released under the Apache License 2.0. See the [LICENSE](../../LICENSE) file for details.
