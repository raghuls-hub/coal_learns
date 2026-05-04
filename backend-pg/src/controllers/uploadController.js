const multer = require("multer");
const crypto = require("crypto");
const { pool } = require("../config/database");

// Use memory storage since we'll store files directly in database
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
});

exports.upload = upload;

exports.uploadFile = async (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });

  try {
    // Generate unique filename
    const unique = crypto.randomBytes(16).toString("hex");
    const fileExtension = req.file.originalname.substring(
      req.file.originalname.lastIndexOf("."),
    );
    const filename = unique + fileExtension;

    // Store file data directly in database
    await pool.query(
      `INSERT INTO uploaded_files (filename, original_name, content_type, size, file_data, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        filename,
        req.file.originalname,
        req.file.mimetype,
        req.file.size,
        req.file.buffer, // Store file content as bytea
        req.user?.userId || null,
      ],
    );

    res.status(200).json({
      success: true,
      data: {
        filename: filename,
        contentType: req.file.mimetype,
        size: req.file.size,
        url: `/api/upload/file/${filename}`,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFile = async (req, res) => {
  try {
    const filename = req.params.filename;

    // Validate filename to prevent directory traversal
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid filename" });
    }

    // Retrieve file data from database
    const { rows } = await pool.query(
      "SELECT file_data, content_type FROM uploaded_files WHERE filename = $1",
      [filename],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "File not found" });
    }

    const { file_data, content_type } = rows[0];

    res.set("Content-Type", content_type);
    res.set("Cache-Control", "public, max-age=31536000"); // Cache for 1 year
    res.send(file_data);
  } catch (error) {
    console.error("File retrieval error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
