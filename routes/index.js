const express = require("express");
const multer = require("multer");
const path = require("path");
const uploadMultiple = require("../middleware/multerConfig");

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const parseData = multer();

// Import controllers and middleware
const admnController = require("../controller/admin");
const authMiddleware = require("../middleware/auth");
const AdminUserController = require("../controller/admin_user_controller");
const AccesPowerController = require("../controller/access_power_controller");
const AccessRolesController = require("../controller/access_roles_controller");
const authController = require("../controller/auth_controller");
const LeadCategoryController = require("../controller/lead_category_controller");
const LeadTypeController = require("../controller/lead_type_controller");
const LeadChannelController = require("../controller/lead_channel_controller");
const LeadSourceController = require("../controller/lead_source_controller");
const OfficeTypeController = require("../controller/office_type_controller");
const RegionController = require("../controller/region_controller");
const FlagController = require("../controller/flag_controller");
const MaritalStatusController = require("../controller/marital_status_controller");
const CountryController = require("../controller/country_controller");
const UniversityController = require("../controller/university_controller");
const ProgramController = require("../controller/program_controller");
const BranchController = require("../controller/branch_controller");
const UserController = require("../controller/user_controller");
const TaskController = require("../controller/task_controller");
const SaveStudentDetailsController = require("../controller/save_student_details");
const StatusController = require("../controller/status_controller");
const StatusConfigController = require("../controller/status_config");
const LeadImportController = require("../controller/lead_import_controller");
const AssignLeadsController = require("../controller/assign_leads_controller");
const LeadListingController = require("../controller/lead_listing_controller");
const FranchiseController = require("../controller/franchise_controller");
const CommentsController = require("../controller/comments_controller");
const OrdinaryTaskController = require("../controller/ordinary_task_controller");
const DocumentsListingController = require("../controller/documents_listing_controller");

// Import additional controllers
const CampusController = require("../controller/campus_controller");
const CourseController = require("../controller/course_controller");
const CourseTypeController = require("../controller/course_type_controller");
const StreamController = require("../controller/stream_controller");
const getDropdownData = require("../controller/drop_down_controller");
const studyPreferencesByUserPrimaryInfoController = require("../controller/study_preference_controller");
const studyPreferencesDetailsController = require("../controller/study_preference_details");
const visaProcessController = require("../controller/visa_process");
const {
  getStudentFundPlanDetails,
  saveStudentPlanDetails,
} = require("../controller/fund_paln_controller");
const {
  saveGapReason,
  getAllGapReasons,
} = require("../controller/gap_reason_controller");

const router = express.Router();

// Auth routes
router.post("/login", authController.login);

// Admin Users routes
router.get(
  "/admin_users",
  [authMiddleware.checkUserAuth],
  AdminUserController.getAllAdminUsers
);
router.get(
  "/admin_users/:id",
  [authMiddleware.checkUserAuth],
  AdminUserController.getAdminUsersById
);
router.post("/admin_users", AdminUserController.addAdminUsers);
router.put(
  "/admin_users/:id",
  [authMiddleware.checkUserAuth],
  AdminUserController.updateAdminUsers
);
router.delete(
  "/admin_users/:id",
  [authMiddleware.checkUserAuth],
  AdminUserController.deleteAdminUsers
);

// Access Powers routes
router.get(
  "/access_powers",
  [authMiddleware.checkUserAuth],
  AccesPowerController.getAllAccessPowers
);
router.get(
  "/access_powers/:id",
  [authMiddleware.checkUserAuth],
  AccesPowerController.getAccessPowerById
);
router.post("/access_powers", AccesPowerController.addAccessPower);
router.put(
  "/access_powers/:id",
  [authMiddleware.checkUserAuth],
  AccesPowerController.updateAccessPower
);
router.delete(
  "/access_powers/:id",
  [authMiddleware.checkUserAuth],
  AccesPowerController.deleteAccessPower
);

// Access Roles routes
router.get(
  "/access_roles",
  [authMiddleware.checkUserAuth],
  AccessRolesController.getAllAccessRoles
);
router.get(
  "/access_roles/:id",
  [authMiddleware.checkUserAuth],
  AccessRolesController.getAccessRoleById
);
router.post("/access_roles", AccessRolesController.createAccessRole);
router.put(
  "/access_roles/:id",
  [authMiddleware.checkUserAuth],
  AccessRolesController.updateAccessRole
);
router.delete(
  "/access_roles/:id",
  [authMiddleware.checkUserAuth],
  AccessRolesController.deleteAccessRole
);

