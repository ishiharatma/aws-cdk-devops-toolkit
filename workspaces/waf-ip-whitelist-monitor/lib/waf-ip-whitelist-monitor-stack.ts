import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import {
  aws_s3 as s3,
  aws_s3_notifications as s3_notifications,
  aws_lambda as lambda,
  aws_events as events,
  aws_events_targets as targets,
  aws_iam as iam,
} from 'aws-cdk-lib';

interface myStackProps extends StackProps {
  readonly pjName: string;
  readonly envName: string;
  readonly isAutoDeleteObject?: boolean;
  readonly functionName: string;
  readonly recordBucketName: string;
  readonly daysThreshold?: string;
  readonly snsTopicArn?: string;
}

export class WafIpWhitelistMonitorStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: myStackProps) {
    super(scope, id, props);
    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    // Create Record Bucket
    const recordBucket = s3.Bucket.fromBucketName(this, 'RecordBucket', props.recordBucketName);

    // Lambda
    const lambdaSrcPath:string = `../src/lambda/${props.functionName}/python`;
    const defaultLambdaLogLevel:string = 'INFO';
    const defaultLambdaTimeoutSeconds:number = 900;
    const lambdaFunctionRole = new iam.Role(this, 'LambdaFunctionRole',{
      roleName: ['@role', 'lambda', props.pjName, props.envName, props.functionName].join('-'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
      inlinePolicies: { 
        lambdaFunctionPolicy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions:[
              "sns:Publish",
            ],
            resources: ["*"],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions:[
              "s3:GetObject",
              "s3:PutObject"
            ],
            resources: [recordBucket.arnForObjects('*')],
          }),
         ]
      })}
    });
    const lambdaFunction = new lambda.Function(
      this,
      'lambdaFunction',
      {
        functionName:[props.pjName, props.envName, props.functionName].join('-'),
        description: "This Lambda function monitors the IP addresses in AWS WAF IP sets and sends notifications for IP addresses that have been active for an extended period. It works in conjunction with the waf-ip-whitelist-auto-updater to provide comprehensive management and monitoring of your WAF IP whitelist.",
        code: lambda.Code.fromAsset(
          path.join(__dirname, lambdaSrcPath)
        ),
        handler: 'index.lambda_handler',
        runtime: lambda.Runtime.PYTHON_3_12,
        timeout: cdk.Duration.seconds(defaultLambdaTimeoutSeconds),
        architecture: lambda.Architecture.ARM_64,
        environment: {
          PROJECT_NAME: props.pjName,
          ENV_NAME: props.envName,
          LOG_LEVEL: defaultLambdaLogLevel,
          IP_RECORD_BUCKET_NAME: recordBucket.bucketName,
          DAYS_THRESHOLD: props.daysThreshold ?? '180',
          SNS_TOPIC_ARN: props.snsTopicArn ?? '',
        },
        role: lambdaFunctionRole,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // 定期起動のイベント
    const eventRule = new events.Rule(this, 'EventRule', {
      schedule: events.Schedule.cron(
        //{minute: '0', hour:'0', weekDay: 'MON' ,month: '*', year: '*'} // テスト用:dayとweekDayは両方指定不可。省略すると"?"が自動で設定される
        {minute: '0', hour:'0', day: '1' ,month: '*', year: '*'}
      ),
      description: 'Run at 9:00 (JST) every 1st day of the month',
    });
    eventRule.addTarget(new targets.LambdaFunction(lambdaFunction));

  }
}
