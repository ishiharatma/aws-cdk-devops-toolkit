import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { App } from 'aws-cdk-lib';

import * as WafIpWhitelistMonitor from '../lib/waf-ip-whitelist-monitor-stack';

const defaultEnv = {
    account: '123456789012',
    region: 'ap-northeast-1',
};
const projectName: string = 'snapshot';
const envName: string = 'test';
const app = new App();

test('snapshot validation test',() =>{
    const stack = new WafIpWhitelistMonitor.WafIpWhitelistMonitorStack(app, 'MyTestStack', {
        pjName: projectName,
        envName: envName,
        description: 'xxxxxxxx',
        functionName: 'waf-ip-whitelist-monitor',
        recordBucketName: 'bucketname',
        isAutoDeleteObject: false,
        env: defaultEnv,
        terminationProtection: false, // Enabling deletion protection        
    });
    // add tag
    cdk.Tags.of(app).add('Project', projectName);
    cdk.Tags.of(app).add('Environment', envName);
    // test with snapshot
    expect(Template.fromStack(stack)).toMatchSnapshot();

})