import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import {
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
  readonly functionDescription: string;
  readonly subnetIds: string;
  readonly routeTableIds: string;
  readonly eipAllocationIds: string;
  readonly startScheduleExpression: string;
  readonly endScheduleExpression: string;
}

export class NatgwSchedulerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: myStackProps) {
    super(scope, id, props);


    // Lambda
    const lambdaSrcPath:string = `../src/lambda/${props.functionName}/python`;
    const defaultLambdaLogLevel:string = 'INFO';
    const defaultLambdaTimeoutSeconds:number = 900;
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
              "ec2:CreateNatGateway",
              "ec2:DeleteNatGateway",
              "ec2:DescribeNatGateways",
              "ec2:CreateTags",
              "ec2:AllocateAddress",
              "ec2:ReleaseAddress",
              "ec2:CreateRoute",
              "ec2:DeleteRoute",
              "ec2:DescribeRouteTables"
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
        description: props.functionDescription,
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
          SUBNET_IDS: props.subnetIds,
          ROUTE_TABLE_IDS: props.routeTableIds,
          EIP_ALLOCATION_IDS: props.eipAllocationIds,
        },
        role: lambdaFunctionRole,
        tracing: lambda.Tracing.ACTIVE,
      }
    );

  }
}