// Lead Categories routes
router.get(
  "/lead_category",
  [authMiddleware.checkUserAuth],
  LeadCategoryController.getAllCategories
);
router.get(
  "/lead_category/:id",
  [authMiddleware.checkUserAuth],
  LeadCategoryController.getCategoryById
);
router.post(
  "/lead_category",
  [authMiddleware.checkUserAuth],
  LeadCategoryController.addCategory
);
router.put(
  "/lead_category/:id",
  [authMiddleware.checkUserAuth],
  LeadCategoryController.updateCategory
);
router.delete(
  "/lead_category/:id",
  [authMiddleware.checkUserAuth],
  LeadCategoryController.deleteCategory
);

// Lead Type routes
router.get(
  "/lead_type",
  [authMiddleware.checkUserAuth],
  LeadTypeController.getAllLeadTypes
);
router.get(
  "/lead_type/:id",
  [authMiddleware.checkUserAuth],
  LeadTypeController.getLeadTypeById
);
router.post(
  "/lead_type",
  [authMiddleware.checkUserAuth],
  LeadTypeController.addLeadType
);
router.put(
  "/lead_type/:id",
  [authMiddleware.checkUserAuth],
  LeadTypeController.updateLeadType
);
router.delete(
  "/lead_type/:id",
  [authMiddleware.checkUserAuth],
  LeadTypeController.deleteLeadType
);

// Lead Sources routes
router.get(
  "/lead_source",
  [authMiddleware.checkUserAuth],
  LeadSourceController.getAllSources
);
router.get(
  "/lead_source/:id",
  [authMiddleware.checkUserAuth],
  LeadSourceController.getSourceById
);
router.post(
  "/lead_source",
  [authMiddleware.checkUserAuth],
  LeadSourceController.addSource
);
router.put(
  "/lead_source/:id",
  [authMiddleware.checkUserAuth],
  LeadSourceController.updateSource
);
router.delete(
  "/lead_source/:id",
  [authMiddleware.checkUserAuth],
  LeadSourceController.deleteSource
);

// Lead Channels routes
router.get(
  "/lead_channel",
  [authMiddleware.checkUserAuth],
  LeadChannelController.getAllChannels
);
router.get(
  "/lead_channel/:id",
  [authMiddleware.checkUserAuth],
  LeadChannelController.getChannelById
);
router.post(
  "/lead_channel",
  [authMiddleware.checkUserAuth],
  LeadChannelController.addChannel
);
router.put(
  "/lead_channel/:id",
  [authMiddleware.checkUserAuth],
  LeadChannelController.updateChannel
);
router.delete(
  "/lead_channel/:id",
  [authMiddleware.checkUserAuth],
  LeadChannelController.deleteChannel
);

// Office Types routes
router.get(
  "/office_type",
  [authMiddleware.checkUserAuth],
  OfficeTypeController.getAllOfficeTypes
);
router.get(
  "/office_type/:id",
  [authMiddleware.checkUserAuth],
  OfficeTypeController.getOfficeTypeById
);
router.post(
  "/office_type",
  [authMiddleware.checkUserAuth],
  OfficeTypeController.addOfficeType
);
router.put(
  "/office_type/:id",
  [authMiddleware.checkUserAuth],
  OfficeTypeController.updateOfficeType
);
router.delete(
  "/office_type/:id",
  [authMiddleware.checkUserAuth],
  OfficeTypeController.deleteOfficeType
);

// Regions routes
router.get(
  "/region",
  [authMiddleware.checkUserAuth],
  RegionController.getAllRegions
);
router.get(
  "/region/:id",
  [authMiddleware.checkUserAuth],
  RegionController.getRegionById
);
router.post(
  "/region",
  [authMiddleware.checkUserAuth],
  RegionController.addRegion
);
router.put(
  "/region/:id",
  [authMiddleware.checkUserAuth],
  RegionController.updateRegion
);
router.delete(
  "/region/:id",
  [authMiddleware.checkUserAuth],
  RegionController.deleteRegion
);

