import { handlerPath } from "@libs/handlerResolver";

export default {
  handler: `${handlerPath(__dirname)}/handler.connect`, 
  events: [
    {
      websocket: {
        route: "$connect"
      }
    }
  ]   
};
