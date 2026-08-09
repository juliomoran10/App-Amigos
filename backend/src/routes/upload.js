const fs = require('fs');
const path = require('path');
const express = require('express');
const multer = require('multer');
const { authenticate } = require('../middleware/auth');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase() || '.jpg';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'));
    }
  }
});

const uploadRouter = express.Router();

async function uploadToCloudinary(localPath) {
  const cloudinary = require('cloudinary').v2;
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  const result = await cloudinary.uploader.upload(localPath, { folder: 'friendmatch' });
  return result.secure_url;
}

function buildLocalUrl(req, filename) {
  return `${req.protocol}://${req.get('host')}/uploads/${filename}`;
}

async function handleUpload(req, res) {
  if (!req.file) {
    return res.status(400).json({ ok: false, error: 'image_required' });
  }

  try {
    let imageUrl;

    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      imageUrl = await uploadToCloudinary(req.file.path);
      fs.unlink(req.file.path, () => {});
    } else {
      imageUrl = buildLocalUrl(req, req.file.filename);
    }

    return res.json({ ok: true, imageUrl });
  } catch (error) {
    console.error('[upload] error:', error);
    return res.status(500).json({ ok: false, error: 'upload_failed' });
  }
}

// Trace para diagnosticar fallos de subida en desarrollo
uploadRouter.use((req, res, next) => {
  console.log(`[upload][trace] request received: ${req.method} ${req.originalUrl} content-type=${req.get('content-type')}`);
  next();
});

uploadRouter.post('/', authenticate, upload.single('image'), handleUpload);
uploadRouter.post('/chat-image', authenticate, upload.single('image'), handleUpload);
uploadRouter.post('/register', upload.single('image'), handleUpload);

uploadRouter.use((error, req, res, next) => {
  console.error('[upload][trace] multer error handler reached:', error && error.message, error && error.code);
  next(error);
});

module.exports = { uploadRouter };
