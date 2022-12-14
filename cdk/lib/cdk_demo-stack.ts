import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  aws_lambda as _lambda, aws_iam as _iam,
  aws_events as _eb, aws_events_targets as _ebt,
  Duration} from 'aws-cdk-lib'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam'
const _lambdaPrincipal = "lambda.amazonaws.com";
const _lambdaBasicExecutionRole = "service-role/AWSLambdaBasicExecutionRole";
const _lambdaHandler = "demo_lambda.lambda_handler";
const _lambdaName = "demo-lambda-cdk";
const _ebRuleName = `launch-${_lambdaName}`;
const _bucketName = "demo-bucket-1029384756";

export class CdkDemoStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

  const _lambdaRole = new _iam.Role(this, `role-${_lambdaName}`, {
    assumedBy: new _iam.ServicePrincipal(_lambdaPrincipal),
    roleName: `role--${_lambdaName}`,
    managedPolicies: [_iam.ManagedPolicy.fromAwsManagedPolicyName(_lambdaBasicExecutionRole)]
  });
  _lambdaRole.addToPolicy(new PolicyStatement({
    resources: [`arn:aws:s3:::${_bucketName}`], actions: ["s3:List*", "s3:Get*"]
  }));
  const _lambdaFunction = new _lambda.Function(this, _lambdaName, {
    runtime: _lambda.Runtime.PYTHON_3_9,
    functionName: _lambdaName,
    code: _lambda.Code.fromAsset("./_code"),
    handler: _lambdaHandler,
    role: _lambdaRole,
    environment: {"Bucket": _bucketName}
  });
  const _event_bridge_rule = new _eb.Rule(this, _ebRuleName, {
    schedule: _eb.Schedule.rate(Duration.minutes(1))
  });
  _event_bridge_rule.addTarget(new _ebt.LambdaFunction(_lambdaFunction))
  }
}
