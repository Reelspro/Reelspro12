const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect: authMiddleware } = require('../middleware/authMiddleware');

const UPLOAD_DIR = path.resolve(__dirname, '../../storage/uploads/backgrounds');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `bg_${req.user.id}_${Date.now()}${ext}`;
    cb(null, name);
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only JPG, PNG, WEBP allowed'), false);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB max
});

// POST /api/upload/background
router.post('/background', authMiddleware, upload.single('image'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' });
    const imageUrl = `/storage/uploads/backgrounds/${req.file.filename}`;
    res.json({
      success: true,
      imageUrl,
      filename: req.file.filename,
      size: req.file.size,
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// DELETE /api/upload/background/:filename
router.delete('/background/:filename', authMiddleware, (req, res) => {
  try {
    const filePath = path.join(UPLOAD_DIR, req.params.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
