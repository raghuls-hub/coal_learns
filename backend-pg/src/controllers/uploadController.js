const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { pool } = require('../config/database');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString('hex');
    cb(null, unique + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

exports.upload = upload;

exports.uploadFile = async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  try {
    await pool.query(
      `INSERT INTO uploaded_files (filename, original_name, content_type, size, uploaded_by)
       VALUES ($1,$2,$3,$4,$5)`,
      [req.file.filename, req.file.originalname, req.file.mimetype, req.file.size, req.user?.userId || null]
    );

    res.status(200).json({
      success: true,
      data: {
        filename: req.file.filename,
        contentType: req.file.mimetype,
        size: req.file.size,
        url: `/api/upload/file/${req.file.filename}`,
      },
    });
  } catch (error) {
    // Clean up file if DB insert fails
    fs.unlink(req.file.path, () => {});
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFile = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM uploaded_files WHERE filename = $1',
      [req.params.filename]
    );
    if (!rows.length) return res.status(404).json({ success: false, message: 'File not found' });

    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ success: false, message: 'File not found on disk' });

    res.set('Content-Type', rows[0].content_type || 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
