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
  readonly snsTopicArn?: string;
  readonly scheduleStartExpression?: string;
  readonly scheduleStopExpression?: string;
}

export class Ec2AutoStartStopStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: myStackProps) {
    super(scope, id, props);

    // Lambda
    const lambdaSrcPath:string = `../src/lambda/${props.functionName}/python`;
    const defaultLambdaLogLevel:string = 'INFO';
    const defaultLambdaTimeoutSeconds:number = 900; // 15 min
    const lambdaFunctionRole = new iam.Role(this, 'LambdaFunctionRole',{
      roleName: ['@role', 'lambda', props.pjName, props.envName, props.functionName].join('-'),
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
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
              "ec2:DescribeInstances",
              "ec2:StartInstances",
              "ec2:StopInstances"
            ],
            resources: ["*"],
          }),
         ]
      })}
    });
    const lambdaFunction = new lambda.Function(
      this,
      'lambdaFunction',
      {
        functionName:[props.pjName, props.envName, props.functionName].join('-'),
        description: "An AWS Lambda function to automatically start and stop EC2 instances based on tags and scheduled events.",
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
          SNS_TOPIC_ARN: props.snsTopicArn ?? '',
        },
        role: lambdaFunctionRole,
        tracing: lambda.Tracing.ACTIVE,
      }
    );
    // 定期起動のイベント
    // dayとweekDayは両方指定不可。省略すると"?"が自動で設定される
    if (props.scheduleStartExpression) {
      const eventStartRule = new events.Rule(this, 'EventStartRule', {
        schedule: events.Schedule.expression(
          props.scheduleStartExpression
  //        {minute: '0', hour:'0', weekDay: '*' ,month: '*', year: '*'}
        ),
        description: 'EC2 startup.',
      });
      eventStartRule.addTarget(new targets.LambdaFunction(lambdaFunction, {
        event: events.RuleTargetInput.fromObject({action: "start"}),
      }));
    }
    if (props.scheduleStopExpression) {
      const eventStopRule = new events.Rule(this, 'EventStopRule', {
        schedule: events.Schedule.expression(
          props.scheduleStopExpression
          //{minute: '0', hour:'9', weekDay: '*' ,month: '*', year: '*'}
        ),
        description: 'EC2 shutdown.',
      });
      eventStopRule.addTarget(new targets.LambdaFunction(lambdaFunction, {
        event: events.RuleTargetInput.fromObject({action: "stop"}),
      }));
    }
  }
}
