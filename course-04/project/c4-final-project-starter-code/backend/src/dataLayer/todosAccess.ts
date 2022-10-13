import { DocumentClient } from 'aws-sdk/clients/dynamodb'
import * as AWS from 'aws-sdk'
// import AWSXRay from 'aws-xray-sdk'
import { TodoItem } from '../models/TodoItem'
import { TodoUpdate } from '../models/TodoUpdate'
import { createLogger } from '../utils/logger'

const AWSXRay = require('aws-xray-sdk') // ES6 gave typescript a hard time
const XAWS = AWSXRay.captureAWS(AWS) // XAWS is a wrapper around AWS
const logger = createLogger('TodosAccess')

export class TodoAccess {
  constructor(
    private readonly docClient: DocumentClient = new XAWS.DynamoDB.DocumentClient(),
    private readonly todoTable: string = process.env.TODOS_TABLE,
    private readonly createdAtIndex: string = process.env.TODOS_CREATED_AT_INDEX,
    private readonly bucketName: string = process.env.ATTACHMENT_S3_BUCKET
  ) { }

  async createTodoItem(todo: TodoItem): Promise<TodoItem> {
    logger.info(`create todo item ${todo}`)

    const result = await this.docClient.put({
      TableName: this.todoTable,
      Item: todo
    }).promise()

    logger.info(`todo created -> ${result.Attributes}`)

    return todo
  }

  async getAllTodoItemsByUser(userId: string): Promise<TodoItem[]> {
    logger.info(`get all todo items by user ${userId}`)

    const result = await this.docClient.query({
      TableName: this.todoTable,
      IndexName: this.createdAtIndex,
      KeyConditionExpression: 'userId = :userId',
      ExpressionAttributeValues: {
        ':userId': userId
      }
    }).promise()

    logger.info(`todo items for user ${result.Items}`)

    return result.Items as TodoItem[]
  }

  async updateTodo(todoId: string, userId: string, update: TodoUpdate): Promise<TodoUpdate> {
    logger.info(`update todo ${todoId} for user ${userId} with update ${update}`)

    const result = await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      },
      UpdateExpression: 'set #n = :name, #dD = :dueDate, #d = :done',
      ExpressionAttributeNames: {
        "#n": "name",
        "#dD": "dueDate",
        "#d": "done"
      },
      ExpressionAttributeValues: {
        ':name': update.name,
        ':dueDate': update.dueDate,
        ':done': update.done
      },
      ReturnValues: 'ALL_NEW'
    }).promise()

    logger.info('todo updated!')

    return result.Attributes as TodoUpdate
  }

  async deleteTodo(todoId: string, userId: string): Promise<boolean> {
    logger.info(`delete todo ${todoId} for user ${userId}`)

    await this.docClient.delete({
      TableName: this.todoTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      }
    }).promise()

    logger.info("todo deleted!")

    return true
  }

  async addAttachmentToTodo(todoId: string, userId: string, imageId: string): Promise<string> {
    logger.info(`adding attachment to todo ${todoId} for user ${userId} with imageId ${imageId}`)

    const attachmentUrl = `https://${this.bucketName}.s3.amazonaws.com/${imageId}`

    await this.docClient.update({
      TableName: this.todoTable,
      Key: {
        'userId': userId,
        'todoId': todoId
      },
      UpdateExpression: 'set attachmentUrl = :url',
      ExpressionAttributeValues: {
        ':url': attachmentUrl,
      },
      ReturnValues: 'ALL_NEW'
    }).promise()

    logger.info(`attachment url ${attachmentUrl}`)

    return attachmentUrl
  }
}