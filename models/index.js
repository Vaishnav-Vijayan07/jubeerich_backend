const { Sequelize, DataTypes, Op } = require("sequelize");
const dotenv = require("dotenv");

dotenv.config();

const sequelize = new Sequelize(process.env.DB_dbname, process.env.DB_user, process.env.DB_pss, {
  dialect: "postgres",
  host: process.env.DB_host,
  port: process.env.DB_port, // Ensure you have DB_port in your .env file for PostgreSQL
  minifyAliases: true,
});

const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;
db.Op = Op;

db.accessRoles = require("./accessRoles")(sequelize, Sequelize);
db.accessPowers = require("./accessPowers")(sequelize, Sequelize);
db.leadType = require("./leadType")(sequelize, Sequelize);
db.leadCategory = require("./leadCategory")(sequelize, Sequelize);
db.leadChannel = require("./leadChannel")(sequelize, Sequelize);
db.leadSource = require("./leadSource")(sequelize, Sequelize);
db.officeType = require("./officeType")(sequelize, Sequelize);
db.region = require("./region")(sequelize, Sequelize);
db.flag = require("./flag")(sequelize, Sequelize);
db.maritalStatus = require("./maritalStatus")(sequelize, Sequelize);
db.country = require("./country")(sequelize, Sequelize);
db.university = require("./university")(sequelize, Sequelize);
db.programs = require("./programs")(sequelize, Sequelize);
db.branches = require("./branch")(sequelize, Sequelize);
db.userPrimaryInfo = require("./userPrimaryInfo")(sequelize, Sequelize);
db.userBasicInfo = require("./userBasicInfo")(sequelize, Sequelize);
db.userAcademicInfo = require("./userAcademicInfo")(sequelize, Sequelize);
db.tasks = require("./task")(sequelize, Sequelize);
db.userBranches = require("./userBranches")(sequelize, Sequelize);
db.status = require("./status")(sequelize, Sequelize);
db.statusAccessRoles = require("./statusAccessRoles")(sequelize, Sequelize);
db.userContries = require("./userContries")(sequelize, Sequelize);
db.userCounselors = require("./userCounselors")(sequelize, Sequelize);
db.userExams = require("./userExams")(sequelize, Sequelize);
db.franchise = require("./franchise")(sequelize, Sequelize);
db.comments = require("./comments")(sequelize, Sequelize);
db.ordinaryTasks = require("./ordinaryTask")(sequelize, Sequelize);
db.adminUsers = require("./adminUsers")(sequelize, Sequelize);
db.academicInfos = require("./academicInfo")(sequelize, Sequelize);
db.workInfos = require("./workInfos")(sequelize, Sequelize);
db.previousVisaDecline = require("./previousVisaDecline")(sequelize, Sequelize);
db.previousVisaApprove = require("./previousVisaApproval")(sequelize, Sequelize);
db.travelHistory = require("./travelHistory")(sequelize, Sequelize);
db.campusCourse = require("./campusCourse")(sequelize, Sequelize);
db.fundPlan = require("./fundPlan")(sequelize, Sequelize);
db.gapReason = require("./reasonForGap")(sequelize, Sequelize);

// course
db.campus = require("./campus")(sequelize, Sequelize);
db.course = require("./course")(sequelize, Sequelize);
db.stream = require("./stream")(sequelize, Sequelize);
db.courseType = require("./courseType")(sequelize, Sequelize);
db.studyPreference = require("./studyPreference")(sequelize, Sequelize);
db.studyPreferenceDetails = require("./studyPreferenceDetails")(sequelize, Sequelize);
db.graduationDetails = require("./graduationDetails")(sequelize, Sequelize);
db.educationDetails = require("./educationDetails")(sequelize, Sequelize);
db.studentAdditionalDocs = require("./studentAdditionalDocs")(sequelize, Sequelize);
db.passportDetails = require("./passportDetails")(sequelize, Sequelize);
db.familyInformation = require("./familyInformation")(sequelize, Sequelize);
db.EmploymentHistory = require("./employmentHistory")(sequelize, Sequelize);
db.userHistory = require("./history")(sequelize, Sequelize);
db.application = require("./application")(sequelize, Sequelize);
db.eligibilityChecks = require("./eligibility_checks")(sequelize, Sequelize);

