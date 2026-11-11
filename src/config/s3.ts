import { S3Client } from '@aws-sdk/client-s3';
import config from './config';

export const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
});

export const bucketName = config.s3.bucketName;
export const cdnDomain = config.s3.cdnDomain;
