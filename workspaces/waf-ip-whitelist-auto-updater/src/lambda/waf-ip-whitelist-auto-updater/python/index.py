import os
import json
import urllib.parse
import boto3
import logging
from datetime import datetime

logger = logging.getLogger()

def setup_logging():
    log_level_str = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logger, log_level_str, logging.INFO)
    logger.setLevel(log_level)
    logger.info(f"Log level set to {log_level_str}")

def update_waf_ipset(ipset_name, ipset_id, address_list, scope, region, is_debug=False):
    """Updates the AWS WAF IP set"""
    if scope == 'CLOUDFRONT':
        waf_client = boto3.client('wafv2', region_name='us-east-1')
    else:
        waf_client = boto3.client('wafv2', region_name=region)

    ip_set_info = get_ipset_lock_token(waf_client, ipset_name, ipset_id, scope)
    
    lock_token = ip_set_info['LockToken']
    current_ip_addresses = ip_set_info['IPSet']['Addresses']

    logger.info(f'Got LockToken for AWS WAF IP Set "{ipset_name}": {lock_token}')
    # Get the difference between new IP addresses and current IP addresses
    ip_addresses_to_insert = [ip_address for ip_address in address_list if ip_address not in current_ip_addresses]
    ip_addresses_to_delete = [ip_address for ip_address in current_ip_addresses if ip_address not in address_list]
    
    if ip_addresses_to_insert:
        logger.info('new ip address: {}'.format(ip_addresses_to_insert))
    if ip_addresses_to_delete:
        logger.info('remove ip address: {}'.format(ip_addresses_to_delete))

    if ip_addresses_to_insert or ip_addresses_to_delete:
        if not is_debug:
            waf_client.update_ip_set(
                Name=ipset_name,
                Scope=scope,
                Id=ipset_id,
                Addresses=address_list,
                LockToken=lock_token
            )
            logger.info(f'Updated IPSet "{ipset_name}" with {len(address_list)} CIDRs')
        else:
            logger.info(f'Debug mode: Would update IPSet "{ipset_name}" with {len(address_list)} CIDRs')
    else:
        logger.info('No update to the IPSet is required.')

    return {
        'inserted': ip_addresses_to_insert,
        'deleted': ip_addresses_to_delete
    }


def get_ipset_lock_token(client, ipset_name, ipset_id, scope):
    """Returns the AWS WAF IP set lock token"""
    ip_set = client.get_ip_set(
        Name=ipset_name,
        Scope=scope,
        Id=ipset_id)
    
    return ip_set

def send_sns_notification(sns_topic_arn, message):
    """Sends a notification to the specified SNS topic"""
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=sns_topic_arn,
        Message=message
    )

def update_ip_record(s3_client, bucket_name, ipset_name, ipset_id, current_addresses, inserted_addresses, deleted_addresses):
    file_name = f"{ipset_name}-history.json"
    
    try:
        # Fetch existing file
        response = s3_client.get_object(Bucket=bucket_name, Key=file_name)
        existing_data = json.loads(response['Body'].read().decode('utf-8'))
    except s3_client.exceptions.NoSuchKey:
        # If file doesn't exist, create a new one
        existing_data = {
            "ipSetName": ipset_name,
            "ipSetId": ipset_id,
            "Addresses": []
        }

    # Get current timestamp
    current_time = datetime.now().isoformat()

    # Update existing addresses, add new addresses, and mark deleted addresses
    existing_addresses = {addr['ipAddress']: addr for addr in existing_data['Addresses']}
    for ip in current_addresses:
        if ip not in existing_addresses:
            existing_addresses[ip] = {"ipAddress": ip, "createdAt": current_time, "status": "active"}
        elif existing_addresses[ip].get('status') == 'deleted':
            existing_addresses[ip]['status'] = 'active'
            existing_addresses[ip]['reactivatedAt'] = current_time

    # Mark deleted addresses
    for ip in deleted_addresses:
        if ip in existing_addresses:
            existing_addresses[ip]['status'] = 'deleted'
            existing_addresses[ip]['deletedAt'] = current_time

    existing_data['Addresses'] = list(existing_addresses.values())

    # Save updated data to S3
    s3_client.put_object(
        Bucket=bucket_name,
        Key=file_name,
        Body=json.dumps(existing_data, indent=2),
        ContentType='application/json'
    )

    logger.info(f"Updated IP record in S3: {file_name}")

def lambda_handler(event, context):
    setup_logging()
    try:
        logger.info('start')
        logger.info('event: {}'.format(event))
        bucket_name = event['Records'][0]['s3']['bucket']['name']
        file_key = urllib.parse.unquote_plus(event['Records'][0]['s3']['object']['key'], encoding='utf-8')

        # Read the contents of the file from the S3 object
        s3 = boto3.client('s3')
        file_obj = s3.get_object(Bucket=bucket_name, Key=file_key)
        file_content = file_obj['Body'].read().decode('utf-8')
        lambda_region = context.invoked_function_arn.split(":")[3]
        
        # Parse the contents of the JSON file
        config = json.loads(file_content)
        
        ipset_name = config['ipSetName']
        ipset_id = config['ipSetId']
        ip_addresses = config['allowedIpAddressRanges']
        scope = config['scope']
        # Use Lambda's region if 'region' is not specified or is an empty string
        config_region = config.get('region', '')
        region = config_region if config_region.strip() else lambda_region
        is_debug = config.get('isDebug', False)
        sns_topic_arn = config.get('snsTopicArn', '')

        logger.debug(ip_addresses) 
        
        update_result = update_waf_ipset(ipset_name, ipset_id, ip_addresses, scope, region, is_debug=is_debug)

        # Update IP address records
        record_bucket_name = os.environ.get('IP_RECORD_BUCKET_NAME')
        if record_bucket_name:
            s3_client = boto3.client('s3')
            update_ip_record(s3_client, record_bucket_name, ipset_name, ipset_id, ip_addresses, update_result['inserted'], update_result['deleted'])

        # Send SNS notification if specified
        if sns_topic_arn:
            message = (
                f"WAF IP Whitelist update completed. "
                f"IPSet: {ipset_name}, Scope: {scope}, Region: {region}, "
                f"Total IPs: {len(ip_addresses)}, "
                f"Inserted: {len(update_result['inserted'])}, "
                f"Deleted: {len(update_result['deleted'])}"
            )
            send_sns_notification(sns_topic_arn, message)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'WAF IP Whitelist updated successfully',
                'ipSetName': ipset_name,
                'scope': scope,
                'region': region,
                'totalIPs': len(ip_addresses),
                'insertedIPs': update_result['inserted'],
                'deletedIPs': update_result['deleted']
            })
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