const multer = require("multer");

// Use memory storage to store image in database
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files (JPG, PNG, JPEG) are allowed"), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
