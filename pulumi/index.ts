import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
const _lambdaBasicExecutionRole = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole";
const _lambdaHandler = "demo_lambda.lambda_handler";
const _lambdaName = "demo-lambda-pulumi";
const _bucketName = "demo-bucket-1029384756";
const _assumeRolePolicy = aws.iam.getPolicyDocument({
    statements: [{
        actions: ["sts:AssumeRole"],
        principals: [{
            type: "Service",
            identifiers: ["lambda.amazonaws.com"]
        }]
    }]
});
const _inlinePolicy = aws.iam.getPolicyDocument({
    statements: [{
        actions: ["s3:List*", "s3:Get*"],
        resources: [`arn:aws:s3:::${_bucketName}`]
    }]
});
const _lambdaRole = new aws.iam.Role(`role-${_lambdaName}`, {
    assumeRolePolicy: _assumeRolePolicy.then(_assumeRolePolicy => _assumeRolePolicy.json),
    managedPolicyArns: [_lambdaBasicExecutionRole],
    inlinePolicies: [{
        name: `policy-${_lambdaName}`,
        policy: _inlinePolicy.then(_inlinePolicy => _inlinePolicy.json)
    }]
});
const _lambdaFunction = new aws.lambda.Function(_lambdaName, {
    runtime: "python3.9", name: _lambdaName,
    code: new pulumi.asset.FileArchive("./_code"),
    handler: _lambdaHandler, role: _lambdaRole.arn,
    environment: {variables: {"Bucket": _bucketName}}
});
const _ebRule = new aws.cloudwatch.EventRule(`launch-${_lambdaName}`, {
    scheduleExpression: "rate(1 minute)"
});
const _ebTarget = new aws.cloudwatch.EventTarget(`eb-target-${_lambdaName}`, {
    arn: _lambdaFunction.arn, rule: _ebRule.id
});
const _ebPermission = new aws.lambda.Permission(`permission-eb-${_lambdaName}`, {
    action: "lambda:InvokeFunction", function: _lambdaFunction.arn,
    principal: "events.amazonaws.com", sourceArn: _ebRule.arn
});