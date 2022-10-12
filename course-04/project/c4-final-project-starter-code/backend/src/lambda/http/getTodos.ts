import 'source-map-support/register'

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'

import { getTodosForUser as getTodosForUser } from '../../businessLogic/todos'
import { getUserId } from '../utils';
import { createLogger } from '../../utils/logger'

const logger = createLogger('getTodo');

// _TODO: Get all TODO items for a current user (done)
export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info(`Processing event: ${event}`)

    // Write your code here
    const userId = getUserId(event)
    const items = await getTodosForUser(userId)

    return {
      statusCode: 200,
      body: JSON.stringify({ items })
    }
  }
)

handler
  .use(httpErrorHandler()).use(
    cors({
      credentials: true
    })
  )
