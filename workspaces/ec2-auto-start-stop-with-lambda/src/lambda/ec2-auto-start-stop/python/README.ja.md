# ec2-auto-start-stop

タグとスケジュールイベントに基づいてEC2インスタンスを自動的に起動・停止するAWS Lambda関数

日本語 | [English](README.md)

## 説明

このLambda関数は、指定された条件に従ってEC2インスタンスの状態を自動的に起動または停止することで管理します。スケジュールされた操作のためにEventBridge（CloudWatch Events）と連携するように設計されています。

主な機能：

- actionパラメータに基づいてEC2インスタンスを自動的に起動または停止
- EC2インスタンスの`autostop` or `autostart`タグをチェックして、管理対象かどうかを判断
- すべてのアクションとスキップされたインスタンスをログに記録し、簡単に監視可能
- EventBridgeを使用してスケジュールに基づいてトリガー可能

## Environment or Paramater

- LOG_LEVEL (オプション)
  - ログレベルを指定します。デフォルトは 'INFO' です。
  - 受け入れ可能な値：INFO, DEBUG, ERROR, WARNING

## 使用方法

1. Lambda関数をAWSアカウントにデプロイします。
2. EventBridgeルールを設定し、希望のスケジュールでLambda関数をトリガーします。
3. EventBridgeルールで、イベントパターンにactionを指定します：
  インスタンスを起動する場合：

  ```json
  {
    "action": "start"
  }
  ```

  インスタンスを停止する場合：

  ```json
  {
    "action": "stop"
  }
  ```

4. この関数で管理したいEC2インスタンスにautostopstartタグを'true'に設定します。

## Test Parameter

関数を手動でテストするには、AWS Lambdaコンソールで以下のテストイベントを使用できます：
インスタンスを起動する場合：

```json
{
  "action": "start"
}
```

インスタンスを停止する場合：

```json
{
  "action": "stop"
}
```

注意：テスト時には、関数の動作を確認するために、適切なタグが設定されたEC2インスタンスがアカウントに存在することを確認してください。