// Flags routes
router.get(
  "/flags",
  [authMiddleware.checkUserAuth],
  FlagController.getAllFlags
);
router.get(
  "/flags/:id",
  [authMiddleware.checkUserAuth],
  FlagController.getFlagById
);
router.post("/flags", [authMiddleware.checkUserAuth], FlagController.addFlag);
router.put(
  "/flags/:id",
  [authMiddleware.checkUserAuth],
  FlagController.updateFlag
);
router.delete(
  "/flags/:id",
  [authMiddleware.checkUserAuth],
  FlagController.deleteFlag
);

// Marital Statuses routes
router.get(
  "/marital_status",
  [authMiddleware.checkUserAuth],
  MaritalStatusController.getAllMaritalStatuses
);
router.get(
  "/marital_status/:id",
  [authMiddleware.checkUserAuth],
  MaritalStatusController.getMaritalStatusById
);
router.post(
  "/marital_status",
  [authMiddleware.checkUserAuth],
  MaritalStatusController.addMaritalStatus
);
router.put(
  "/marital_status/:id",
  [authMiddleware.checkUserAuth],
  MaritalStatusController.updateMaritalStatus
);
router.delete(
  "/marital_status/:id",
  [authMiddleware.checkUserAuth],
  MaritalStatusController.deleteMaritalStatus
);

// Countries routes
router.get(
  "/country",
  [authMiddleware.checkUserAuth],
  CountryController.getAllCountries
);
router.get(
  "/country/:id",
  [authMiddleware.checkUserAuth],
  CountryController.getCountryById
);
router.post(
  "/country",
  [authMiddleware.checkUserAuth],
  CountryController.addCountry
);
router.put(
  "/country/:id",
  [authMiddleware.checkUserAuth],
  CountryController.updateCountry
);
router.delete(
  "/country/:id",
  [authMiddleware.checkUserAuth],
  CountryController.deleteCountry
);

// Universities routes
router.get(
  "/university",
  [authMiddleware.checkUserAuth],
  UniversityController.getAllUniversities
);
router.get(
  "/university/:id",
  [authMiddleware.checkUserAuth],
  UniversityController.getUniversityById
);
router.post(
  "/university",
  [authMiddleware.checkUserAuth],
  UniversityController.addUniversity
);
router.put(
  "/university/:id",
  [authMiddleware.checkUserAuth],
  UniversityController.updateUniversity
);
router.delete(
  "/university/:id",
  [authMiddleware.checkUserAuth],
  UniversityController.deleteUniversity
);

// Programs routes
router.get(
  "/programs",
  [authMiddleware.checkUserAuth],
  ProgramController.getAllPrograms
);
router.get(
  "/programs/:id",
  [authMiddleware.checkUserAuth],
  ProgramController.getProgramById
);
router.post(
  "/programs",
  [authMiddleware.checkUserAuth],
  ProgramController.addProgram
);
router.put(
  "/programs/:id",
  [authMiddleware.checkUserAuth],
  ProgramController.updateProgram
);
router.delete(
  "/programs/:id",
  [authMiddleware.checkUserAuth],
  ProgramController.deleteProgram
);

// Tasks routes
router.get(
  "/ordinary_task",
  [authMiddleware.checkUserAuth],
  OrdinaryTaskController.getAllTasks
);
router.get(
  "/ordinary_task/:id",
  [authMiddleware.checkUserAuth],
  OrdinaryTaskController.getTaskById
);
router.post(
  "/ordinary_task",
  [authMiddleware.checkUserAuth],
  OrdinaryTaskController.addTask
);
router.put(
  "/ordinary_task/:id",
  [authMiddleware.checkUserAuth],
  OrdinaryTaskController.updateTask
);
router.delete(
  "/ordinary_task/:id",
  [authMiddleware.checkUserAuth],
  OrdinaryTaskController.deleteTask
);

// Comments routes
router.get(
  "/comment/:leadId",
  [authMiddleware.checkUserAuth],
  CommentsController.getCommentsByLeadId
);
router.post(
  "/comment",
  [authMiddleware.checkUserAuth],
  CommentsController.createComment
);
router.put(
  "/comment/:id",
  [authMiddleware.checkUserAuth],
  CommentsController.updateComment
);
router.delete(
  "/comment/:id",
  [authMiddleware.checkUserAuth],
  CommentsController.deleteComment
);

