#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Ec2AutoStartStopWithStatemanagerStack } from '../lib/ec2-auto-start-stop-with-statemanager-stack';


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

new Ec2AutoStartStopWithStatemanagerStack(app, 'Ec2AutoStartStopWithStatemanagerStack', {
  pjName: projectName,
  envName: envName,
  description: 'Configure a state manager to automatically start and stop EC2 instances based on tags and scheduled events.',
  scheduleStartExpression: 'cron(0 0 ? * MON-FRI *)',
  scheduleStopExpression: 'cron(0 8 ? * MON-FRI *)',
  env: defaultEnv,
  terminationProtection: isTerminationProtection, // Enabling deletion protection
});

// --------------------------------- Tagging  -------------------------------------y
cdk.Tags.of(app).add('Project', projectName);
cdk.Tags.of(app).add('Environment', envName);