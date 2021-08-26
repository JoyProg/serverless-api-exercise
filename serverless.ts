import type { AWS } from "@serverless/typescript";

import {
  getGroups,
  createGroup,
  getImages,
  getImage,
  createImage,
  SendUploadNotifications,
  connectHandler,
  disconnectHandler,
  syncWithElasticSearch,
  resizeImage,
  auth0Authorizer,
} from "src/lambda";

const serverlessConfiguration: AWS = {
  service: "serverless-udagram-app",
  frameworkVersion: "2",
  custom: {
    topicName: "imagesTopic-${self:provider.stage}",
    webpack: {
      webpackConfig: "./webpack.config.js",
      includeModules: true,
    },
    documentation: {
      api: {
        info: {
          version: "v1.0.0",
          title: "Udagram API",
          description: "Serverless application for images sharing",
        },
      },
      models: [
        {
          name: "GroupRequest",
          contentType: "application/json",
          schema: "${file(models/create-group-request.json)}",
        },
        {
          name: "ImageRequest",
          contentType: "application/json",
          schema: "${file(models/create-image-request.json)}",
        },
      ],
    },
  },
  plugins: [
    "serverless-webpack",
    "serverless-reqvalidator-plugin",
    "serverless-aws-documentation",
  ],
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
    },
    stage: '${opt:stage, "dev"}',
    region: "${opt:region, 'us-east-1'}",
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
      GROUPS_TABLE: "Groups-${self:provider.stage}",
      IMAGES_TABLE: "Images-${self:provider.stage}",
      IMAGE_ID_INDEX: "ImageIdIndex",
      CONNECTIONS_TABLE: "Connections-${self:provider.stage}",
      IMAGES_S3_BUCKET: "serverless-udagram-joy-images-${self:provider.stage}",
      SIGNED_URL_EXPIRATION: "300",
      THUMBNAILS_S3_BUCKET: "serverless-udagram-joy-thumbnail-${self:provider.stage}",
    },
    lambdaHashingVersion: "20201221",
    iamRoleStatements: [
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:GetItem"],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.GROUPS_TABLE}",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query", "dynamodb:PutItem"],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Query"],
        Resource:
          "arn:aws:dynamodb:${self:provider.region}:*:table/${self:provider.environment.IMAGES_TABLE}/index/${self:provider.environment.IMAGE_ID_INDEX}",
      },
      {
        Effect: "Allow",
        Action: ["s3:PutObject", "s3:GetObject"],
        Resource:
          "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*",
      },
      {
        Effect: "Allow",
        Action: ["dynamodb:Scan", "dynamodb:PutItem", "dynamodb:DeleteItem"],
        Resource:
          "arn:aws:dynamodb:${opt:region, self:provider.region}:*:table/${self:provider.environment.CONNECTIONS_TABLE}",
      },
      {
        Effect: "Allow",
        Action: ["s3:PutObject"],
        Resource:
          "arn:aws:s3:::${self:provider.environment.THUMBNAILS_S3_BUCKET}/*",
      },
    ],
  },
  // import the function via paths
  functions: {
    getGroups,
    createGroup,
    getImages,
    getImage,
    createImage,
    SendUploadNotifications,
    connectHandler,
    disconnectHandler,
    syncWithElasticSearch,
    resizeImage,
    auth0Authorizer
  },
  resources: {
    Resources: {
      GatewayResponseDefault4XX: {
        Type: "AWS::ApiGateway::GatewayResponse",
        Properties: {
          ResponseParameters: {
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST'"
          },
          ResponseType: "DEFAULT_4XX",
          RestApiId: {
            Ref: "ApiGatewayRestApi"
          }
        }
      },
      GroupsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.GROUPS_TABLE}",
        },
      },
      ImagesDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "groupId",
              AttributeType: "S",
            },
            {
              AttributeName: "timestamp",
              AttributeType: "S",
            },
            {
              AttributeName: "imageId",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "groupId",
              KeyType: "HASH",
            },
            {
              AttributeName: "timestamp",
              KeyType: "RANGE",
            },
          ],
          GlobalSecondaryIndexes: [
            {
              IndexName: "${self:provider.environment.IMAGE_ID_INDEX}",
              KeySchema: [
                {
                  AttributeName: "imageId",
                  KeyType: "HASH",
                },
              ],
              Projection: {
                ProjectionType: "ALL",
              },
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          StreamSpecification: {
            StreamViewType: "NEW_IMAGE",
          },
          TableName: "${self:provider.environment.IMAGES_TABLE}",
        },
      },
      WebSocketConnectionsDynamoDBTable: {
        Type: "AWS::DynamoDB::Table",
        Properties: {
          AttributeDefinitions: [
            {
              AttributeName: "id",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "id",
              KeyType: "HASH",
            },
          ],
          BillingMode: "PAY_PER_REQUEST",
          TableName: "${self:provider.environment.CONNECTIONS_TABLE}",
        },
      },
      RequestBodyValidator: {
        Type: "AWS::ApiGateway::RequestValidator",
        Properties: {
          Name: "request-body-validator",
          RestApiId: {
            Ref: "ApiGatewayRestApi",
          },
          ValidateRequestBody: true,
          ValidateRequestParameters: false,
        },
      },
      AttachmentsBucket: {
        Type: "AWS::S3::Bucket",
        DependsOn: ["SNSTopicPolicy"],
        Properties: {
          BucketName: "${self:provider.environment.IMAGES_S3_BUCKET}",
          NotificationConfiguration: {
            TopicConfigurations: [
              {
                Event: "s3:ObjectCreated:Put",
                Topic: { Ref: "ImagesTopic" }
              }
            ]
          },
          CorsConfiguration: {
            CorsRules: [
              {
                AllowedOrigins: [
                  "*"
                ],
                AllowedHeaders: [
                  "*"
                ],
                AllowedMethods: [
                  "GET",
                  "PUT",
                  "POST",
                  "DELETE",
                  "HEAD"
                ],
                MaxAge: 3000
              }
            ]
          }
        }
      },
      SendUploadNotificationsPermission: {
        Type: "AWS::Lambda::Permission",
        Properties: {
          FunctionName: {
            Ref: "SendUploadNotificationsLambdaFunction",
          },
          Principal: "s3.amazonaws.com",
          Action: "lambda:InvokeFunction",
          SourceAccount: {
            Ref: "AWS::AccountId",
          },
          SourceArn:
            "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}",
        },
      },
      BucketPolicy: {
        Type: "AWS::S3::BucketPolicy",
        Properties: {
          PolicyDocument: {
            Id: "MyPolicy",
            Version: "2012-10-17",
            Statement: [
              {
                Sid: "PublicReadForGetBucketObjects",
                Effect: "Allow",
                Principal: "*",
                Action: "s3:GetObject",
                Resource:
                  "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}/*",
              },
            ],
          },
          Bucket: {
            Ref: "AttachmentsBucket",
          },
        },
      },
      SNSTopicPolicy: {
        Type: "AWS::SNS::TopicPolicy",
        Properties: {
          PolicyDocument: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  AWS: "*"
                },
                Action: "sns:Publish",
                Resource: { Ref: "ImagesTopic" },
                Condition: {
                  ArnLike: {
                    "aws:SourceArn": "arn:aws:s3:::${self:provider.environment.IMAGES_S3_BUCKET}"
                  }
                }
              }
            ]
          },
          Topics: [
            { Ref: "ImagesTopic" }
          ]
        }
      },
      ThumbnailsBucket:{
        Type: "AWS::S3::Bucket",
        Properties:{
          BucketName: "${self:provider.environment.THUMBNAILS_S3_BUCKET}"
        }       
      },     
      ImagesTopic: {
        Type: "AWS::SNS::Topic",
        Properties: {
          DisplayName: "Image bucket topic",
          TopicName: "${self:custom.topicName}"
        }
      },
      ImagesSearch: {
        Type: "AWS::Elasticsearch::Domain",
        Properties: {
          ElasticsearchVersion: "6.3",
          DomainName: "images-search-${self:provider.stage}",
          ElasticsearchClusterConfig: {
            DedicatedMasterEnabled: false,
            InstanceCount: "1",
            ZoneAwarenessEnabled: false,
            InstanceType: "t2.small.elasticsearch",
          },
          EBSOptions: {
            EBSEnabled: true,
            Iops: 0,
            VolumeSize: 10,
            VolumeType: "gp2",
          },
          AccessPolicies: {
            Version: "2012-10-17",
            Statement: [
              {
                Effect: "Allow",
                Principal: {
                  AWS: {
                    "Fn::Sub":
                  "arn:aws:sts::${AWS::AccountId}:assumed-role/${self:service}-${self:provider.stage}-${self:provider.region}-lambdaRole/serverless-udagram-app-${self:provider.stage}-syncWithElasticSearch"
                  }
                },
                Action: ["es:ESHttp*"],
                Resource: {
                  "Fn::Sub":
                    "arn:aws:es:${self:provider.region}:${AWS::AccountId}:domain/images-search-${self:provider.stage}/*",
                }
              },
              {
                Effect: "Allow",
                Principal: {
                  AWS: "*",
                },
                Action: ["es:ESHttp*"],
                Resource: {
                  "Fn::Sub":
                    "arn:aws:es:${self:provider.region}:${AWS::AccountId}:domain/images-search-${self:provider.stage}/*",
                },
                Condition: {
                  IpAddress: {
                    "aws:SourceIp": ["154.120.69.235/32"],
                  }
                },
              },
            ],
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
