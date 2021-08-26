import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.disconnect`,
  events: [
    {
      websocket: {
        route: "$disconnect"
      }
    }
  ]  
};
