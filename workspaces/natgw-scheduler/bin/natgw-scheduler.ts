#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { NatgwSchedulerStack } from '../lib/natgw-scheduler-stack';

const app = new cdk.App();

// environment identifier
const projectName: string = app.node.tryGetContext('project');
const envName: string = app.node.tryGetContext('env');
// env
const defaultEnv = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION,
};
const useast1Env = {
// US East (Virginia)
account: process.env.CDK_DEFAULT_ACCOUNT,
  region: "us-east-1",
};

// Whether to force delete an S3 bucket even if objects exist
// Determine by environment identifier
//const isAutoDeleteObject:boolean = envName.match(/^(dev|test|stage)$/) ? true: false;
// Since it is a test, it can be deleted
const isAutoDeleteObject = true;

// Before you can use cdk destroy to delete a deletion-protected stack, you must disable deletion protection for the stack in the management console.
// const isTerminationProtection:boolean = envName.match(/^(dev|test)$/) ? false: true;
// Since it is a test, it can be deleted
const isTerminationProtection=false;

new NatgwSchedulerStack(app, 'NatgwSchedulerStack', {
  pjName: projectName,
  envName: envName,
  description: '',
  functionName: 'natgw-scheduler',
  functionDescription: 'natgw-scheduler lambda function',
  subnetIds: 'subnet-xxxxxxxxxxxxxxxxx,subnet-xxxxxxxxxxxxxxxxx',
  routeTableIds: 'rtb-xxxxxxxxxxxxxxxxx,rtb-xxxxxxxxxxxxxxxxx',
  eipAllocationIds: 'eipalloc-xxxxxxxxxxxxxxxxx,eipalloc-xxxxxxxxxxxxxxxxx',
  // 月～金の９時に起動するスケジュール
  startScheduleExpression: 'cron(0 9 ? * MON-FRI *)',
  // 月～金の１８時に停止（削除するスケジュール）
  endScheduleExpression: 'cron(0 9 ? * MON-FRI *)',
  isAutoDeleteObject: isAutoDeleteObject,
  env: defaultEnv,
  terminationProtection: isTerminationProtection, // Enabling deletion protection
});

// --------------------------------- Tagging  -------------------------------------
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', envName);