//Associations

db.application.hasOne(db.eligibilityChecks, {
  foreignKey: "application_id",
  as: "eligibilityChecks",
});

db.eligibilityChecks.belongsTo(db.application, {
  foreignKey: "application_id",
  as: "application",
});

db.application.belongsTo(db.studyPreferenceDetails, {
  foreignKey: "studyPrefernceId",
  as: "studyPreferenceDetails",
});

db.studyPreferenceDetails.hasMany(db.application, {
  foreignKey: "studyPrefernceId",
  as: "applications",
});

db.application.belongsTo(db.adminUsers, {
  foreignKey: "assigned_user",
  as: "application",
});

db.adminUsers.hasMany(db.application, {
  foreignKey: "assigned_user",
  as: "assigned_applications",
});

db.country.hasMany(db.comments, {
  foreignKey: "country_id",
  as: "comments",
});

db.comments.belongsTo(db.country, { foreignKey: "country_id", as: "country" });

db.userHistory.belongsTo(db.country, {
  foreignKey: "country_id",
  as: "country",
});

db.country.hasMany(db.userHistory, {
  foreignKey: "country_id",
  as: "userHistories",
});

db.userPrimaryInfo.hasMany(db.userHistory, {
  foreignKey: "student_id",
  as: "userHistories",
});

db.userHistory.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "user",
});

db.userPrimaryInfo.hasMany(db.gapReason, {
  foreignKey: "student_id",
  as: "gapReasons",
});

db.gapReason.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "student",
});

db.userPrimaryInfo.hasMany(db.fundPlan, {
  foreignKey: "student_id",
  as: "fundPlan",
});

db.fundPlan.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "student",
});

db.graduationDetails.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "student", // This represents the user/student who owns this education detail
});

db.userPrimaryInfo.hasMany(db.graduationDetails, {
  foreignKey: "student_id",
  as: "graduationDetails", // This will hold the user's multiple education records
});

db.educationDetails.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "student", // This represents the user/student who owns this education detail
});

db.userPrimaryInfo.belongsTo(db.adminUsers, {
  foreignKey: "assigned_branch_counselor",
  as: "assigned_branch_counselor_name", // This represents the user/student who owns this education detail
});

db.userPrimaryInfo.hasMany(db.educationDetails, {
  foreignKey: "student_id",
  as: "educationDetails", // This will hold the user's multiple education records
});

db.studyPreference.hasMany(db.studyPreferenceDetails, {
  foreignKey: "studyPreferenceId", // foreign key in studyPreferenceDetails
  as: "studyPreferenceDetails",
});

db.studyPreferenceDetails.belongsTo(db.studyPreference, {
  foreignKey: "studyPreferenceId", // foreign key in studyPreferenceDetails
  as: "studyPreference",
});

db.studyPreferenceDetails.belongsTo(db.course, {
  foreignKey: "courseId",
  as: "preferred_courses",
});

db.course.hasMany(db.studyPreferenceDetails, {
  foreignKey: "courseId",
  as: "course_preferred",
});

db.studyPreferenceDetails.belongsTo(db.campus, {
  foreignKey: "campusId",
  as: "preferred_campus",
});

db.campus.hasMany(db.studyPreferenceDetails, {
  foreignKey: "campusId",
  as: "campus_preferred",
});

db.studyPreferenceDetails.belongsTo(db.university, {
  foreignKey: "universityId",
  as: "preferred_university",
});

db.university.hasMany(db.studyPreferenceDetails, {
  foreignKey: "universityId",
  as: "university_preferred",
});

db.studyPreferenceDetails.belongsTo(db.stream, {
  foreignKey: "streamId",
  as: "preferred_stream",
});

db.stream.hasMany(db.studyPreferenceDetails, {
  foreignKey: "streamId",
  as: "stream_preferred",
});

db.studyPreferenceDetails.belongsTo(db.courseType, {
  foreignKey: "courseTypeId",
  as: "preferred_course_type",
});

db.courseType.hasMany(db.studyPreferenceDetails, {
  foreignKey: "courseTypeId",
  as: "course_type_preferred",
});

// course relation
db.university.hasMany(db.campus, { foreignKey: "university_id" });
db.campus.belongsTo(db.university, { foreignKey: "university_id" });