// Branches routes
router.get(
  "/branches",
  [authMiddleware.checkUserAuth],
  BranchController.getAllBranches
);
router.get(
  "/branches/:id",
  [authMiddleware.checkUserAuth],
  BranchController.getBranchById
);
router.post(
  "/branches",
  [authMiddleware.checkUserAuth],
  BranchController.addBranch
);
router.put(
  "/branches/:id",
  [authMiddleware.checkUserAuth],
  BranchController.updateBranch
);
router.delete(
  "/branches/:id",
  [authMiddleware.checkUserAuth],
  BranchController.deleteBranch
);

// Franchises routes
router.get(
  "/franchise",
  [authMiddleware.checkUserAuth],
  FranchiseController.getAllFranchises
);
router.get(
  "/franchise/:id",
  [authMiddleware.checkUserAuth],
  FranchiseController.getFranchiseById
);
router.post(
  "/franchise",
  [authMiddleware.checkUserAuth],
  FranchiseController.addFranchise
);
router.put(
  "/franchise/:id",
  [authMiddleware.checkUserAuth],
  FranchiseController.updateFranchise
);
router.delete(
  "/franchise/:id",
  [authMiddleware.checkUserAuth],
  FranchiseController.deleteFranchise
);

// Statuses routes
router.get(
  "/status",
  [authMiddleware.checkUserAuth],
  StatusController.getAllStatuses
);
router.get(
  "/status/:id",
  [authMiddleware.checkUserAuth],
  StatusController.getStatusById
);
router.post(
  "/status",
  [authMiddleware.checkUserAuth],
  StatusController.addStatus
);
router.put(
  "/status/:id",
  [authMiddleware.checkUserAuth],
  StatusController.updateStatus
);
router.delete(
  "/status/:id",
  [authMiddleware.checkUserAuth],
  StatusController.deleteStatus
);

// Leads routes
router.post(
  "/leads",
  uploadMultiple.uploadMultiple,
  [authMiddleware.checkUserAuth],
  UserController.createLead
);
router.get(
  "/getAllleads",
  [authMiddleware.checkUserAuth],
  LeadListingController.getLeads
);
router.get(
  "/leads",
  [authMiddleware.checkUserAuth],
  LeadListingController.getAllLeads
);
router.get(
  "/leads_by_user",
  [authMiddleware.checkUserAuth],
  LeadListingController.getLeadsByCreatedUser
);
router.get(
  "/leads_cre_tl",
  [authMiddleware.checkUserAuth],
  LeadListingController.geLeadsForCreTl
);
router.get(
  "/leads_counsellor_tl",
  [authMiddleware.checkUserAuth],
  LeadListingController.geLeadsForCounsellorTL
);
router.get(
  "/assigned_leads_cre_tl",
  [authMiddleware.checkUserAuth],
  LeadListingController.getAssignedLeadsForCreTl
);
router.get(
  "/assigned_leads_counsellor_tl",
  [authMiddleware.checkUserAuth],
  LeadListingController.getAssignedLeadsForCounsellorTL
);
router.post(
  "/assign_cres",
  [authMiddleware.checkUserAuth],
  AssignLeadsController.assignCres
);
router.post(
  "/auto_assign",
  [authMiddleware.checkUserAuth],
  AssignLeadsController.autoAssign
);
router.post(
  "/branch_auto_assign",
  [authMiddleware.checkUserAuth],
  AssignLeadsController.autoAssignBranchCounselors
);
router.post(
  "/assign_branch_counselor",
  [authMiddleware.checkUserAuth],
  AssignLeadsController.assignBranchCounselors
);
router.post(
  "/assign_counselor_tl",
  [authMiddleware.checkUserAuth],
  AssignLeadsController.assignCounselorTL
);
router.get(
  "/list_manager_branches",
  [authMiddleware.checkUserAuth],
  AssignLeadsController.listBranches
);
router.put(
  "/leads/:id",
  uploadMultiple.uploadMultiple,
  [authMiddleware.checkUserAuth],
  UserController.updateLead
);
router.delete(
  "/leads/:id",
  [authMiddleware.checkUserAuth],
  UserController.deleteLead
);
router.delete(
  "/exams",
  [authMiddleware.checkUserAuth],
  UserController.deleteExams
);

