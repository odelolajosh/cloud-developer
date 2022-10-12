import * as AWS from 'aws-sdk'
import { createLogger } from '../utils/logger'
// import * as AWSXRay from 'aws-xray-sdk'

// const XAWS = AWSXRay.captureAWS(AWS)

const logger = createLogger('AttachmentUtils')

// _TODO: Implement the fileStorage logic
export class AttachmentUtils {
  constructor(
    private readonly s3 = new AWS.S3({ signatureVersion: 'v4' }),
    private readonly bucketName = process.env.ATTACHMENT_S3_BUCKET,
    private readonly signedUrlExpiry = parseInt(process.env.SIGNED_URL_EXPIRATION)
  ) {
  }

  async generateUploadUrl(imageId: string): Promise<string> {
    logger.info('Getting signed url')

    const url = await  this.s3.getSignedUrl('putObject', {
      Bucket: this.bucketName,
      Key: imageId,
      Expires: this.signedUrlExpiry
    })

    logger.info("signed url generated", url)

    return url
  }
}