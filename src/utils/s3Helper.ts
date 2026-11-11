import { PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { s3Client, bucketName } from '../config/s3';

export async function generateUploadUrl(
  key: string,
  contentType: string,
  expiresIn = 60,
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    ACL: 'public-read',
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function generateDownloadUrl(
  key: string,
  expiresIn = 300,
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: bucketName,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}
