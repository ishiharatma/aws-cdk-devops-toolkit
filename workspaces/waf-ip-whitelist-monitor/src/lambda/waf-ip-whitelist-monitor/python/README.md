# waf-ip-whitelist-monitor

WAF IP Whitelist Monitor
[日本語](README.ja.md) | English

## Description

This Lambda function monitors the IP addresses in AWS WAF IP sets and sends notifications for IP addresses that have been active for an extended period. It works in conjunction with the waf-ip-whitelist-auto-updater to provide comprehensive management and monitoring of your WAF IP whitelist.

Key features:

- Reads IP address records from a specified S3 bucket
- Identifies IP addresses that have been active beyond a specified threshold
- Sends notifications via Amazon SNS for IP addresses exceeding the activity threshold
- Supports both IPv4 and IPv6 addresses
- Works with multiple IP sets across different WAF configurations

This function is designed to help maintain the security and relevance of your WAF IP whitelist by alerting you to long-term active IP addresses that may require review.

## Environment Variables

- IP_RECORD_BUCKET_NAME
  - Specifies the name of the S3 bucket where the IP address records are stored. This should be the same bucket used by the waf-ip-whitelist-auto-updater for storing IP address history.
- DAYS_THRESHOLD
  - Specifies the number of days after which an active IP address should trigger a notification. For example, if set to 30, IP addresses active for more than 30 days will be reported.
- SNS_TOPIC_ARN
  - The ARN of the SNS topic where notifications should be sent.
- LOG_LEVEL (optional)
  - Specify the log level. Default is 'INFO'.
  - Accepted values: INFO, DEBUG, ERROR, WARNING

## Usage

This Lambda function is designed to run on a schedule (e.g., daily) to regularly check for long-term active IP addresses. Set up a CloudWatch Events rule to trigger this function at your desired interval.

The function will read all JSON files in the specified S3 bucket, check the activity duration of each IP address, and send a notification via SNS if any IP addresses exceed the specified threshold.

## SNS Notification Format

The function sends notifications in the following JSON format:

```json
{
  "message": "The following IP addresses have been active for more than X days:",
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

## Permissions

This Lambda function requires the following permissions:

s3:ListBucket and s3:GetObject on the IP_RECORD_BUCKET_NAME
sns:Publish on the specified SNS topic

Ensure that the Lambda execution role has these permissions.
