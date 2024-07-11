# waf-ip-whitelist-auto-updater

WAF IP Whitelist Auto Updater

[日本語](README.ja.md) | English

## Description

This Lambda function automatically updates the IP whitelist (IP set) of AWS WAF based on a JSON configuration file uploaded to an S3 bucket. It provides a flexible and secure way to manage allowed IP addresses for your AWS WAF rules.

Key features:

- Automatically updates WAF IP set when a new configuration file is uploaded to S3
- Supports both IPv4 and IPv6 address ranges
- Includes a debug mode for testing changes without applying them
- Optional SNS notifications for update results
- Logs detailed information about changes and operations

This function is designed to work with WAF rules associated with CloudFront or regionally.

## Environment or Paramater

- LOG_LEVEL
  - Specify the log level. Default is 'INFO'.
  - INFO, DEBUG, ERROR, WARNING

## Usage

Upload a JSON file to the configured S3 bucket with the following structure:

```json
{
    "ipSetName": "YourIPSetName",
    "ipSetId": "YourIPSetId",
    "isCloudFront": false,
    "region": "CLOUDFRONT", // or "REGIONAL"
    "region": "ap-northeast-1",  // Used when cope is "REGIONAL"
    "allowedIpAddressRanges": ["10.0.0.0/24", "192.168.1.0/24"],
    "isDebug": false,
    "snsTopicArn": "arn:aws:sns:region:account-id:topic-name"
}
Or
{
    "ipSetName": "YourIPSetName",
    "ipSetId": "YourIPSetId",
    "isCloudFront": false,
    "region": "CLOUDFRONT", // or "REGIONAL"
    "region": "ap-northeast-1",  // Used when cope is "REGIONAL"
    "allowedIpAddressRanges": [
      "0000:0000:0000:0000:0000:0000:0000:0000/1",
      "8000:0000:0000:0000:0000:0000:0000:0000/1"
    ],
    "isDebug": false,
    "snsTopicArn": "arn:aws:sns:region:account-id:topic-name"
}
```

## Test Parameter

If you want to run a Lambda test event, please specify the following event JSON:

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