const { S3Client } = require('@aws-sdk/client-s3');
const config = require('./config');

const s3Client = new S3Client({
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  signatureVersion: 'v4',
});

const bucketName = config.s3.bucketName;
const cdnDomain = config.s3.cdnDomain;

module.exports = { s3Client, bucketName, cdnDomain };
