# waf-ip-whitelist-monitor

WAF IP ホワイトリストモニター

[English](README.md) | 日本語

## 説明

この Lambda 関数は、AWS WAF の IP セット内の IP アドレスを監視し、長期間アクティブな IP アドレスに関する通知を送信します。waf-ip-whitelist-auto-updater と連携して動作し、WAF IP ホワイトリストの包括的な管理と監視を提供します。

主な機能：

- 指定された S3 バケットから IP アドレスの記録を読み取り
- 指定された閾値を超えてアクティブな IP アドレスを識別
- 活動閾値を超える IP アドレスについて Amazon SNS を通じて通知を送信
- IPv4 および IPv6 アドレスをサポート
- 異なる 複数の IP セットに対応

この関数は、長期間アクティブな IP アドレスを通知することで、WAF IP ホワイトリストのセキュリティと適切性を維持するのに役立つように設計されています。

## 環境変数

- IP_RECORD_BUCKET_NAME
  - IP アドレスの記録が保存されている S3 バケットの名前を指定します。これは waf-ip-whitelist-auto-updater が IP アドレス履歴の保存に使用するバケットと同じである必要があります。
- DAYS_THRESHOLD
  - アクティブな IP アドレスが通知をトリガーするまでの日数を指定します。例えば、30 に設定すると、30 日以上アクティブな IP アドレスが報告されます。
- SNS_TOPIC_ARN
  - 通知を送信する SNS トピックの ARN。
- LOG_LEVEL (オプション)
  - ログレベルを指定します。デフォルトは 'INFO' です。
  - 受け入れ可能な値：INFO, DEBUG, ERROR, WARNING

## 使用方法

この Lambda 関数は、長期間アクティブな IP アドレスを定期的にチェックするために、スケジュールに基づいて実行するように設計されています（例：毎日）。希望する間隔でこの関数をトリガーするように CloudWatch Events ルールを設定してください。

関数は指定された S3 バケット内のすべての JSON ファイルを読み取り、各 IP アドレスのアクティブ期間をチェックし、指定された閾値を超える IP アドレスがある場合は SNS を通じて通知を送信します。

## SNS 通知フォーマット

関数は以下の JSON 形式で通知を送信します：

```json
{
  "message": "以下の IP アドレスが X 日以上アクティブです：",
  "ip_addresses": [
    {
      "ip": "203.0.113.10",
      "date": "2023-05-15T08:30:00",
      "ipset_name": "MyWebAppWhitelist"
    },
    ...
  ]
}
```

## 権限

この Lambda 関数には以下の権限が必要です：

IP_RECORD_BUCKET_NAME に対する s3:ListBucket および s3:GetObject
指定された SNS トピックに対する sns:Publish

Lambda 実行ロールにこれらの権限があることを確認してください。