// Tasks routes
router.get("/tasks", [authMiddleware.checkUserAuth], TaskController.getTasks);
router.get(
  "/tasks/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getTaskById
);
router.put(
  "/finish_task",
  [authMiddleware.checkUserAuth],
  TaskController.finishTask
);
router.put(
  "/assign_new_country",
  [authMiddleware.checkUserAuth],
  TaskController.assignNewCountry
);

// Status Config routes
router.get(
  "/status_config",
  [authMiddleware.checkUserAuth],
  StatusConfigController.listAllAccessRolesWithStatuses
);
router.put(
  "/status_config",
  [authMiddleware.checkUserAuth],
  StatusConfigController.statusConfig
);

// Lead Status routes
router.get(
  "/lead_status",
  [authMiddleware.checkUserAuth],
  UserController.getStatusWithAccessPowers
);
router.put(
  "/lead_status",
  [authMiddleware.checkUserAuth],
  UserController.updateUserStatus
);

// Excel Import route
router.post(
  "/excel_import",
  upload.single("file"),
  [authMiddleware.checkUserAuth],
  LeadImportController.bulkUpload
);

// Additional routes
router.get(
  "/regional_managers",
  [authMiddleware.checkUserAuth],
  RegionController.getAllRegionalManagers
);
router.get(
  "/get_all_docs/:id",
  [authMiddleware.checkUserAuth],
  DocumentsListingController.getAllDocuments
);
router.get(
  "/get_all_counsellors",
  [authMiddleware.checkUserAuth],
  AdminUserController.getAllCounsellors
);

router.get(
  "/get_all_counsellors/:id",
  [authMiddleware.checkUserAuth],
  AdminUserController.getAllCounsellorsByBranch
);

router.get(
  "/get_all_counsellors_tl/:id",
  [authMiddleware.checkUserAuth],
  AdminUserController.getAllCounsellorsTLByBranch
);

// Campus routes
router.get(
  "/campuses",
  [authMiddleware.checkUserAuth],
  CampusController.getAllCampuses
);
router.get(
  "/campuses/:id",
  [authMiddleware.checkUserAuth],
  CampusController.getCampusById
);
router.post(
  "/campuses",
  [authMiddleware.checkUserAuth],
  CampusController.addCampus
);
router.put(
  "/campuses/:id",
  [authMiddleware.checkUserAuth],
  CampusController.updateCampus
);
router.delete(
  "/campuses/:id",
  [authMiddleware.checkUserAuth],
  CampusController.deleteCampus
);

// Course routes
router.get(
  "/courses",
  [authMiddleware.checkUserAuth],
  CourseController.getAllCourses
);
router.get(
  "/courses/:id",
  [authMiddleware.checkUserAuth],
  CourseController.getCourseById
);
router.post(
  "/courses",
  [authMiddleware.checkUserAuth],
  CourseController.addCourse
);
router.put(
  "/courses/:id",
  [authMiddleware.checkUserAuth],
  CourseController.updateCourse
);
router.delete(
  "/courses/:id",
  [authMiddleware.checkUserAuth],
  CourseController.deleteCourse
);

// Course Type routes
router.get(
  "/course-types",
  [authMiddleware.checkUserAuth],
  CourseTypeController.getAllCourseTypes
);
router.get(
  "/course-types/:id",
  [authMiddleware.checkUserAuth],
  CourseTypeController.getCourseTypeById
);
router.post(
  "/course-types",
  [authMiddleware.checkUserAuth],
  CourseTypeController.addCourseType
);
router.put(
  "/course-types/:id",
  [authMiddleware.checkUserAuth],
  CourseTypeController.updateCourseType
);
router.delete(
  "/course-types/:id",
  [authMiddleware.checkUserAuth],
  CourseTypeController.deleteCourseType
);

// Stream routes
router.get(
  "/streams",
  [authMiddleware.checkUserAuth],
  StreamController.getAllStreams
);
router.get(
  "/streams/:id",
  [authMiddleware.checkUserAuth],
  StreamController.getStreamById
);
router.post(
  "/streams",
  [authMiddleware.checkUserAuth],
  StreamController.addStream
);
router.put(
  "/streams/:id",
  [authMiddleware.checkUserAuth],
  StreamController.updateStream
);
router.delete(
  "/streams/:id",
  [authMiddleware.checkUserAuth],
  StreamController.deleteStream
);