db.stream.hasMany(db.course, { foreignKey: "stream_id" });
db.course.belongsTo(db.stream, { foreignKey: "stream_id" });

db.courseType.hasMany(db.course, { foreignKey: "course_type_id" });
db.course.belongsTo(db.courseType, { foreignKey: "course_type_id" });

db.adminUsers.belongsTo(db.accessRoles, { foreignKey: "role_id" });
db.accessRoles.belongsTo(db.adminUsers, {
  foreignKey: "updated_by",
  as: "updatedByUser",
});

// AdminUser model
db.adminUsers.belongsTo(db.country, { foreignKey: "country_id" });

// comments
db.comments.belongsTo(db.adminUsers, { foreignKey: "user_id", as: "user" });
db.comments.belongsTo(db.userPrimaryInfo, {
  foreignKey: "lead_id",
  as: "lead",
});

// Country model
db.country.hasMany(db.adminUsers, { foreignKey: "country_id" });

db.userPrimaryInfo.hasMany(db.userExams, {
  foreignKey: "student_id",
  as: "exams",
});

db.userExams.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "user",
});

db.accessRoles.belongsToMany(db.accessPowers, {
  through: "accessRolePowers",
  as: "powers",
  foreignKey: "role_id",
});

db.accessPowers.belongsToMany(db.accessRoles, {
  through: "accessRolePowers",
  as: "roles",
  foreignKey: "power_id",
});

db.leadChannel.belongsTo(db.leadSource, {
  foreignKey: "source_id",
  as: "source",
});

db.userPrimaryInfo.belongsTo(db.leadType, {
  as: "type_name",
  foreignKey: "lead_type_id",
});

db.userPrimaryInfo.belongsTo(db.adminUsers, {
  as: "updated_by_user",
  foreignKey: "updated_by",
});

db.userPrimaryInfo.belongsTo(db.leadSource, {
  as: "source_name",
  foreignKey: "source_id",
});
db.userPrimaryInfo.belongsTo(db.leadChannel, {
  as: "channel_name",
  foreignKey: "channel_id",
});
db.userPrimaryInfo.belongsTo(db.country, {
  as: "country_name",
  foreignKey: "preferred_country",
});
db.userPrimaryInfo.belongsTo(db.officeType, {
  as: "office_type_name",
  foreignKey: "office_type",
});
db.userPrimaryInfo.belongsTo(db.region, {
  as: "region_name",
  foreignKey: "region",
});
db.userPrimaryInfo.belongsTo(db.adminUsers, {
  as: "counsiler_name",
  foreignKey: "counsiler_id",
});

db.userPrimaryInfo.belongsTo(db.adminUsers, {
  as: "cre_name",
  foreignKey: "assigned_cre",
});
db.userPrimaryInfo.belongsTo(db.branches, {
  as: "branch_name",
  foreignKey: "branch_id",
});

db.branches.belongsTo(db.officeType, {
  as: "office_name",
  foreignKey: "office_type",
});

db.branches.belongsTo(db.region, {
  as: "region_name",
  foreignKey: "region_id",
});

db.tasks.belongsTo(db.userPrimaryInfo, {
  as: "student_name",
  foreignKey: "studentId",
});
db.tasks.belongsTo(db.adminUsers, { as: "user_name", foreignKey: "userId" });

db.userPrimaryInfo.belongsTo(db.status, {
  as: "status",
  foreignKey: "status_id",
});
// In adminUsers model
db.adminUsers.hasMany(db.tasks, { foreignKey: "userId" });

// In tasks model
db.tasks.belongsTo(db.adminUsers, { foreignKey: "userId" });

db.programs.belongsTo(db.university, {
  as: "university_name",
  foreignKey: "university_id",
});

db.university.belongsTo(db.country, {
  as: "country_name",
  foreignKey: "country_id",
});

db.status.belongsToMany(db.accessRoles, {
  through: "status_access_roles",
  foreignKey: "status_id",
});
db.accessRoles.belongsToMany(db.status, {
  through: "status_access_roles",
  foreignKey: "access_role_id",
});

