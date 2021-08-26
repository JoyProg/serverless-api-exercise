import { handlerPath } from "@libs/handlerResolver";

export default {
  events: [
    {
      sns: {
        arn: {
          "Fn::Join": [
            ":",
            [
              "arn:aws:sns",
              {
                Ref: "AWS::Region"
              },
              {
                Ref: "AWS::AccountId"
              },
              "${self:custom.topicName}"
            ]
          ]
        },
        topicName: "${self:custom.topicName}"
      }
    }
  ],
  handler: `${handlerPath(__dirname)}/handler.resizeImage`,  
};
