import os
import json
import boto3
import logging
import traceback

logger = logging.getLogger()

def setup_logging():
    log_level_str = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logger, log_level_str, logging.INFO)
    logger.setLevel(log_level)
    logger.info(f"Log level set to {log_level_str}")

def lambda_handler(event, context):
    setup_logging()
    try:
        logger.info('start')
        logger.info('event: {}'.format(event))
        # Get event parameter from EventBridge
        action = event.get('action', '').lower()
        
        if action not in ['start', 'stop']:
            logger.error(f"Invalid action: {action}. Must be 'start' or 'stop'.")
            return {
                'statusCode': 400,
                'body': f"Invalid action: {action}. Must be 'start' or 'stop'."
            }

        # Initialize EC2 client
        ec2 = boto3.client('ec2')
        # List to store processing results
        results = []
        # Get all instances
        instances = ec2.describe_instances()

        for reservation in instances['Reservations']:
            for instance in reservation['Instances']:
                instance_id = instance['InstanceId']
                state = instance['State']['Name']
                
                # Check tags
                tags = instance.get('Tags', [])
                tag_name = 'auto{}'.format(action)
                auto_start_stop = None
                for tag in tags:
                    if tag['Key'] == tag_name:
                        auto_start_stop = tag['Value'].lower()
                        break
                if auto_start_stop == 'true':
                    if action == 'start' and state == 'stopped':
                        ec2.start_instances(InstanceIds=[instance_id])
                        message = f"Starting instance {instance_id}"
                        logger.info(message)
                        results.append(message)
                    elif action == 'stop' and state == 'running':
                        ec2.stop_instances(InstanceIds=[instance_id])
                        message = f"Stopping instance {instance_id}"
                        logger.info(message)
                        results.append(message)
                    elif action == 'start' and state == 'running':
                        message = f"Instance {instance_id} is already running"
                        logger.info(message)
                        results.append(message)
                    elif action == 'stop' and state == 'stopped':
                        message = f"Instance {instance_id} is already stopped"
                        logger.info(message)
                        results.append(message)
                elif auto_start_stop == 'false':
                    message = f"Instance {instance_id} has autostopstart set to false. Skipping."
                    logger.info(message)
                    results.append(message)
                elif auto_start_stop is not None:
                    message = f"Instance {instance_id} has invalid autostopstart value: {auto_start_stop}. Skipping."
                    logger.warning(message)
                    results.append(message)

        # SNS notification processing
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if sns_topic_arn:
            sns_client = boto3.client('sns')
            message = f"EC2 Auto Start/Stop Results:\n\n" + "\n".join(results)
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject=f"EC2 Auto Start/Stop {action.capitalize()} Operation Results",
                Message=message
            )
            logger.info(f"Notification sent to SNS topic: {sns_topic_arn}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f"EC2 instances {action} operation completed",
                'results': results
            })
        }
    except Exception as e:
        error_msg = f"An unexpected error occurred: {str(e)}"
        stack_trace = traceback.format_exc()
        logger.error(f"{error_msg}\n{stack_trace}")
        # Sends SNS notifications even if an error occurs
        sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
        if sns_topic_arn:
            sns_client = boto3.client('sns')
            sns_client.publish(
                TopicArn=sns_topic_arn,
                Subject=f"EC2 Auto Start/Stop Error",
                Message=f"{error_msg}\n\nStack Trace:\n{stack_trace}"
            )
            logger.info(f"Error notification sent to SNS topic: {sns_topic_arn}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': error_msg,
                'stack_trace': stack_trace
            })
        }