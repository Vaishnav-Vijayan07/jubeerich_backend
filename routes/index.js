const express = require("express");

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
const { getAllOfficeTypes, getOfficeTypeById, addOfficeType, updateOfficeType, deleteOfficeType } = require("../controller/office_type_controller");
const { getAllRegions, getRegionById, addRegion, updateRegion, deleteRegion } = require("../controller/region_controller");
const { getAllFlags, getFlagById, addFlag, updateFlag, deleteFlag } = require("../controller/flag_controller");
const { getAllMaritalStatuses, getMaritalStatusById, addMaritalStatus, updateMaritalStatus, deleteMaritalStatus } = require("../controller/marital_status_controller");
const { getAllCountries, getCountryById, addCountry, updateCountry, deleteCountry } = require("../controller/country_controller");
const { getAllUniversities, getUniversityById, addUniversity, updateUniversity, deleteUniversity } = require("../controller/university_controller");
const { getAllPrograms, getProgramById, addProgram, updateProgram, deleteProgram } = require("../controller/program_controller");
const { getAllBranches, getBranchById, addBranch, updateBranch, deleteBranch } = require("../controller/branch_controller");
const { getAllUsersWithDetails, createUserAndPreferences, updateUserAndPreferences, deleteUserAndPreferences } = require("../controller/user_controller");

const router = express.Router();

router.post("/login", login);

router.get("/admin_users", getAllAdminUsers);
router.get("/admin_users/:id", getAdminUsersById);
router.post("/admin_users", addAdminUsers);
router.put("/admin_users/:id", updateAdminUsers);
router.delete("/admin_users/:id", deleteAdminUsers);

router.get("/access_powers", getAllAccessPowers);
router.get("/access_powers/:id", getAccessPowerById);
router.post("/access_powers", addAccessPower);
router.put("/access_powers/:id", updateAccessPower);
router.delete("/access_powers/:id", deleteAccessPower);

router.get("/access_roles", getAllAccessRoles);
router.get("/access_roles/:id", getAccessRoleById);
router.post("/access_roles", createAccessRole);
router.put("/access_roles/:id", updateAccessRole);
router.delete("/access_roles/:id", deleteAccessRole);

router.get("/lead_category", getAllCategories);
router.get("/lead_category/:id", getCategoryById);
router.post("/lead_category", addCategory);
router.put("/lead_category/:id", updateCategory);
router.delete("/lead_category/:id", deleteCategory);

router.get("/lead_source", getAllSources);
router.get("/lead_source/:id", getSourceById);
router.post("/lead_source", addSource);
router.put("/lead_source/:id", updateSource);
router.delete("/lead_source/:id", deleteSource);

router.get("/lead_channel", getAllChannels);
router.get("/lead_channel/:id", getChannelById);
router.post("/lead_channel", addChannel);
router.put("/lead_channel/:id", updateChannel);
router.delete("/lead_channel/:id", deleteChannel);

router.get("/office_type", getAllOfficeTypes);
router.get("/office_type/:id", getOfficeTypeById);
router.post("/office_type", addOfficeType);
router.put("/office_type/:id", updateOfficeType);
router.delete("/office_type/:id", deleteOfficeType);

router.get("/region", getAllRegions);
router.get("/region/:id", getRegionById);
router.post("/region", addRegion);
router.put("/region/:id", updateRegion);
router.delete("/region/:id", deleteRegion);

router.get("/flags", getAllFlags);
router.get("/flags/:id", getFlagById);
router.post("/flags", addFlag);
router.put("/flags/:id", updateFlag);
router.delete("/flags/:id", deleteFlag);

router.get("/marital_status", getAllMaritalStatuses);
router.get("/marital_status/:id", getMaritalStatusById);
router.post("/marital_status", addMaritalStatus);
router.put("/marital_status/:id", updateMaritalStatus);
router.delete("/marital_status/:id", deleteMaritalStatus);

router.get("/country", getAllCountries);
router.get("/country/:id", getCountryById);
router.post("/country", addCountry);
router.put("/country/:id", updateCountry);
router.delete("/country/:id", deleteCountry);

router.get("/university", getAllUniversities);
router.get("/university/:id", getUniversityById);
router.post("/university", addUniversity);
router.put("/university/:id", updateUniversity);
router.delete("/university/:id", deleteUniversity);

router.get("/programs", getAllPrograms);
router.get("/programs/:id", getProgramById);
router.post("/programs", addProgram);
router.put("/programs/:id", updateProgram);
router.delete("/programs/:id", deleteProgram);

router.get("/branches", getAllBranches);
router.get("/branches/:id", getBranchById);
router.post("/branches", addBranch);
router.put("/branches/:id", updateBranch);
router.delete("/branches/:id", deleteBranch);

router.get("/user_details", getAllUsersWithDetails);
router.post("/user_details", createUserAndPreferences);
router.put("/user_details/:id", updateUserAndPreferences);
router.delete("/user_details/:id", deleteUserAndPreferences);

module.exports = router;