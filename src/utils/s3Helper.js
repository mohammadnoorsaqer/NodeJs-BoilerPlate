const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, bucketName } = require('../config/s3');

async function generateUploadUrl(key, contentType, expiresIn = 60) {
	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: key,
		ContentType: contentType,
		ACL: 'public-read',
	});

	return await getSignedUrl(s3Client, command, { expiresIn });
}

async function generateDownloadUrl(key, expiresIn = 300) {
	const command = new GetObjectCommand({
		Bucket: bucketName,
		Key: key,
	});

	return await getSignedUrl(s3Client, command, { expiresIn });
}

module.exports = { generateUploadUrl, generateDownloadUrl };
