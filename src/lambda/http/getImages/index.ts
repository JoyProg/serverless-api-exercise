import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.getImages`,
  events: [
    {
      http: {
        method: 'get',
        path: 'groups/{groupId}/images',
        cors: true
      }
    }
  ]
}
