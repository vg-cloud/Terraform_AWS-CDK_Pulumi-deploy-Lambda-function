# The same project is deployed by three different IaC tools: Terraform, AWS CDK and Pulumi

Over the last years Terraform has become the most widely used IaC tool, thanks to its declarative nature and rapid learning progression. Being curious, I could not help testing two alternative options recently: AWS CDK and Pulumi. Those who have only ten minutes, can observe how a complete project can be deployed and then destroyed with all three tools from a to z in real time and so, after watching them, they will be able to have their own opinion about each tool. The videos have been speeded up four times to reduce watching time. Installation steps for each tool have been excluded from videos. 

## What will be done as part of the demo

Each project will deploy in AWS a Lambda function which will be launched by EventBridge rule every minute. The Lambda function will construct a list of the files in a specific S3 bucket and will print a message containing the list, which will be visible in the CloudWatch log. We will query using AWS CLI the respective log group to validate that the function works as expected. At the end of each demo, all the resources will be destroyed.

## Terraform vs CDK

[Click to watch Terraform and CDK projects deployment videos - side by side, resolution: HD, duration: 4m37s](https://youtu.be/k4N9Z1_LI94)

## Pulumi vs CDK

[Click to watch Pulumi and CDK projects deployment videos - side by side, resolution: HD, duration: 4m37s](https://youtu.be/d9X0ly69UUc)

## Observations

### Autocompletion, prompts and default values

Autocompletion is available in VSCode for all three tools and it does help creating the code faster and with fewer mistakes. However, it is worth mentioning that 'typescript' offers additional advantage: it will tell what the required and optional arguments are and will provide their types in VSCode prompts. Thus someone, who has a good knowledge of AWS services, will be able to configure them without having to go to the documentation pages. Also, CDK and Pulumi provide more default values for services, than Terraform. Finally, with real programming languages it is possible to avoid typing long service identifiers, for example using this command: `import { aws_events as _eb} from 'aws-cdk-lib'`. Therefore, if the code aims to deploy EventBridge service many times, it will be less verbose. 

### Summary

|IaC tool|Code size in bytes|Number of lines of code|Typing code time (in seconds)|Deployment duration (in seconds)|"Destroy" duration (in seconds)|
|--------|--:|--:|--:|--:|--:|
|Terraform|2590|106|930s|28s|10s|
|CDK|1956|53|720s|176s|90s|
|Pulumi|1809|47|680s|21s|11s|

## Terraform project details

### Steps

+ create `main.tf` file
+ `terraform init`
+ `terraform plan`
+ `terraform apply --auto-approve`
+ query CloudWatch logs
+ `terraform destroy --auto-approve`

### Project code

[Click to see the content of the main.tf file](./terraform/main.tf)

## CDK project details

### Steps

+ set `CDK_DEFAULT_ACCOUNT` and `CDK_DEFAULT_REGION` environment variables
+ `cdk app new --language typescript`
+ update `bin/cdk_demo.ts` and `lib/cdk_demo-stack.ts`
+ `cdk synth`
+ `cdk deploy`
+ query CloudWatch logs
+ `cdk destroy`

### Project code

[Click to see the content of the bin/cdk_demo.ts file](./cdk/bin/cdk_demo.ts)

[Click to see the content of the lib/cdk_demo-stack.ts file](./cdk/lib/cdk_demo-stack.ts)

## Pulumi project details

### Steps

+ setup state in S3 bucket - `pulumi login s3://state-pulumi-1029384756/demo-pulumi`
+ `pulumi new`
+ update `pulumi.dev.yaml` - add `defaultTags`
+ update `index.ts` file
+ `pulumi preview`
+ `pulumi up -y`
+ query CloudWatch logs
+ `pulumi destroy -y`

### Project code

[Click to see the content of the index.ts file](./pulumi/index.ts)

## Query CloudWatch logs using AWS CLI

### Create query and save queryID in environment variable

```
queryId=$(aws logs start-query \
--log-group-name 'LOG_GROUP_NAME' \
--start-time `date -j -v-10M +%s` \
--end-time `date -j -v+1H +%s` \
--query-string 'fields @timestamp, @message | 
sort @timestamp desc | 
filter @message like "FILTER" | limit 10' \
| jq --raw-output '.queryId'
)
```
+ `/aws/lambda/demo_lambda_tf` - example of LOG_GROUP_NAME
+ `date -j -v-10M +%s` means 10 minutes before command's executions time
+ `date -j -v+1H +%s` means 1 hour after command's executions time
+ `demo-bucket` - example of FILTER

### Poll query using the query ID

```
aws logs get-query-results --query-id $queryId --output text
```
