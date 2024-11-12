import os
import json
import urllib.parse
import boto3
import logging
from datetime import datetime
import time

logger = logging.getLogger()
client = boto3.client("ec2")

def setup_logging():
    log_level_str = os.environ.get('LOG_LEVEL', 'INFO').upper()
    log_level = getattr(logger, log_level_str, logging.INFO)
    logger.setLevel(log_level)
    logger.info(f"Log level set to {log_level_str}")

def send_sns_notification(sns_topic_arn, message):
    """Sends a notification to the specified SNS topic"""
    sns_client = boto3.client('sns')
    sns_client.publish(
        TopicArn=sns_topic_arn,
        Message=message
    )

def start_natgw(natgwName, Eip, subnet):
    """NAT GateWayの開始処理"""
    # NATゲートウェイがすでに存在すればreturn
    filters = [
        {"Name": "subnet-id", "Values": [subnet]},
        {"Name": "state", "Values": ["available"]},
    ]
    response = client.describe_nat_gateways(Filters=filters)
    if response["NatGateways"]:
        return None
    # NATゲートウェイを作成
    response = client.create_nat_gateway(
        AllocationId=Eip,
        SubnetId=subnet,
        TagSpecifications=[
            {
                "ResourceType": "natgateway",
                "Tags": [
                    {
                        "Key": "Name",
                        "Value": natgwName,
                    },
                ],
            },
        ],
    )
    natid = response["NatGateway"]["NatGatewayId"]
    client.get_waiter("nat_gateway_available").wait(NatGatewayIds=[natid])
    return natid

def atatch_natgw(natgw, subnet):
    """ルーティング作成"""
    filters = [{"Name": "association.subnet-id", "Values": [subnet]}]
    response = client.describe_route_tables(Filters=filters)
    rtb = response["RouteTables"][0]["Associations"][0]["RouteTableId"]
    client.create_route(
        DestinationCidrBlock="0.0.0.0/0", NatGatewayId=natgw, RouteTableId=rtb
    )


def detach_natgw(subnet):
    """ルーティング削除処理"""
    filters = [{"Name": "association.subnet-id", "Values": [subnet]}]
    response = client.describe_route_tables(Filters=filters)
    rtb = response["RouteTables"][0]["Associations"][0]["RouteTableId"]
    client.delete_route(DestinationCidrBlock="0.0.0.0/0", RouteTableId=rtb)
    # ルートテーブルからルートが削除されるまで待機
    while True:
        response = client.describe_route_tables(RouteTableIds=[rtb])
        routes = response["RouteTables"][0]["Routes"]

        if not any(route["DestinationCidrBlock"] == "0.0.0.0/0" for route in routes):
            break

        time.sleep(5)  # 5秒間待機してから再度チェック

def stop_natgw(subnet):
    """NAT GateWayの開始処理"""
    filters = [
        {"Name": "subnet-id", "Values": [subnet]},
        {"Name": "state", "Values": ["available"]},
    ]
    response = client.describe_nat_gateways(Filters=filters)
    # NATを削除する前にElastic IPを取得しておく（Elastic IP解放時に使うため）
    eip = response["NatGateways"][0]["NatGatewayAddresses"][0]["AllocationId"]
    natgw = response["NatGateways"][0]["NatGatewayId"]
    client.delete_nat_gateway(NatGatewayId=natgw)
    # NAT Gateway が削除されるまで待機
    waiter = client.get_waiter("nat_gateway_deleted")
    waiter.wait(NatGatewayIds=[natgw])
    return eip

def allocate_Eip():
    """Elastic IPの取得"""
    response = client.allocate_address(Domain="vpc")
    allocation_id = response["AllocationId"]
    # Elastic IPにタグを追加
    client.create_tags(
        Resources=[allocation_id],
        Tags=[
            {
                "Key": "Name",
                "Value": "Elastic IPの名前",
            }
        ],
    )
    return allocation_id

def release_Eip(eip):
    """Elastic IPの解放"""
    client.release_address(AllocationId=eip)

def lambda_handler(event, context):
    setup_logging()
    try:
        logger.info('start')
        logger.info('event: {}'.format(event))
        subnet_ids = os.environ['SUBNET_IDS'].split(',')
        route_table_ids = os.environ['ROUTE_TABLE_IDS'].split(',')
        eip_allocation_ids = os.environ['EIP_ALLOCATION_IDS'].split(',')

        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        action = ""
        statusCode = 200
        messageBody = ""

        if action == "start":
            for subnet_id in subnet_ids:
                for route_table_id in route_table_ids:
                    # NAT Gatewayの開始処理
                    natgwName = "NATGW-" + subnet_id
                    natid = start_natgw(natgwName, Eip, subnet_id)
                    # NAT Gatewayにルートを追加
                    atatch_natgw(natid, subnet_id)
                    messageBody = "NAT Gateway created: " + natgwName
                    logger.info(messageBody)

        elif action == "stop":
            for subnet_id in subnet_ids:
                for route_table_id in route_table_ids:
                    # NAT Gatewayの終了処理
                    natgwName = "NATGW-" + subnet_id
                    eip = stop_natgw(subnet_id)
                    # NAT Gatewayのルートを削除
                    detach_natgw(eip, subnet_id)
                    # Elastic IPの解放
                    release_Eip(eip)
                    messageBody = "NAT Gateway deleted: " + natgwName
                    logger.info(messageBody)
        else:
            # actionタイプが無効なのでエラーメッセージ
            statusCode = 400
            messageBody = "Invalid action type: " + action
            logger.error(messageBody)

        # Send SNS notification if specified
        if sns_topic_arn:
            message = (
                f"{messageBody}"
            )
            send_sns_notification(sns_topic_arn, message)

        return {
            'statusCode': statusCode,
            'body':  messageBody
        }
    except Exception as e:
        logger.exception(str(e))
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Error occurred.',
                'error': str(e)
            })
        }