//Select Dropdown Data route
router.get("/dropdown", [authMiddleware.checkUserAuth], getDropdownData);

router.post(
  "/createStudyPreferencesByUserPrimaryInfo",
  [authMiddleware.checkUserAuth],
  studyPreferencesByUserPrimaryInfoController.createStudyPreferencesByUserPrimaryInfo
);

router.post(
  "/visa_decline_process",
  [authMiddleware.checkUserAuth],
  visaProcessController.saveVisaDeclineProcess
);
router.post(
  "/visa_approve_process",
  [authMiddleware.checkUserAuth],
  visaProcessController.saveVisaApproveProcess
);
router.post(
  "/travel_history",
  [authMiddleware.checkUserAuth],
  visaProcessController.saveTravelHistory
);
router.get(
  "/visa_process/:id",
  [authMiddleware.checkUserAuth],
  visaProcessController.getAllVisaProcess
);
router.delete(
  "/delete_visa_item/:formName/:id",
  [authMiddleware.checkUserAuth],
  visaProcessController.deleteVisaProcessItem
);

//multiple data fileds routes

router.post(
  "/saveStudentBasicInfo",
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.saveStudentBasicInfo
);

router.get(
  "/basicStudentInfo/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getBasicInfoById
);

router.post(
  "/basicStudentInfo",
  [authMiddleware.checkUserAuth],
  TaskController.saveBasicInfo
);

router.get(
  "/studentAcademicInfo/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getStudentAcademicInfoById
);

router.post(
  "/studentAcademicInfo",
  uploadMultiple.uploadMultiple,
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.saveStudentAcademicInfo
);

router.get(
  "/studentExamInfo/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getStudentExamInfoById
);

router.post(
  "/studentExamInfo",
  uploadMultiple.uploadExamDocs,
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.saveStudentExamInfo
);

router.get(
  "/studentFundInfo/:id",
  [authMiddleware.checkUserAuth],
  getStudentFundPlanDetails
);
router.post(
  "/studentFundInfo",
  uploadMultiple.uploadFundDocs,
  [authMiddleware.checkUserAuth],
  saveStudentPlanDetails
);

router.get(
  "/studentWorkInfo/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getStudentWorkInfoById
);
router.post(
  "/studentWorkInfo",
  uploadMultiple.uploadWorkDocs,
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.saveStudentWorkInfo
);

router.get("/gapReason/:id/:type", [authMiddleware.checkUserAuth], getAllGapReasons);

router.post(
  "/gapReason",
  uploadMultiple.uploadGapDocs,
  [authMiddleware.checkUserAuth],
  saveGapReason
);

router.delete(
  "/basic_info/:type/:id",
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.deleteStudentAcademicInfo
);
router.post(
  "/saveStudentStudyPreferenceInfo",
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.saveStudentStudyPreferenceInfo
);
router.post(
  "/studentPrimaryEducation/:type",
  [authMiddleware.checkUserAuth],
  uploadMultiple.uploadMultiple,
  SaveStudentDetailsController.saveStudentPrimaryEducation
);
router.get(
  "/studentPrimaryEducation/:student_id",
  [authMiddleware.checkUserAuth],
  SaveStudentDetailsController.studentPrimaryEducationDetails
);

router.post(
  "/graduationDetails",
  [authMiddleware.checkUserAuth],
  uploadMultiple.uploadGraduationDocs,
  SaveStudentDetailsController.saveStudentGraduationDetails
);

router.get(
  "/getStudentBasicInfo/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getStudentBasicInfoById
);

router.get(
  "/getStudentStudyPrferenceInfo/:id",
  [authMiddleware.checkUserAuth],
  TaskController.getStudentStudyPreferenceInfoById
);

router.post(
  "/study_preferences_details",
  [authMiddleware.checkUserAuth],
  studyPreferencesDetailsController.createStudyPreferenceDetails
);
router.get(
  "/study_preferences_details/:id",
  [authMiddleware.checkUserAuth],
  studyPreferencesDetailsController.getStudyPreferenceDetails
);
router.put(
  "/study_preferences_details/:id",
  [authMiddleware.checkUserAuth],
  studyPreferencesDetailsController.updateStudyPreferenceDetails
);

module.exports = router;
