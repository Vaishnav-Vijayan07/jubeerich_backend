const express = require("express");
const multer = require("multer");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const admnController = require("../controller/admin");
const authMiddleware = require("../middleware/auth");
const {
  getAllAdminUsers,
  getAdminUsersById,
  addAdminUsers,
  updateAdminUsers,
  deleteAdminUsers,
} = require("../controller/admin_user_controller");
const {
  getAllAccessPowers,
  getAccessPowerById,
  addAccessPower,
  updateAccessPower,
  deleteAccessPower,
} = require("../controller/access_power_controller");
const {
  getAllAccessRoles,
  getAccessRoleById,
  createAccessRole,
  updateAccessRole,
  deleteAccessRole,
} = require("../controller/access_roles_controller");
const { login } = require("../controller/auth_controller");
const {
  getAllCategories,
  getCategoryById,
  addCategory,
  updateCategory,
  deleteCategory,
} = require("../controller/lead_category_controller");
const {
  getAllChannels,
  getChannelById,
  addChannel,
  updateChannel,
  deleteChannel,
} = require("../controller/lead_channel_controller");
const {
  getAllSources,
  getSourceById,
  addSource,
  updateSource,
  deleteSource,
} = require("../controller/lead_source_controller");
const {
  getAllOfficeTypes,
  getOfficeTypeById,
  addOfficeType,
  updateOfficeType,
  deleteOfficeType,
} = require("../controller/office_type_controller");
const {
  getAllRegions,
  getRegionById,
  addRegion,
  updateRegion,
  deleteRegion,
  getAllRegionalManagers,
} = require("../controller/region_controller");
const {
  getAllFlags,
  getFlagById,
  addFlag,
  updateFlag,
  deleteFlag,
} = require("../controller/flag_controller");
const {
  getAllMaritalStatuses,
  getMaritalStatusById,
  addMaritalStatus,
  updateMaritalStatus,
  deleteMaritalStatus,
} = require("../controller/marital_status_controller");
const {
  getAllCountries,
  getCountryById,
  addCountry,
  updateCountry,
  deleteCountry,
} = require("../controller/country_controller");
const {
  getAllUniversities,
  getUniversityById,
  addUniversity,
  updateUniversity,
  deleteUniversity,
} = require("../controller/university_controller");
const {
  getAllPrograms,
  getProgramById,
  addProgram,
  updateProgram,
  deleteProgram,
} = require("../controller/program_controller");
const {
  getAllBranches,
  getBranchById,
  addBranch,
  updateBranch,
  deleteBranch,
} = require("../controller/branch_controller");
const {
  createLead,
  updateLead,
  deleteLead,
  updateUserStatus,
  getStatusWithAccessPowers,
} = require("../controller/user_controller");
const {
  getTasks,
  getStudentBasicInfoById,
  getStudentAcademicInfoById,
  getStudentStudyPreferenceInfoById,
  finishTask,
  getTaskById,
} = require("../controller/task_controller");
const {
  saveStudentBasicInfo,
  saveStudentAcademicInfo,
  saveStudentStudyPreferenceInfo,
} = require("../controller/save_student_details");
const {
  getAllStatuses,
  getStatusById,
  addStatus,
  updateStatus,
  deleteStatus,
} = require("../controller/status_controller");
const {
  statusConfig,
  listAllAccessRolesWithStatuses,
} = require("../controller/status_config");
const { bulkUpload } = require("../controller/lead_import_controller");
const { assignCres, autoAssign } = require("../controller/assign_leads_controller");
const { getLeads, getLeadsByCreatedUser, geLeadsForCreTl, getAssignedLeadsForCreTl, getAllLeads } = require("../controller/lead_listing_controller");

const router = express.Router();

router.post("/login", login);

router.get("/admin_users", [authMiddleware.checkUserAuth], getAllAdminUsers);
router.get(
  "/admin_users/:id",
  [authMiddleware.checkUserAuth],
  getAdminUsersById
);
router.post("/admin_users", addAdminUsers);
router.put(
  "/admin_users/:id",
  [authMiddleware.checkUserAuth],
  updateAdminUsers
);
router.delete(
  "/admin_users/:id",
  [authMiddleware.checkUserAuth],
  deleteAdminUsers
);

