variable "_lambdaPrincipal" {
  type = string
  default = "lambda.amazonaws.com"
}
variable "_lambdaBasicExecutionRole" {
  type = string
  default = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}
variable "_lambdaHandler" {
  type = string
  default = "demo_lambda.lambda_handler"
}
variable "_lambdaName" {
  type = string
  default = "demo_lambda_tf"
}
variable "_bucketName" {
  type = string
  default = "demo-bucket-1029384756"
}
terraform {
  backend "s3" {
    bucket = "state-terraform-1029384756"
    key = "demo-tf"
    region = "eu-west-1"
  }
}
terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
  }
}
provider "aws" {
  region = "eu-west-1"
  default_tags {
    tags = {
      IaC_tool = "Terraform"
    }
  }
}
data "aws_iam_policy_document" "list_objects" {
  statement {
    actions = ["s3:List*", "s3:Get*"]
    resources = ["arn:aws:s3:::${var._bucketName}"]
  }
}
resource "aws_iam_policy" "list_objects" {
  policy = data.aws_iam_policy_document.list_objects.json
}
resource "aws_iam_role" "for_lambda" {
  assume_role_policy = <<EOF
  {
    "Statement": [
      {
        "Action": "sts:AssumeRole",
        "Principal": {
          "Service": "lambda.amazonaws.com"
        },
        "Effect": "Allow"
      }
    ]
  }
  EOF
}
resource "aws_iam_role_policy_attachment" "a_1" {
  policy_arn = aws_iam_policy.list_objects.arn
  role = aws_iam_role.for_lambda.name
}
resource "aws_iam_role_policy_attachment" "a_2" {
  policy_arn = var._lambdaBasicExecutionRole
  role = aws_iam_role.for_lambda.name
}
data "archive_file" "code" {
  output_path = "_code_zipped/lambda_function.zip"
  type = "zip"
  source_file = "_code/demo_lambda.py"
}
resource "aws_lambda_function" "demo_tf" {
  function_name = var._lambdaName
  role = aws_iam_role.for_lambda.arn
  filename = data.archive_file.code.output_path
  handler = var._lambdaHandler
  source_code_hash = filebase64sha256(data.archive_file.code.output_path)
  runtime = "python3.9"
  environment {
    variables = {
      "Bucket" = var._bucketName
    }
  }
}
resource "aws_cloudwatch_event_rule" "launch_lambda" {
  name = "launch_lambda"
  schedule_expression = "rate(1 minute)"
}
resource "aws_cloudwatch_event_target" "lambda" {
  arn = aws_lambda_function.demo_tf.arn
  rule = aws_cloudwatch_event_rule.launch_lambda.name
}
resource "aws_lambda_permission" "for_eb" {
  action = "lambda:InvokeFunction"
  function_name = aws_lambda_function.demo_tf.function_name
  principal = "events.amazonaws.com"
  source_arn = aws_cloudwatch_event_rule.launch_lambda.arn
}