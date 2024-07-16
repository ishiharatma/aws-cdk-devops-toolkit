import json
import boto3
import logging
from datetime import datetime, timedelta
import os

logger = logging.getLogger()

def setup_logging():
    log_level_str = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logger, log_level_str, logging.INFO)
    logger.setLevel(log_level)
    logger.info(f"Log level set to {log_level_str}")

def send_sns_notification(sns_topic_arn, subject, message):
    """Sends a notification to the specified SNS topic"""
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=sns_topic_arn,
        Message=message,
        Subject=subject,
    )

def lambda_handler(event, context):
    setup_logging()
    try:
        logger.info('start')
        logger.info('event: {}'.format(event))
        # Initialize S3 and SNS clients
        s3 = boto3.client('s3')
        sns = boto3.client('sns')

        # Get environment variables
        bucket_name = os.environ['IP_RECORD_BUCKET_NAME']
        days_threshold = int(os.environ['DAYS_THRESHOLD'])
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']

        # Calculate the threshold date
        threshold_date = datetime.now() - timedelta(days=days_threshold)

        # List all objects in the bucket
        response = s3.list_objects_v2(Bucket=bucket_name)

        notifications = []

        # Process each file in the bucket
        for obj in response.get('Contents', []):
            file_content = s3.get_object(Bucket=bucket_name, Key=obj['Key'])['Body'].read().decode('utf-8')
            ip_data = json.loads(file_content)

            # Check each IP address in the file
            for address in ip_data['Addresses']:
                if address['status'] == 'active':
                    # Check the creation or reactivation date
                    date_to_check = address.get('reactivatedAt', address['createdAt'])
                    ip_date = datetime.fromisoformat(date_to_check)

                    if ip_date <= threshold_date:
                        notifications.append({
                            'ip': address['ipAddress'],
                            'date': date_to_check,
                            'ipset_name': ip_data['ipset_name']
                        })

        # If there are notifications, send them via SNS
        if notifications:
            message = json.dumps({
                'message': f'The following IP addresses have been active for more than {days_threshold} days:',
                'ip_addresses': notifications
            }, indent=2)
            logger.info(message)
            # Send SNS notification if specified
            if sns_topic_arn:
                send_sns_notification(sns_topic_arn, 'IP Address Activity Notification', message)

            logger.info(f"Notification sent for {len(notifications)} IP addresses")
        else:
            logger.info("No IP addresses require notification")

        return {
            'statusCode': 200,
            'body': json.dumps('IP address check completed successfully')
        }
    except Exception as e:
        logger.exception(str(e))
        logger.exception('Error processing file {} from bucket {}. Make sure it exists and your bucket is in the same region as this function.'.format(file_key, bucket_name))
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error updating WAF IP Whitelist',
                'error': str(e)
            })
        }