router.get(
  "/access_powers",
  [authMiddleware.checkUserAuth],
  getAllAccessPowers
);
router.get(
  "/access_powers/:id",
  [authMiddleware.checkUserAuth],
  getAccessPowerById
);
router.post("/access_powers", addAccessPower);
router.put(
  "/access_powers/:id",
  [authMiddleware.checkUserAuth],
  updateAccessPower
);
router.delete(
  "/access_powers/:id",
  [authMiddleware.checkUserAuth],
  deleteAccessPower
);

router.get("/access_roles", [authMiddleware.checkUserAuth], getAllAccessRoles);
router.get(
  "/access_roles/:id",
  [authMiddleware.checkUserAuth],
  getAccessRoleById
);
router.post("/access_roles", createAccessRole);
router.put(
  "/access_roles/:id",
  [authMiddleware.checkUserAuth],
  updateAccessRole
);
router.delete(
  "/access_roles/:id",
  [authMiddleware.checkUserAuth],
  deleteAccessRole
);

router.get("/lead_category", [authMiddleware.checkUserAuth], getAllCategories);
router.get(
  "/lead_category/:id",
  [authMiddleware.checkUserAuth],
  getCategoryById
);
router.post("/lead_category", [authMiddleware.checkUserAuth], addCategory);
router.put(
  "/lead_category/:id",
  [authMiddleware.checkUserAuth],
  updateCategory
);
router.delete(
  "/lead_category/:id",
  [authMiddleware.checkUserAuth],
  deleteCategory
);

router.get("/lead_source", [authMiddleware.checkUserAuth], getAllSources);
router.get("/lead_source/:id", [authMiddleware.checkUserAuth], getSourceById);
router.post("/lead_source", [authMiddleware.checkUserAuth], addSource);
router.put("/lead_source/:id", [authMiddleware.checkUserAuth], updateSource);
router.delete("/lead_source/:id", [authMiddleware.checkUserAuth], deleteSource);

router.get("/lead_channel", [authMiddleware.checkUserAuth], getAllChannels);
router.get("/lead_channel/:id", [authMiddleware.checkUserAuth], getChannelById);
router.post("/lead_channel", [authMiddleware.checkUserAuth], addChannel);
router.put("/lead_channel/:id", [authMiddleware.checkUserAuth], updateChannel);
router.delete(
  "/lead_channel/:id",
  [authMiddleware.checkUserAuth],
  deleteChannel
);

router.get("/office_type", [authMiddleware.checkUserAuth], getAllOfficeTypes);
router.get(
  "/office_type/:id",
  [authMiddleware.checkUserAuth],
  getOfficeTypeById
);
router.post("/office_type", [authMiddleware.checkUserAuth], addOfficeType);
router.put(
  "/office_type/:id",
  [authMiddleware.checkUserAuth],
  updateOfficeType
);
router.delete(
  "/office_type/:id",
  [authMiddleware.checkUserAuth],
  deleteOfficeType
);

router.get("/region", [authMiddleware.checkUserAuth], getAllRegions);
router.get("/region/:id", [authMiddleware.checkUserAuth], getRegionById);
router.post("/region", [authMiddleware.checkUserAuth], addRegion);
router.put("/region/:id", [authMiddleware.checkUserAuth], updateRegion);
router.delete("/region/:id", [authMiddleware.checkUserAuth], deleteRegion);

router.get("/flags", [authMiddleware.checkUserAuth], getAllFlags);
router.get("/flags/:id", [authMiddleware.checkUserAuth], getFlagById);
router.post("/flags", [authMiddleware.checkUserAuth], addFlag);
router.put("/flags/:id", [authMiddleware.checkUserAuth], updateFlag);
router.delete("/flags/:id", [authMiddleware.checkUserAuth], deleteFlag);

router.get(
  "/marital_status",
  [authMiddleware.checkUserAuth],
  getAllMaritalStatuses
);
router.get(
  "/marital_status/:id",
  [authMiddleware.checkUserAuth],
  getMaritalStatusById
);
router.post(
  "/marital_status",
  [authMiddleware.checkUserAuth],
  addMaritalStatus
);
router.put(
  "/marital_status/:id",
  [authMiddleware.checkUserAuth],
  updateMaritalStatus
);
router.delete(
  "/marital_status/:id",
  [authMiddleware.checkUserAuth],
  deleteMaritalStatus
);

router.get("/country", [authMiddleware.checkUserAuth], getAllCountries);
router.get("/country/:id", [authMiddleware.checkUserAuth], getCountryById);
router.post("/country", [authMiddleware.checkUserAuth], addCountry);
router.put("/country/:id", [authMiddleware.checkUserAuth], updateCountry);
router.delete("/country/:id", [authMiddleware.checkUserAuth], deleteCountry);

