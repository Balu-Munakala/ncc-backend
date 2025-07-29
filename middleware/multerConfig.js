// middleware/multerConfig.js

const multer = require('multer');
const path = require('path');

// Storage configuration: save under <project_root>/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure uploads directory is correct relative to this file
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    // Prepend timestamp and sanitize the original name (replace spaces)
    const timestamp = Date.now();
    const sanitized = file.originalname.replace(/\s+/g, '_');
    cb(null, `${timestamp}-${sanitized}`);
  }
});

// Only allow image files
const fileFilter = (req, file, cb) => {
  // Acceptable extensions: .jpeg, .jpg, .png, .gif
  const allowedExts = /jpeg|jpg|png|gif/;
  const extname = allowedExts.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedExts.test(file.mimetype);
  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif).'), false);
  }
};

module.exports = multer({
  storage,
  fileFilter
});