// UserPrimaryInfo and Country associations (many-to-many)
db.userPrimaryInfo.belongsToMany(db.country, {
  through: {
    model: "user_countries",
    attributes: ["followup_date"],
  },
  foreignKey: "user_primary_info_id",
  as: "preferredCountries",
  onDelete: "CASCADE",
});
db.country.belongsToMany(db.userPrimaryInfo, {
  through: {
    model: "user_countries",
    attributes: ["followup_date"], // Specify the attributes you want to include
  },
  foreignKey: "country_id",
  as: "users",
  onDelete: "CASCADE",
});

// UserPrimaryInfo and AdminUser (Counselors) associations (many-to-many)
db.userPrimaryInfo.belongsToMany(db.adminUsers, {
  through: "user_counselors",
  foreignKey: "user_id",
  otherKey: "counselor_id",
  as: "counselors",
  onDelete: "CASCADE",
});
db.adminUsers.belongsToMany(db.userPrimaryInfo, {
  through: "user_counselors",
  foreignKey: "counselor_id",
  otherKey: "user_id",
  as: "counseledUsers",
  onDelete: "CASCADE",
});

// region
db.region.belongsTo(db.adminUsers, {
  as: "regional_manager",
  foreignKey: "regional_manager_id",
});

db.franchise.hasMany(db.adminUsers, {
  foreignKey: "franchise_id",
  as: "adminUsers",
});

db.adminUsers.belongsTo(db.franchise, {
  foreignKey: "franchise_id",
  as: "franchise", // Alias for accessing the associated Franchise
});

// Association for AcademicInfos and UserPrimaryInfo
db.academicInfos.belongsTo(db.userPrimaryInfo, {
  foreignKey: "user_id",
  as: "userAcademicInfo",
});

db.userPrimaryInfo.hasMany(db.academicInfos, {
  foreignKey: "user_id",
  as: "userAcademicInfos",
});

// Association for PreviousVisaDecline and UserPrimaryInfo
db.previousVisaDecline.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "previousVisaDecline",
});

db.userPrimaryInfo.hasMany(db.previousVisaDecline, {
  foreignKey: "student_id",
  as: "previousVisaDeclines",
});

// Association for PreviousVisaDecline and Country
db.previousVisaDecline.belongsTo(db.country, {
  foreignKey: "country_id",
  as: "declined_country",
});

db.country.hasMany(db.previousVisaDecline, {
  foreignKey: "country_id",
  as: "previousVisaDeclinesCountries",
});

// Association for PreviousVisaDecline and Courses
db.previousVisaDecline.belongsTo(db.course, {
  foreignKey: "course_applied",
  as: "declined_course",
});

db.course.hasMany(db.previousVisaDecline, {
  foreignKey: "course_applied",
  as: "previousVisaDeclinesCourses",
});

// Association for PreviousVisaDecline and Universities
db.previousVisaDecline.belongsTo(db.university, {
  foreignKey: "university_applied",
  as: "declined_university_applied",
});

db.university.hasMany(db.previousVisaDecline, {
  foreignKey: "university_applied",
  as: "previousVisaDeclinesUniversityApplied",
});

// Association for PreviousVisaApprove and UserPrimaryInfo
db.previousVisaApprove.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "previousVisaApprove",
});

db.userPrimaryInfo.hasMany(db.previousVisaApprove, {
  foreignKey: "student_id",
  as: "previousVisaApprovals",
});

// Association for PreviousVisaApprove and Countries
db.previousVisaApprove.belongsTo(db.country, {
  foreignKey: "country_id",
  as: "approved_country",
});

db.country.hasMany(db.previousVisaApprove, {
  foreignKey: "country_id",
  as: "previousVisaApprovalsCountries",
});

// Association for PreviousVisaApprove and Courses
db.previousVisaApprove.belongsTo(db.course, {
  foreignKey: "course_applied",
  as: "approved_course",
});

db.course.hasMany(db.previousVisaApprove, {
  foreignKey: "course_applied",
  as: "previousVisaApprovalsCourses",
});

// Association for PreviousVisaApprove and University
db.previousVisaApprove.belongsTo(db.university, {
  foreignKey: "university_applied",
  as: "approved_university_applied",
});

db.university.hasMany(db.previousVisaApprove, {
  foreignKey: "university_applied",
  as: "previousVisaApprovalsUniversityApplied",
});

// Association for TravelHistory and UserPrimaryInfo
db.travelHistory.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "travelHistory",
});

