const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

// Configure AWS S3
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

/**
 * Upload file to S3
 */
exports.uploadFile = async (file, folder = 'content') => {
  const fileKey = `${folder}/${uuidv4()}-${file.originalname}`;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileKey,
    Body: file.buffer,
    ContentType: file.mimetype,
    ACL: 'private', // Private access, use signed URLs
  };

  try {
    const result = await s3.upload(params).promise();
    return {
      url: result.Location,
      key: result.Key,
      size: file.size,
    };
  } catch (error) {
    throw new Error(`File upload failed: ${error.message}`);
  }
};

/**
 * Generate signed URL for private file access
 */
exports.getSignedUrl = async (fileKey, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileKey,
    Expires: expiresIn, // URL valid for 1 hour by default
  };

  try {
    const url = await s3.getSignedUrlPromise('getObject', params);
    return url;
  } catch (error) {
    throw new Error(`Failed to generate signed URL: ${error.message}`);
  }
};

/**
 * Delete file from S3
 */
exports.deleteFile = async (fileKey) => {
  const params = {
    Bucket: process.env.S3_BUCKET,
    Key: fileKey,
  };

  try {
    await s3.deleteObject(params).promise();
    return { message: 'File deleted successfully' };
  } catch (error) {
    throw new Error(`File deletion failed: ${error.message}`);
  }
};

/**
 * Generate presigned POST for direct browser upload
 */
exports.getPresignedPost = async (fileName, contentType, folder = 'content') => {
  const fileKey = `${folder}/${uuidv4()}-${fileName}`;

  const params = {
    Bucket: process.env.S3_BUCKET,
    Fields: {
      key: fileKey,
      'Content-Type': contentType,
    },
    Expires: 300, // 5 minutes
    Conditions: [
      ['content-length-range', 0, 100 * 1024 * 1024], // Max 100MB
    ],
  };

  try {
    const presignedPost = await s3.createPresignedPost(params);
    return {
      ...presignedPost,
      fileKey,
    };
  } catch (error) {
    throw new Error(`Failed to generate presigned POST: ${error.message}`);
  }
};

module.exports = exports;
