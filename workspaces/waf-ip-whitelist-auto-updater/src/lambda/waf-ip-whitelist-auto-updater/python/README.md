# ec2-auto-start-stop

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
- Maintains a historical record of IP address changes, including additions, deletions, and reactivations
- Stores IP address change history in a separate S3 bucket for auditing and tracking purposes

This function is designed to work with WAF rules associated with CloudFront or regionally.

## Environment or Paramater

- LOG_LEVEL (optional)
  - Specify the log level. Default is 'INFO'.
  - Accepted values: INFO, DEBUG, ERROR, WARNING
- IP_RECORD_BUCKET_NAME (optional)
  - Specifies the name of the S3 bucket where the IP address change history will be stored. This bucket is used to maintain a record of all additions, deletions, and reactivations of IP addresses in the WAF IP set. If this environment variable is not set, the IP address history tracking feature will be disabled.

## Usage

Upload a JSON file to the configured S3 bucket with the following structure:

```json
{
    "ipSetName": "YourIPSetName",
    "ipSetId": "YourIPSetId",
    "isCloudFront": false,
    "scope": "CLOUDFRONT", // or "REGIONAL"
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
    "scope": "CLOUDFRONT", // or "REGIONAL"
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

## IP Address History JSON

The Lambda function stores the IP address change history in a separate S3 bucket specified by the IP_RECORD_BUCKET_NAME environment variable. The JSON file stored in this bucket has the following structure:

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

This JSON file contains the following information for each IP address:

- ipAddress: The IP address or CIDR range
- createdAt: The timestamp when the IP address was first added
- status: The current status of the IP address ("active" or "deleted")
- deletedAt: The timestamp when the IP address was deleted (if applicable)
- reactivatedAt: The timestamp when a previously deleted IP address was reactivated (if applicable)

This historical record allows for easy auditing and tracking of changes to the WAF IP whitelist over time.
