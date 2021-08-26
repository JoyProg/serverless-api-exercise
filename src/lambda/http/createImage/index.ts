import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.createImage_`,
  events: [
    {
      http: {
        method: "post",
        path: "groups/{groupId}/images",
        cors: true,
        authorizer: "auth0Authorizer",
        reqValidatorName: "RequestBodyValidator",
        documentation: {
          summary: "Create a new image",
          description: "Create a new image",
          requestModels: {
            "application/json": "ImageRequest",
          },
        },
      },
    },
  ],
};
