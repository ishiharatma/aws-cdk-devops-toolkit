# ec2-auto-start-stop

An AWS Lambda function to automatically start and stop EC2 instances based on tags and scheduled events.

[日本語](README.ja.md) | English

## Description

This Lambda function manages the state of EC2 instances by automatically starting or stopping them according to specified conditions. It is designed to work with EventBridge (CloudWatch Events) for scheduled operations.

Key features:

- Automatically starts or stops EC2 instances based on the action parameter
- Checks for the `autostop` or `autostart` tag on EC2 instances to determine if they should be managed
- Logs all actions and skipped instances for easy monitoring
- Can be triggered on a schedule using EventBridge

## Environment or Paramater

- LOG_LEVEL (optional)
  - Specify the log level. Default is 'INFO'.
  - Accepted values: INFO, DEBUG, ERROR, WARNING

## Usage

1. Deploy the Lambda function to your AWS account.
2. Set up an EventBridge rule to trigger the Lambda function on your desired schedule.
3. In the EventBridge rule, specify the action in the event pattern:
  For starting instances:

  ```json
  {
    "action": "start"
  }
  ```

  For stopping instances:

  ```json
  {
    "action": "stop"
  }
  ```

4. Ensure your EC2 instances have the autostopstart tag set to 'true' for the instances you want to be managed by this function.

## Test Parameter

To test the function manually, you can use the following test events in the AWS Lambda console:
For starting instances:

```json
{
  "action": "start"
}
```

For stopping instances:

```json
{
  "action": "stop"
}
```

Note: When testing, ensure you have EC2 instances with the appropriate tags in your account to see the function in action.