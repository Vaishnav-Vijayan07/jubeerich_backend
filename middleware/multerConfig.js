// multerConfig.js
const multer = require('multer');
const path = require('path');

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);

    const folder = {
      exam_documents: 'uploads/examDocuments',
    };

    const uploadFolder = folder[file.fieldname] || 'uploads/';
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${basename}-${uniqueSuffix}${ext}`); // Unique filename with timestamp
  },
});

const uploadMultiple = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'exam_documents', maxCount: 10 },
]);


module.exports = uploadMultiple;
