import { handlerPath } from '@libs/handlerResolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.getImage`,
  events: [
    {
      http: {
        method: 'get',
        path: 'images/{imageId}',
        cors: true
      }
    }
  ]
}
