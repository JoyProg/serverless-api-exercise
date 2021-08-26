import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.createGroup`,
  events: [
    {
      http: {
        method: "post",
        path: "groups",
        cors: true,
        authorizer: "auth0Authorizer",
        reqValidatorName: "RequestBodyValidator",
        documentation: {
          summary: "Create a new group",
          description: "Create a new group",
          requestModels: {
            "application/json": "GroupRequest",
          },
        },
      },
    },
  ],
};
