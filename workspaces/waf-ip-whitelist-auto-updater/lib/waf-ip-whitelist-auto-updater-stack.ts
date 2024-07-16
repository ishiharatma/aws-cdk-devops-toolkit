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
}

export class WafIpWhitelistAutoUpdaterStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: myStackProps) {
    super(scope, id, props);
    const accountId = cdk.Stack.of(this).account;
    const region = cdk.Stack.of(this).region;

    // Create Bucket
    const targetBucket = new s3.Bucket(this, 'UploadBucket', {
      bucketName: [props.pjName, props.envName, props.functionName, accountId].join('.'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      enforceSSL: true,
      removalPolicy: props.isAutoDeleteObject ? cdk.RemovalPolicy.DESTROY: undefined,
      autoDeleteObjects: props.isAutoDeleteObject ? props.isAutoDeleteObject : undefined,
    });

    // Create Record Bucket
    const recordBucket = new s3.Bucket(this, 'RecordBucket', {
      bucketName: [props.pjName, props.envName, props.functionName, "record", accountId].join('.'),
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      publicReadAccess: false,
      enforceSSL: true,
      removalPolicy: props.isAutoDeleteObject ? cdk.RemovalPolicy.DESTROY: undefined,
      autoDeleteObjects: props.isAutoDeleteObject ? props.isAutoDeleteObject : undefined,
    });

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
              "wafv2:GetIPSet",
              "wafv2:UpdateIPSet",
            ],
            resources: ["arn:aws:wafv2:*:*:*/ipset/*"],
          }),
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
        description: "This Lambda function automatically updates the IP whitelist (IP set) of AWS WAF based on a JSON configuration file uploaded to an S3 bucket.",
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
        },
        role: lambdaFunctionRole,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

    // S3 Bucket Trigger
    // create s3 notification for lambda function
    const notification = new s3_notifications.LambdaDestination(lambdaFunction);

    // assign notification for the s3 event type (ex: OBJECT_CREATED)
    targetBucket.addEventNotification(s3.EventType.OBJECT_CREATED_PUT, notification)

  }
}
