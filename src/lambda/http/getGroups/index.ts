import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.getGroups`,
  events: [
    {
      http: {
        method: 'get',
        path: 'groups',
        cors: true
      }
    }
  ]
}