router.get("/university", [authMiddleware.checkUserAuth], getAllUniversities);
router.get(
  "/university/:id",
  [authMiddleware.checkUserAuth],
  getUniversityById
);
router.post("/university", [authMiddleware.checkUserAuth], addUniversity);
router.put("/university/:id", [authMiddleware.checkUserAuth], updateUniversity);
router.delete(
  "/university/:id",
  [authMiddleware.checkUserAuth],
  deleteUniversity
);

router.get("/programs", [authMiddleware.checkUserAuth], getAllPrograms);
router.get("/programs/:id", [authMiddleware.checkUserAuth], getProgramById);
router.post("/programs", [authMiddleware.checkUserAuth], addProgram);
router.put("/programs/:id", [authMiddleware.checkUserAuth], updateProgram);
router.delete("/programs/:id", [authMiddleware.checkUserAuth], deleteProgram);

router.get("/branches", [authMiddleware.checkUserAuth], getAllBranches);
router.get("/branches/:id", [authMiddleware.checkUserAuth], getBranchById);
router.post("/branches", [authMiddleware.checkUserAuth], addBranch);
router.put("/branches/:id", [authMiddleware.checkUserAuth], updateBranch);
router.delete("/branches/:id", [authMiddleware.checkUserAuth], deleteBranch);

router.get("/status", [authMiddleware.checkUserAuth], getAllStatuses);
router.get("/status/:id", [authMiddleware.checkUserAuth], getStatusById);
router.post("/status", [authMiddleware.checkUserAuth], addStatus);
router.put("/status/:id", [authMiddleware.checkUserAuth], updateStatus);
router.delete("/status/:id", [authMiddleware.checkUserAuth], deleteStatus);

router.post("/leads", [authMiddleware.checkUserAuth], createLead);
router.get("/getAllleads", [authMiddleware.checkUserAuth], getLeads);
router.get("/leads", [authMiddleware.checkUserAuth], getAllLeads);
router.get(
  "/leads_by_user",
  [authMiddleware.checkUserAuth],
  getLeadsByCreatedUser
);
router.get("/leads_cre_tl", [authMiddleware.checkUserAuth], geLeadsForCreTl);
router.get("/assigned_leads_cre_tl", [authMiddleware.checkUserAuth], getAssignedLeadsForCreTl);
router.post("/assign_cres", [authMiddleware.checkUserAuth], assignCres);
router.post("/auto_assign", [authMiddleware.checkUserAuth], autoAssign);
router.put("/leads/:id", [authMiddleware.checkUserAuth], updateLead);
router.delete("/leads/:id", [authMiddleware.checkUserAuth], deleteLead);

router.get("/tasks", [authMiddleware.checkUserAuth], getTasks);
router.get("/tasks/:id", [authMiddleware.checkUserAuth], getTaskById);
router.put("/finish_task", [authMiddleware.checkUserAuth], finishTask);
router.post(
  "/saveStudentBasicInfo",
  [authMiddleware.checkUserAuth],
  saveStudentBasicInfo
);
router.post(
  "/saveStudentAcademicInfo",
  [authMiddleware.checkUserAuth],
  saveStudentAcademicInfo
);
router.post(
  "/saveStudentStudyPreferenceInfo",
  [authMiddleware.checkUserAuth],
  saveStudentStudyPreferenceInfo
);

router.get(
  "/getStudentBasicInfo/:id",
  [authMiddleware.checkUserAuth],
  getStudentBasicInfoById
);
router.get(
  "/getStudentAcademicInfo/:id",
  [authMiddleware.checkUserAuth],
  getStudentAcademicInfoById
);
router.get(
  "/getStudentStudyPrferenceInfo/:id",
  [authMiddleware.checkUserAuth],
  getStudentStudyPreferenceInfoById
);

router.get(
  "/status_config",
  [authMiddleware.checkUserAuth],
  listAllAccessRolesWithStatuses
);
router.put("/status_config", [authMiddleware.checkUserAuth], statusConfig);

router.get(
  "/lead_status",
  [authMiddleware.checkUserAuth],
  getStatusWithAccessPowers
);
router.put("/lead_status", [authMiddleware.checkUserAuth], updateUserStatus);

//excel import
router.post(
  "/excel_import",
  upload.single("file"),
  [authMiddleware.checkUserAuth],
  bulkUpload
);

router.get("/regional_managers", [authMiddleware.checkUserAuth], getAllRegionalManagers)

module.exports = router;
