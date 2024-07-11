import { App, Stack } from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';

import * as WafIpWhitelistAutoUpdater from '../lib/waf-ip-whitelist-auto-updater-stack';

const projectName = 'unittest';
const envName = 'test';

const defaultEnv = {
    account: '123456789012',
    region: 'ap-northeast-1',
};

test('case1:Normal', () => {
    // GIVEN
    const app = new App({
        context : {}
    });

    // WHEN
    const stack = new WafIpWhitelistAutoUpdater.WafIpWhitelistAutoUpdaterStack(app, 'MyTestStack', {
        pjName: projectName,
        envName: envName,
        description: 'xxxxxxxx',
        functionName: 'waf-ip-whitelist-auto-updater',
        isAutoDeleteObject: false,
        env: defaultEnv,
        terminationProtection: false, // Enabling deletion protection        
    });
    // THEN
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `${projectName}-${envName}-waf-ip-whitelist-auto-updater`
    });

    template.resourceCountIs('Custom::S3BucketNotifications', 1);
});
