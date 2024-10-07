const multer = require("multer");
const path = require("path");
const fs = require("fs");

const multerStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);

    // Map specific fields to corresponding folders
    const folder = {
      exam_documents: "uploads/examDocuments",
      graduation_documents: "uploads/graduationDocuments",
      primary_mark_sheet: "uploads/educationDocuments",
      primary_certificate: "uploads/educationDocuments",
      primary_admit_card: "uploads/educationDocuments",
      secondary_mark_sheet: "uploads/educationDocuments",
      secondary_certificate: "uploads/educationDocuments",
      secondary_admit_card: "uploads/educationDocuments",
      passport_doc: "uploads/studentAdditionalDocs",
      updated_cv: "uploads/studentAdditionalDocs",
      profile_assessment_doc: "uploads/studentAdditionalDocs",
      pte_cred: "uploads/studentAdditionalDocs",
    };

    // Default to 'uploads/' if the field name is not explicitly mapped
    const uploadFolder = folder[file.fieldname] || "uploads/";
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${basename}-${uniqueSuffix}${ext}`); // Unique filename with timestamp
  },
});

const uploadMultiple = multer({
  storage: multerStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).fields([
  { name: "exam_documents", maxCount: 10 }, // Keep the exam_documents logic
  { name: "graduation_documents" }, // Keep the exam_documents logic
  { name: "primary_mark_sheet", maxCount: 1 }, // Add field for primary mark sheet
  { name: "primary_certificate", maxCount: 1 }, // Add field for primary certificate
  { name: "primary_admit_card", maxCount: 1 }, // Add field for primary certificate
  { name: "secondary_mark_sheet", maxCount: 1 }, // Add field for secondary mark sheet
  { name: "secondary_certificate", maxCount: 1 }, // Add field for secondary certificate
  { name: "secondary_admit_card", maxCount: 1 }, // Add field for secondary certificate
  { name: "passport_doc", maxCount: 1 }, // Add field for passport
  { name: "updated_cv", maxCount: 1 }, // Add field for updated CV
  { name: "profile_assessment_doc", maxCount: 1 }, // Add field for profile assessment
  { name: "pte_cred", maxCount: 1 }, // Add field for PTE Document
  { name: "visaApprovedDocs", maxCount: 10 }, // Add field for PTE Document
  { name: "visaDeclinedDocs", maxCount: 10 }, // Add field for PTE Document
]);

const multerStorageGraduationDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);

    // Default to 'uploads/' if the field name is not explicitly mapped
    const uploadFolder = "uploads/graduationDocuments";
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${basename}-${uniqueSuffix}${ext}`); // Unique filename with timestamp
  },
});

const uploadGraduationDocs = multer({
  storage: multerStorageGraduationDocs,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).any();

const multerStorageWorkDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);

    // Default to 'uploads/' if the field name is not explicitly mapped
    const uploadFolder = "uploads/workDocuments";
    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${basename}-${uniqueSuffix}${ext}`);
  },
});

const uploadWorkDocs = multer({
  storage: multerStorageWorkDocs,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).any();

const multerStorageFundDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);
    const uploadFolder = "uploads/fundDocuments";

    // Check if the folder exists, if not create it
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
      console.log(`Created folder: ${uploadFolder}`);
    }

    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${basename}-${uniqueSuffix}${ext}`);
  },
});

const uploadFundDocs = multer({
  storage: multerStorageFundDocs,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).any();

const multerStorageGapReasonDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);
    const uploadFolder = "uploads/gapDocuments";

    // Check if the folder exists, if not create it
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
      console.log(`Created folder: ${uploadFolder}`);
    }

    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${basename}-${uniqueSuffix}${ext}`);
  },
});

const uploadGapDocs = multer({
  storage: multerStorageGapReasonDocs,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).any();


const multerStorageExamDocs = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Inside multer destination ->", file);
    const uploadFolder = "uploads/examDocuments";

    // Check if the folder exists, if not create it
    if (!fs.existsSync(uploadFolder)) {
      fs.mkdirSync(uploadFolder, { recursive: true });
      console.log(`Created folder: ${uploadFolder}`);
    }

    cb(null, uploadFolder);
  },
  filename: (req, file, cb) => {
    console.log("Inside multer filename ->", file);
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${basename}-${uniqueSuffix}${ext}`);
  },
});

const uploadExamDocs = multer({
  storage: multerStorageExamDocs,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
}).any();

module.exports = {
  uploadMultiple,
  uploadGraduationDocs,
  uploadWorkDocs,
  uploadFundDocs,
  uploadGapDocs,
  uploadExamDocs
};
