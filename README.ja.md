# aws-cdk-devops-toolkit<!-- omit in toc -->

日本語 | [English](README.md)

AWS CDK を使用した DevOps 自動化ツールキット。 Lambda 関数、CI/CD パイプライン、AWS での運用のベストプラクティスの例が含まれています。

![banner](/banner.png)

## Table of Contents<!-- omit in toc -->

- [About this Repo](#about-this-repo)
- [主な機能](#主な機能)
- [開始方法](#開始方法)
- [使い方](#使い方)
- [Official Resources](#official-resources)
- [License](#license)

## About this Repo

このリポジトリは、AWS CDKを使用したDevOps自動化ツールキットです。Lambda関数、CI/CDパイプライン、AWSでの運用ベストプラクティスの例を含んでいます。開発者やオペレーションチームがクラウド環境でのワークフローを効率化し、インフラストラクチャをコードとして管理するのに役立つ様々なサンプルとコンストラクトを提供しています。

## 主な機能

- 🚀 Lambda関数の自動デプロイメント
- 🔄 CI/CDパイプラインの構築例
- 🏗 インフラストラクチャのコード化
- ⚙ 運用タスクの自動化サンプル
- 📊 モニタリングとアラートの設定

## 開始方法

1. リポジトリの取得とプロジェクトの初期化

1-1. リポジトリの取得

```sh
git clone https://github.com/ishiharatma/aws-cdk-devops-toolkit.git
cd aws-cdk-devops-toolkit
```

1-2. プロジェクトの初期化

Node.js の必要なライブラリをインストールします。

```sh
# install dependencies
npm ci
```

2. AWS CLI の認証情報を設定する

CDK をデプロイするために AWS 認証情報（API キー）が必要です。ここでは最もシンプルな、恒久的な認証情報を使用する方法を紹介します。

主に開発環境で使用される方法です。AWS CLI プロファイルの例は以下のとおりです

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

## 使い方

```sh
npm run cdk:diff:all -w workspaces/<workspace name> --env=<environment> --project=<project name>
npm run cdk:deploy:all -w workspaces/<workspace name> --env=<environment> --project=<project name>
npm run cdk:destroy:all -w workspaces/<workspace name> --env=<environment> --project=<project name>
```

## Official Resources

AWS CDKに関する公式リソース：

- [Developer Guide](https://docs.aws.amazon.com/cdk/v2/guide/home.html)
- [API Reference](https://docs.aws.amazon.com/cdk/api/v2/docs/aws-construct-library.html)
- [CDK Repository](https://github.com/aws/aws-cdk)
- [CDK Construct Hub](https://constructs.dev/)
- [CDK Workshop](https://cdkworkshop.com/)

## License

このプロジェクトは Apache License 2.0 のもとで公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。