db.userPrimaryInfo.hasMany(db.travelHistory, {
  foreignKey: "student_id",
  as: "travelHistories",
});

// Association for TravelHistory and Countries
db.travelHistory.belongsTo(db.country, {
  foreignKey: "country_id",
  as: "travelHistoryCountry",
});

db.country.hasMany(db.travelHistory, {
  foreignKey: "student_id",
  as: "travelHistoryCountries",
});

// Association for WorkInfos and UserPrimaryInfo
db.workInfos.belongsTo(db.userPrimaryInfo, {
  foreignKey: "user_id",
  as: "userWorkInfo",
});

db.userPrimaryInfo.hasMany(db.workInfos, {
  foreignKey: "user_id",
  as: "userWorkInfos",
});

db.userPrimaryInfo.hasMany(db.studyPreference, {
  foreignKey: "userPrimaryInfoId",
  as: "studyPreferences",
});
db.country.hasMany(db.studyPreference, {
  foreignKey: "countryId",
  as: "studyPreferences",
});
db.studyPreference.belongsTo(db.userPrimaryInfo, {
  foreignKey: "userPrimaryInfoId",
  as: "userPrimaryInfo",
});
db.studyPreference.belongsTo(db.country, {
  foreignKey: "countryId",
  as: "country",
});

db.leadSource.belongsTo(db.leadType, {
  foreignKey: "lead_type_id",
  as: "leadType",
});

// campus course association
db.campus.belongsToMany(db.course, {
  through: "campus_course",
  foreignKey: "campus_id",
  otherKey: "course_id",
  as: "courses",
});

db.course.belongsToMany(db.campus, {
  through: "campus_course",
  foreignKey: "course_id",
  otherKey: "campus_id",
  as: "campuses",
});

db.EmploymentHistory.belongsTo(db.adminUsers, {
  foreignKey: "updated_by",
  as: "employmentHistory",
});

db.adminUsers.hasMany(db.EmploymentHistory, {
  foreignKey: "updated_by",
  as: "employmentHistories",
});

db.userPrimaryInfo.hasOne(db.EmploymentHistory, {
  foreignKey: "student_id",
  as: "userEmploymentHistories",
});

db.EmploymentHistory.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "userEmploymentHistory",
});

db.passportDetails.belongsTo(db.userPrimaryInfo, {
  foreignKey: "user_id",
  as: "passport_name",
});

db.userPrimaryInfo.hasMany(db.passportDetails, {
  foreignKey: "user_id",
  as: "passportDetails",
});

db.familyInformation.belongsTo(db.userPrimaryInfo, {
  foreignKey: "user_id",
  as: "user_family",
});

db.userPrimaryInfo.hasMany(db.familyInformation, {
  foreignKey: "user_id",
  as: "familyDetails",
});

db.userBasicInfo.belongsTo(db.userPrimaryInfo, {
  foreignKey: "user_id",
  as: "student_basic_info",
});

db.userPrimaryInfo.hasOne(db.userBasicInfo, {
  foreignKey: "user_id",
  as: "basic_info_details",
});

db.maritalStatus.hasMany(db.userBasicInfo, {
  foreignKey: "marital_status",
  as: "students_maritals",
});

db.userBasicInfo.belongsTo(db.maritalStatus, {
  foreignKey: "marital_status",
  as: "marital_status_details",
});

db.studentAdditionalDocs.belongsTo(db.userPrimaryInfo, {
  foreignKey: "student_id",
  as: "student_docs",
});

db.userPrimaryInfo.hasOne(db.studentAdditionalDocs, {
  foreignKey: "student_id",
  as: "additional_docs",
});

// Add beforeDestroy hook to UserPrimaryInfo
db.userPrimaryInfo.addHook("beforeDestroy", async (user) => {
  // Delete from user_countries
  await db.userContries.destroy({
    where: { user_primary_info_id: user.id },
  });

  // Delete from user_counselors
  await db.userCounselors.destroy({
    where: { user_id: user.id },
  });
});

// Add beforeDestroy hook to Country
db.country.addHook("beforeDestroy", async (country) => {
  // Delete from user_countries
  await db.userContries.destroy({
    where: { country_id: country.id },
  });
});

module.exports = db;
