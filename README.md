# aws-cdk-devops-toolkit<!-- omit in toc -->

[日本語](README.ja.md) | English

DevOps automation toolkit using AWS CDK. Includes examples for Lambda functions, CI/CD pipelines, and operational best practices on AWS.

![banner](/banner.png)

## Table of Contents<!-- omit in toc -->

- [About this Repo](#about-this-repo)
- [Key Features](#key-features)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Official Resources](#official-resources)
- [License](#license)

## About this Repo

This repository is a DevOps automation toolkit using AWS CDK. It includes examples for Lambda functions, CI/CD pipelines, and operational best practices on AWS. The toolkit provides various samples and constructs to help developers and operations teams streamline their workflows in cloud environments and manage infrastructure as code.

## Key Features

- 🚀 Automated deployment of Lambda functions
- 🔄 CI/CD pipeline construction examples
- 🏗 Infrastructure as Code implementations
- ⚙ Automation samples for operational tasks

## Getting Started

1. Checkout the repository and initialize the project

1-1. Checkout a repository

```sh
git clone https://github.com/ishiharatma/aws-cdk-devops-toolkit.git
cd aws-cdk-devops-toolkit
```

1-2. Initializing a project

Install the required libraries for Node.js.

```sh
# install dependencies
npm ci
```

2. Set your AWS CLI credentials

AWS credentials (API keys) are required to deploy the CDK. Here's the simplest way to use permanent credentials.

This method is mainly used in development environments. An example AWS CLI profile is below.

~/.aws/credentials

```text
[<project name>-<environment>-accesskey]
aws_access_key_id = XXXXXXXXXXXXXXX
aws_secret_access_key = YYYYYYYYYYYYYY
region = ap-northeast-1

[<project name>-<environment>]
region = ap-northeast-1
role_arn = arn:aws:iam::123456789012:role/<role name>
mfa_serial = arn:aws:iam::123456789012:mfa/<username>
source_profile=<project name>-<environment>-accesskey
```

## Usage

```sh
npm run cdk:diff:all -w workspaces/<workspace name> --env=<environment> --project=<project name>
npm run cdk:deploy:all -w workspaces/<workspace name> --env=<environment> --project=<project name>
npm run cdk:destroy:all -w workspaces/<workspace name> --env=<environment> --project=<project name>
```

## Official Resources

Official resources for AWS CDK:

- [Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [API Reference](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
- [CDK Repository](https://github.com/aws/aws-cdk)
- [CDK Construct Hub](https://constructs.dev/)
- [CDK Workshop](https://cdkworkshop.com/)

## License

This project is released under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.
