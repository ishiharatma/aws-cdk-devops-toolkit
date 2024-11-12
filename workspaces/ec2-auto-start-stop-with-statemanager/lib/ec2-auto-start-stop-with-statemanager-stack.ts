import * as cdk from 'aws-cdk-lib';
import { StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { 
  aws_resourcegroups as rg,
  aws_ssm as ssm,
} from 'aws-cdk-lib';

interface myStackProps extends StackProps {
  readonly pjName: string;
  readonly envName: string;
  readonly scheduleStartExpression: string;
  readonly scheduleStopExpression: string;
} 

export class Ec2AutoStartStopWithStatemanagerStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: myStackProps) {
    super(scope, id, props);
    const accountId:string = cdk.Stack.of(this).account;
    const region:string = cdk.Stack.of(this).region;

    // リソースグループ
    const resourceGroupStart = new rg.CfnGroup(this, 'ResourceGroupStart', {
      name: ['rg', props.pjName, props.envName, 'autostart'].join('-') ,
      description: `Start Resource Group for ${props.pjName} ${props.envName}`,
      resourceQuery: {
        query: {
          resourceTypeFilters: ['AWS::AllSupported'],
          tagFilters: [{
            key: 'Project',
            values: [ props.pjName],
          },
          {
            key: 'Environment',
            values: [ props.envName],
          },
          {
            key: 'autostart',
            values: [ 'true' ],
          }],
        },
        type: 'TAG_FILTERS_1_0',
      },
    });
    new cdk.CfnOutput(this, 'StartResourceGroupId', {
      value: resourceGroupStart.logicalId,
    });
    const resourceGroupStop = new rg.CfnGroup(this, 'ResourceGroupStop', {
      name: ['rg', props.pjName, props.envName, 'autostop'].join('-') ,
      description: `Stop Resource Group for ${props.pjName} ${props.envName}`,
      resourceQuery: {
        query: {
          resourceTypeFilters: ['AWS::AllSupported'],
          tagFilters: [{
            key: 'Project',
            values: [ props.pjName],
          },
          {
            key: 'Environment',
            values: [ props.envName],
          },
          {
            key: 'autostop',
            values: [ 'true' ],
          }],
        },
        type: 'TAG_FILTERS_1_0',
      },
    });

    new cdk.CfnOutput(this, 'StopResourceGroupId', {
      value: resourceGroupStop.logicalId,
    });

    // Systems Manager - StateManager
    new ssm.CfnAssociation(this, 'StateManager-StartEC2', {
      name: 'AWS-StartEC2Instance',
      targets: [{
        key: 'ResourceGroups',
        values: [ resourceGroupStart.logicalId],
      }],
      calendarNames:[],
      scheduleExpression: props.scheduleStartExpression,
      associationName: ['ssm', props.pjName, props.envName, 'startInstance'].join('-'),
    });

    new ssm.CfnAssociation(this, 'StateManager-StopEC2', {
      name: 'AWS-StopEC2Instance',
      targets: [{
        key: 'ResourceGroups',
        values: [ resourceGroupStop.logicalId],
      }],
      calendarNames:[],
      scheduleExpression: props.scheduleStopExpression,
      associationName: ['ssm', props.pjName, props.envName, 'stopInstance'].join('-'),
    });

  }
}
