const multer = require("multer");
const { uploadMultiple } = require("./multerConfig");

// Middleware for handling Multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
      
        console.log(err);
        
        
    if (err.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size allowed is 5MB." });
    }
    return res.status(500).json({ error: `Multer error: ${err.message}` });
} else if (err) {
      console.log(err);
    return res
      .status(500)
      .json({ error: "An unexpected error occurred during file upload." });
  }
  next();
};

const uploadPoliceDocs = (req, res, next) => {
  uploadMultiple.uploadPoliceClearenceDocs(req, res, (err) => {
    if (err) {
      return next(err); // Pass Multer errors to the error handling middleware
    }
    next(); // Proceed to the next middleware if no error
  });
};

module.exports = {
  handleMulterError,
  uploadPoliceDocs,
};
