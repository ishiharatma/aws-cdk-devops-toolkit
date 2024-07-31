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
- IP アドレスの追加、削除、再有効化を含む変更履歴を維持
- 監査とトラッキングのために、IP アドレスの変更履歴を別の S3 バケットに保存

この関数は CloudFrontまたはリージョナル に関連付けられた WAF ルールで動作するように設計されています。

## Environment or Paramater

- LOG_LEVEL (オプション)
  - ログレベルを指定します。デフォルトは 'INFO' です。
  - 受け入れ可能な値：INFO, DEBUG, ERROR, WARNING
- IP_RECORD_BUCKET_NAME (オプション)
  - WAF IP セットの IP アドレス変更履歴を保存する S3 バケットの名前を指定します。このバケットは、IP アドレスの追加、削除、再有効化のすべての記録を保持するために使用されます。この環境変数が設定されていない場合、IP アドレス履歴の追跡機能は無効になります。

## 使用方法

以下の構造を持つ JSON ファイルを設定済みの S3 バケットにアップロードしてください：

```json
{
    "ipSetName": "IPセット名",
    "ipSetId": "IPセットID",
    "scope": "CLOUDFRONT", // または "REGIONAL"
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
    "scope": "CLOUDFRONT", // または "REGIONAL"
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

## IPアドレス履歴JSON

Lambda関数は、IP_RECORD_BUCKET_NAME環境変数で指定された別のS3バケットにIPアドレス変更履歴を保存します。このバケットに保存されるJSONファイルは以下の構造を持ちます：

```json
{
  "ipset_name": "MyIPSet",
  "ipset_id": "abcd1234-a123-456a-a12b-a123b456c789",
  "Addresses": [
    {
      "ipAddress": "10.0.0.0/24",
      "createdAt": "2024-04-26T06:25:47.344Z",
      "status": "active"
    },
    {
      "ipAddress": "192.168.1.0/24",
      "createdAt": "2024-04-26T06:25:47.344Z",
      "status": "active"
    },
    {
      "ipAddress": "172.16.0.0/16",
      "createdAt": "2024-04-25T10:15:30.123Z",
      "status": "deleted",
      "deletedAt": "2024-04-26T06:25:47.344Z"
    },
    {
      "ipAddress": "203.0.113.0/24",
      "createdAt": "2024-04-24T08:30:00.000Z",
      "status": "active",
      "reactivatedAt": "2024-04-26T06:25:47.344Z"
    }
  ]
}
```

このJSONファイルには、各IPアドレスに対して以下の情報が含まれます：

- ipAddress: IPアドレスまたはCIDR範囲
- createdAt: IPアドレスが最初に追加されたタイムスタンプ
- status: IPアドレスの現在のステータス（"active"または"deleted"）
- deletedAt: IPアドレスが削除されたタイムスタンプ（該当する場合）
- reactivatedAt: 以前に削除されたIPアドレスが再有効化されたタイムスタンプ（該当する場合）

この履歴記録により、WAF IPホワイトリストの変更を時間の経過とともに簡単に監査およびトラッキングすることができます。