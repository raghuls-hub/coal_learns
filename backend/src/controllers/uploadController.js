const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { Readable } = require('stream');

// Use memory storage to avoid multer-gridfs-storage bug with Mongoose 8/MongoDB Driver 6
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

exports.upload = upload;

exports.uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  try {
    const conn = mongoose.connection;
    if (!conn.db) {
      return res.status(500).json({ success: false, message: 'Database connection not ready' });
    }

    const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });

    // Generate unique filename
    const buf = crypto.randomBytes(16);
    const filename = buf.toString('hex') + path.extname(req.file.originalname);

    // Create upload stream
    const uploadStream = gfs.openUploadStream(filename, {
      contentType: req.file.mimetype,
      metadata: {
        originalname: req.file.originalname,
        fieldname: req.file.fieldname
      }
    });

    // Convert buffer to stream and pipe
    const readableStream = new Readable();
    readableStream.push(req.file.buffer);
    readableStream.push(null);

    readableStream.pipe(uploadStream);

    uploadStream.on('error', (err) => {
      console.error('❌ Upload Stream Error:', err);
      res.status(500).json({ success: false, message: 'Upload failed' });
    });

    uploadStream.on('finish', () => {
      res.status(200).json({
        success: true,
        data: {
          fileId: uploadStream.id,
          filename: filename,
          contentType: req.file.mimetype,
          size: req.file.size,
          url: `/api/upload/file/${filename}`
        }
      });
    });

  } catch (error) {
    console.error('❌ Upload Controller Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFile = async (req, res) => {
  try {
    const conn = mongoose.connection;
    if (!conn.db) {
      return res.status(500).json({ success: false, message: 'Database connection not ready' });
    }

    const gfs = new mongoose.mongo.GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });

    const files = await gfs.find({ filename: req.params.filename }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }

    const file = files[0];
    res.set('Content-Type', file.contentType || 'application/octet-stream');
    
    const downloadStream = gfs.openDownloadStreamByName(req.params.filename);
    
    downloadStream.on('error', (err) => {
      console.error('❌ Download Stream Error:', err);
      if (!res.headersSent) {
        res.status(404).json({ success: false, message: 'Error streaming file' });
      }
    });

    downloadStream.pipe(res);
  } catch (error) {
    console.error('❌ Get File Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
