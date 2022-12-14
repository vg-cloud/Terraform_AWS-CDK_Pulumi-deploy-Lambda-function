import json
import boto3
import os
s3 = boto3.resource('s3')

def lambda_handler(event, context):
    BUCKET_NAME = os.environ['Bucket']
    bucket = s3.Bucket(BUCKET_NAME)
    
    fileList = []
    for object in bucket.objects.all():
        fileList.append(object.key)
    response = f"{context.function_name} {BUCKET_NAME} files: {fileList}"
    
    print(response)

    return {
        "statusCode": 200,
        "body": response
    }