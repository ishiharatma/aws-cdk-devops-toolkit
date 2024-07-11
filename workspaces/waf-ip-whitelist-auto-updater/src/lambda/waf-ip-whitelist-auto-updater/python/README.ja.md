# waf-ip-whitelist-auto-updater

WAF IP ホワイトリスト自動更新ツール

日本語 | [English](README.md)

## 説明

この Lambda 関数は、S3 バケットにアップロードされた JSON 設定ファイルに基づいて、AWS WAF の IP ホワイトリスト（IP セット）を自動的に更新します。AWS WAF ルールに対する許可 IP アドレスを柔軟かつ安全に管理する方法を提供します。

主な機能：

- S3 に新しい設定ファイルがアップロードされたときに WAF の IP セットを自動更新
- IPv4 および IPv6 アドレス範囲をサポート
- 変更を適用せずにテストするためのデバッグモードを搭載
- 更新結果のオプションの SNS 通知機能
- 変更や操作に関する詳細な情報をログに記録

この関数は CloudFrontまたはリージョナル に関連付けられた WAF ルールで動作するように設計されています。

## Environment or Paramater

- LOG_LEVEL
  - ログレベルを指定します。デフォルトは 'INFO'です。
  - INFO, DEBUG, ERROR, WARNING

## 使用方法

以下の構造を持つ JSON ファイルを設定済みの S3 バケットにアップロードしてください：

```json
{
    "ipSetName": "IPセット名",
    "ipSetId": "IPセットID",
    "region": "CLOUDFRONT", // または "REGIONAL"
    "region": "ap-northeast-1",  // scope が "REGIONAL" の場合に使用
    "allowedIpAddressRanges": ["10.0.0.0/24", "192.168.1.0/24"],
    "isDebug": false,
    "snsTopicArn": "arn:aws:sns:リージョン:アカウントID:トピック名"
}
Or
{
    "ipSetName": "YourIPSetName",
    "ipSetId": "YourIPSetId",
    "isCloudFront": false,
    "region": "CLOUDFRONT", // または "REGIONAL"
    "region": "ap-northeast-1",  // scope が "REGIONAL" の場合に使用
    "allowedIpAddressRanges": [
      "0000:0000:0000:0000:0000:0000:0000:0000/1",
      "8000:0000:0000:0000:0000:0000:0000:0000/1"
    ],
    "isDebug": false,
    "snsTopicArn": "arn:aws:sns:region:account-id:topic-name"
}
```

## Test Parameter

Lambdaのテストイベントを実行する場合は、次のイベントJSONを指定してください：

```json
{
  "Records": [
    {
      "eventVersion": "2.1",
      "eventSource": "aws:s3",
      "awsRegion": "ap-northeast-1",
      "eventTime": "2024-04-26T06:25:47.344Z",
      "eventName": "ObjectCreated:Put",
      "s3": {
        "s3SchemaVersion": "1.0",
        "configurationId": "put",
        "bucket": {
          "name": "<bucket name>",
          "arn": "arn:aws:s3:::<bucket name>"
        },
        "object": {
          "key": "inputfile.json"
        }
      }
    }
  ]
}
```
