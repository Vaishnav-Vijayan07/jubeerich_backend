const { FOLLOWUP_ID } = require("../constants/ids");
const stageDatas = require("../constants/stage_data");
const db = require("../models");
const { addLeadHistory, getRoleForUserHistory } = require("../utils/academic_query_helper");
const sequelize = db.sequelize;

exports.getKycDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const { userDecodeId } = req;

    const { country_id } = await db.adminUsers.findByPk(userDecodeId);

    const personalDetails = await db.userPrimaryInfo.findOne({
      where: { id: id },
      attributes: ["id", "full_name", "email", "phone", "source_id", "city", "channel_id", "branch_id", "assigned_branch_counselor"],
    });

    if (!personalDetails) {
      throw new Error("User not found");
    }

    const [
      leadSource,
      branches,
      assignedCounselor,
      createdBy,
      educationDetails,
      studyPreferences,
      previousVisaDeclines,
      previousVisaApprovals,
      travelHistories,
      basicInfoDetails,
      passportDetails,
      workInfos,
      familyDetails,
      fundPlan,
      exams,
      graduationDetails,
      gapReasons,
      userEmploymentHistories,
      channel_name,
    ] = await Promise.all([
      personalDetails.getSource_name(),
      personalDetails.getBranch_name(),
      personalDetails.getAssigned_branch_counselor_name(),
      personalDetails.getCre_name(),
      personalDetails.getEducationDetails({ where: { student_id: id } }),
      personalDetails.getStudyPreferences({
        where: { countryId: country_id },
        include: [
          {
            model: db.studyPreferenceDetails,
            as: "studyPreferenceDetails",
            required: true,
            include: [
              {
                model: db.course,
                as: "preferred_courses",
                required: true,
                include: [
                  {
                    model: db.campus,
                    through: "campus_course",
                    as: "campuses",
                    required: true,
                  },
                ],
              },
              {
                model: db.campus,
                as: "preferred_campus",
                required: true,
              },
              {
                model: db.application,
                as: "applications",
                required: true,
              },
            ],
          },
        ],
      }),
      personalDetails.getPreviousVisaDeclines({
        where: { student_id: id },
        include: [
          {
            model: db.country,
            as: "declined_country",
            required: false,
            attributes: ["country_name", "country_code"],
          },
          {
            model: db.course,
            as: "declined_course",
            required: false,
            attributes: ["course_name"],
          },
          {
            model: db.university,
            as: "declined_university_applied",
            required: false,
          },
        ],
      }),
      personalDetails.getPreviousVisaApprovals({
        where: { student_id: id },
        include: [
          {
            model: db.country,
            as: "approved_country",
            required: false,
            attributes: ["country_name", "country_code"],
          },
          {
            model: db.course,
            as: "approved_course",
            required: false,
            attributes: ["course_name"],
          },
          {
            model: db.university,
            as: "approved_university_applied",
            required: false,
          },
        ],
      }),
      personalDetails.getTravelHistories({
        where: { student_id: id },
        include: [
          {
            model: db.country,
            as: "travelHistoryCountry",
            required: false,
            attributes: ["country_name", "country_code"],
          },
        ],
      }),
      personalDetails.getBasic_info_details({
        where: { user_id: id },
        include: [
          {
            model: db.maritalStatus,
            as: "marital_status_details",
            required: false,
            attributes: ["marital_status_name"],
          },
        ],
      }),
      personalDetails.getPassportDetails({ where: { user_id: id } }),
      personalDetails.getUserWorkInfos({ where: { user_id: id } }),
      personalDetails.getFamilyDetails({ where: { user_id: id } }),
      personalDetails.getFundPlan({ where: { student_id: id } }),
      personalDetails.getExams({ where: { student_id: id } }),
      personalDetails.getGraduationDetails({ where: { student_id: id } }),
      personalDetails.getGapReasons({ where: { student_id: id } }),
      personalDetails.getUserEmploymentHistories({ where: { student_id: id } }),
      personalDetails.getChannel_name(),
    ]);

    if (!personalDetails) {
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      status: true,
      personalDetails: personalDetails,
      leadSource: leadSource,
      branches: branches,
      assignedCounselor: assignedCounselor,
      createdBy: createdBy,
      educationDetails: educationDetails,
      studyPreferences: studyPreferences,
      previousVisaDeclines: previousVisaDeclines,
      previousVisaApprovals: previousVisaApprovals,
      travelHistories: travelHistories,
      basicInfoDetails: basicInfoDetails,
      passportDetails: passportDetails,
      workInfos: workInfos,
      familyDetails: familyDetails,
      fundPlan: fundPlan,
      exams: exams,
      graduationDetails: graduationDetails,
      gapReasons: gapReasons,
      userEmploymentHistories: userEmploymentHistories,
      channel_name: channel_name,
      message: "Data retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.proceedToKyc = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { student_id, task_id, assigned_country } = req.body;
    const { userDecodeId, role_id } = req;

    const student = await db.userPrimaryInfo.findByPk(student_id, { transaction });
    if (!student) {
      return res.status(404).json({
        status: false,
        message: "Student not found.",
      });
    }

    const { country_id } = await db.adminUsers.findByPk(userDecodeId, { transaction });

    let dynamicWhere = {
      countryId: role_id == process.env.FRANCHISE_COUNSELLOR_ID || role_id == process.env.BRANCH_COUNSELLOR_ID ? assigned_country : country_id,
      userPrimaryInfoId: student_id,
    };
    
    const updateStatusCountry = role_id == process.env.FRANCHISE_COUNSELLOR_ID || role_id == process.env.BRANCH_COUNSELLOR_ID || role_id == process.env.BRANCH_COUNSELLOR_ID ? assigned_country : country_id;
    
    const statusRes = await updateClosedStatus(student_id, updateStatusCountry);
    
    if (!statusRes) {
      return res.status(404).json({
        status: false,
        message: "Status not updated",
      });
    }

    const studyPrefDetails = await db.studyPreferenceDetails.findAll({
      include: [
        {
          model: db.studyPreference,
          as: "studyPreference",
          where: dynamicWhere,
          attributes: [],
        },
      ],
      attributes: ["id"],
      transaction,
    });

    console.log("studyPrefDetails ======>", studyPrefDetails);

    if (studyPrefDetails.length > 0) {
      const applicationsToCreate = [];
      const applicationsToUpdate = [];

      for (const detail of studyPrefDetails) {
        const existingApplications = await db.application.findAll({
          where: { studyPrefernceId: detail.id },
          attributes: ["id"],
        });

        if (existingApplications.length > 0) {
          applicationsToUpdate.push(...existingApplications.map((app) => app.id));
        } else {
          applicationsToCreate.push({ studyPrefernceId: detail.id, counsellor_id: userDecodeId });
        }
      }

      console.log("applicationsToCreate ======>", applicationsToCreate);
      console.log("applicationsToUpdate ======>", applicationsToUpdate);

      if (applicationsToCreate.length > 0) {
        // Insert new applications and retrieve the newly created records
        const createdApplications = await db.application.bulkCreate(applicationsToCreate, {
          transaction,
          returning: true, // Use `returning` to get the created records with IDs
        });

        // Prepare eligibility data using the IDs of the created applications
        const eligibilityData = createdApplications.map((app) => ({
          application_id: app.id,
        }));

        await db.eligibilityChecks.bulkCreate(eligibilityData, { transaction });
      }

      if (applicationsToUpdate.length > 0) {
        await db.application.update(
          { is_rejected_kyc: false, application_status: "pending" },
          {
            where: { id: { [db.Sequelize.Op.in]: applicationsToUpdate } },
            transaction,
          }
        );
      }
    } else {
      throw new Error("Choose atleast one study preference");
    }

    const [setIsProceed] = await db.tasks.update(
      {
        is_proceed_to_kyc: true,
        isCompleted: true,
      },
      {
        where: {
          id: task_id,
        },
        transaction,
      }
    );

    if (setIsProceed === 0) {
      throw new Error("Updation Failed");
    }

    await student.update({
      stage: stageDatas.kyc,
    });

    const { role_name, country_id: country } = await getRoleForUserHistory(userDecodeId);
    await addLeadHistory(student_id, `Task moved to KYC verfication by ${role_name}`, userDecodeId, country, transaction);

    await transaction.commit();

    res.status(200).json({
      status: true,
      data: studyPrefDetails,
      message: "Data retrieved successfully",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.kycPendingDetails = async (req, res) => {
  try {
    const { userDecodeId } = req;

    const { type } = req.query;

    console.log(type);

    if (type !== "application_manager_pending" && type !== "application_manager_assigned" && type !== "country_manager") {
      return res.status(400).json({
        status: false,
        message: "Invalid type",
      });
    }

    let applicationData;

    console.log(type.includes("application_manager"));

    if (type.includes("application_manager")) {
      let isPending = type == "application_manager_pending";

      let dynamicWhere;

      if (isPending) {
        dynamicWhere = {
          [db.Sequelize.Op.and]: [{ proceed_to_application_manager: true }, { assigned_user: { [db.Sequelize.Op.eq]: null } }],
        };
      } else {
        dynamicWhere = {
          [db.Sequelize.Op.and]: [{ proceed_to_application_manager: true }, { assigned_user: { [db.Sequelize.Op.ne]: null } }],
        };
      }

      console.log("dynamicWhere", dynamicWhere);

      applicationData = await db.application.findAll({
        include: [
          {
            model: db.adminUsers,
            as: "application",
            required: false,
            attributes: ["id", "name"],
          },
          {
            model: db.studyPreferenceDetails,
            as: "studyPreferenceDetails",
            attributes: ["id"],
            required: true, // Set this association as required
            include: [
              {
                model: db.studyPreference,
                as: "studyPreference",
                required: true, // Set this association as required
                include: [
                  {
                    model: db.country,
                    as: "country",
                    attributes: ["country_name"],
                    required: true, // Set this association as required
                  },
                  {
                    model: db.userPrimaryInfo,
                    as: "userPrimaryInfo",
                    attributes: ["assign_type", "lead_received_date", "full_name", "counsiler_id"],
                    required: true, // Set this association as required
                    include: [
                      {
                        model: db.officeType,
                        as: "office_type_name",
                        attributes: ["office_type_name"],
                        required: true, // Set this association as required
                      },
                      {
                        model: db.leadSource,
                        as: "source_name",
                        attributes: ["source_name"],
                        required: true, // Set this association as required
                      },
                      {
                        model: db.adminUsers,
                        as: "counselors",
                        attributes: ["name", "id", "country_id"],
                        through: { attributes: [] },
                        subquery: false,
                        required: false, // Set this association as required
                        where: {
                          country_id: {
                            [db.Sequelize.Op.eq]: db.Sequelize.col("studyPreferenceDetails.studyPreference.countryId"), // Use the full alias path
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: db.course,
                as: "preferred_courses",
                attributes: ["course_name"],
                required: true, // Set this association as required
              },
              {
                model: db.campus,
                as: "preferred_campus",
                attributes: ["campus_name"],
                required: true, // Set this association as required
              },
              {
                model: db.university,
                as: "preferred_university",
                attributes: ["university_name"],
                required: true, // Set this association as required
              },
            ],
          },
        ],
        attributes: ["id", "application_status", "kyc_status", "remarks"],
        where: dynamicWhere,
      });
    } else if (type == "country_manager") {
      const { country_id } = await db.adminUsers.findByPk(userDecodeId);
      applicationData = await db.application.findAll({
        include: [
          {
            model: db.studyPreferenceDetails,
            as: "studyPreferenceDetails",
            attributes: ["id"],
            required: true, // Set this association as required
            include: [
              {
                model: db.studyPreference,
                as: "studyPreference",
                where: { countryId: country_id },
                required: true, // Set this association as required
                include: [
                  {
                    model: db.country,
                    as: "country",
                    attributes: ["country_name"],
                    required: true, // Set this association as required
                  },
                  {
                    model: db.userPrimaryInfo,
                    as: "userPrimaryInfo",
                    attributes: ["assign_type", "lead_received_date", "full_name", "counsiler_id"],
                    required: true, // Set this association as required
                    include: [
                      {
                        model: db.officeType,
                        as: "office_type_name",
                        attributes: ["office_type_name"],
                        required: true, // Set this association as required
                      },
                      {
                        model: db.leadSource,
                        as: "source_name",
                        attributes: ["source_name"],
                        required: true, // Set this association as required
                      },
                      {
                        model: db.adminUsers,
                        as: "counselors",
                        attributes: ["name", "id", "country_id"],
                        through: { attributes: [] },
                        subquery: false,
                        required: false, // Set this association as required
                        where: {
                          country_id: {
                            [db.Sequelize.Op.eq]: db.Sequelize.col("studyPreferenceDetails.studyPreference.countryId"), // Use the full alias path
                          },
                        },
                      },
                    ],
                  },
                ],
              },
              {
                model: db.course,
                as: "preferred_courses",
                attributes: ["course_name"],
                required: true, // Set this association as required
              },
              {
                model: db.campus,
                as: "preferred_campus",
                attributes: ["campus_name"],
                required: true, // Set this association as required
              },
              {
                model: db.university,
                as: "preferred_university",
                attributes: ["university_name"],
                required: true, // Set this association as required
              },
            ],
          },
        ],
        attributes: ["id", "application_status", "kyc_status", "remarks"],
        where: { is_rejected_kyc: false, proceed_to_application_manager: false },
      });
    }

    console.log(applicationData.length);

    res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      data: applicationData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.kycRejectedDetails = async (req, res) => {
  try {
    const { userDecodeId } = req;
    const { country_id } = await db.adminUsers.findByPk(userDecodeId);

    const applicationData = await db.application.findAll({
      include: [
        {
          model: db.studyPreferenceDetails,
          as: "studyPreferenceDetails",
          attributes: ["id"],
          required: true, // Set this association as required
          include: [
            {
              model: db.studyPreference,
              as: "studyPreference",
              where: { countryId: country_id },
              required: true, // Set this association as required
              include: [
                {
                  model: db.country,
                  as: "country",
                  attributes: ["country_name"],
                  required: true, // Set this association as required
                },
                {
                  model: db.userPrimaryInfo,
                  as: "userPrimaryInfo",
                  attributes: ["assign_type", "lead_received_date", "full_name", "counsiler_id"],
                  required: true, // Set this association as required
                  include: [
                    {
                      model: db.officeType,
                      as: "office_type_name",
                      attributes: ["office_type_name"],
                      required: true, // Set this association as required
                    },
                    {
                      model: db.leadSource,
                      as: "source_name",
                      attributes: ["source_name"],
                      required: true, // Set this association as required
                    },
                    {
                      model: db.adminUsers,
                      as: "counselors",
                      attributes: ["name", "id", "country_id"],
                      through: { attributes: [] },
                      subquery: false,
                      required: false, // Set this association as required
                      where: {
                        country_id: {
                          [db.Sequelize.Op.eq]: db.Sequelize.col("studyPreferenceDetails.studyPreference.countryId"), // Use the full alias path
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              model: db.course,
              as: "preferred_courses",
              attributes: ["course_name"],
              required: true, // Set this association as required
            },
            {
              model: db.campus,
              as: "preferred_campus",
              attributes: ["campus_name"],
              required: true, // Set this association as required
            },
            {
              model: db.university,
              as: "preferred_university",
              attributes: ["university_name"],
              required: true, // Set this association as required
            },
          ],
        },
      ],
      attributes: ["id", "application_status", "kyc_status", "remarks"],
      where: { is_rejected_kyc: true, proceed_to_application_manager: false },
    });

    res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      data: applicationData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.kycApprovedDetails = async (req, res) => {
  try {
    const { userDecodeId } = req;
    const { country_id } = await db.adminUsers.findByPk(userDecodeId);

    const applicationData = await db.application.findAll({
      include: [
        {
          model: db.studyPreferenceDetails,
          as: "studyPreferenceDetails",
          attributes: ["id"],
          required: true, // Set this association as required
          include: [
            {
              model: db.studyPreference,
              as: "studyPreference",
              where: { countryId: country_id },
              required: true, // Set this association as required
              include: [
                {
                  model: db.country,
                  as: "country",
                  attributes: ["country_name"],
                  required: true, // Set this association as required
                },
                {
                  model: db.userPrimaryInfo,
                  as: "userPrimaryInfo",
                  attributes: ["assign_type", "lead_received_date", "full_name", "counsiler_id"],
                  required: true, // Set this association as required
                  include: [
                    {
                      model: db.officeType,
                      as: "office_type_name",
                      attributes: ["office_type_name"],
                      required: true, // Set this association as required
                    },
                    {
                      model: db.leadSource,
                      as: "source_name",
                      attributes: ["source_name"],
                      required: true, // Set this association as required
                    },
                    {
                      model: db.adminUsers,
                      as: "counselors",
                      attributes: ["name", "id", "country_id"],
                      through: { attributes: [] },
                      subquery: false,
                      required: false, // Set this association as required
                      where: {
                        country_id: {
                          [db.Sequelize.Op.eq]: db.Sequelize.col("studyPreferenceDetails.studyPreference.countryId"), // Use the full alias path
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              model: db.course,
              as: "preferred_courses",
              attributes: ["course_name"],
              required: true, // Set this association as required
            },
            {
              model: db.campus,
              as: "preferred_campus",
              attributes: ["campus_name"],
              required: true, // Set this association as required
            },
            {
              model: db.university,
              as: "preferred_university",
              attributes: ["university_name"],
              required: true, // Set this association as required
            },
          ],
        },
      ],
      attributes: ["id", "application_status", "kyc_status", "remarks"],
      where: { proceed_to_application_manager: true },
    });

    res.status(200).json({
      status: true,
      message: "Data retrieved successfully",
      data: applicationData,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.rejectKYC = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { userDecodeId, role_id } = req;
    const { student_id, remarks, application_id, assigned_country_id } = req.body;

    // Fetch user details
    const existUser = await db.adminUsers.findByPk(userDecodeId, {
      attributes: ["name", "country_id"],
      include: [
        {
          model: db.country,
          attributes: ["country_name"],
        },
      ],
    });

    // Fetch application details
    const existApplication = await db.application.findByPk(application_id, {
      attributes: ["studyPrefernceId", "remarks", "counsellor_id"],
      include: {
        model: db.studyPreferenceDetails,
        as: "studyPreferenceDetails",
        attributes: ["id", "courseId", "universityId", "campusId", "studyPreferenceId"],
        include: [
          {
            model: db.studyPreference,
            as: "studyPreference",
            attributes: ["countryId"],
            include: [
              {
                model: db.country,
                as: "country",
                attributes: ["country_name"],
              },
              {
                model: db.userPrimaryInfo,
                as: "userPrimaryInfo",
                attributes: ["full_name"],
              },
            ],
          },
          { model: db.course, as: "preferred_courses", attributes: ["course_name"] },
          { model: db.campus, as: "preferred_campus", attributes: ["campus_name"] },
          { model: db.university, as: "preferred_university", attributes: ["university_name"] },
        ],
      },
    });

    const { studyPreferenceDetails } = existApplication;
    const { studyPreference } = studyPreferenceDetails || {};
    const courseName = studyPreferenceDetails?.preferred_courses?.course_name || "N/A";
    const campusName = studyPreferenceDetails?.preferred_campus?.campus_name || "N/A";
    const universityName = studyPreferenceDetails?.preferred_university?.university_name || "N/A";
    const countryName = studyPreference?.country?.country_name || "N/A";
    const counsellor_id = existApplication?.counsellor_id;

    // Update application remarks
    const formattedApplicationRemark = [
      {
        id: (existApplication?.remarks?.length || 0) + 1,
        remark: remarks,
        created_by: existUser?.name,
      },
      ...(existApplication?.remarks || []),
    ];

    // Fetch existing task details
    const assignedCountry = [process.env.APPLICATION_MANAGER_ID.toString(), process.env.APPLICATION_TEAM_ID.toString()].includes(role_id.toString())
      ? assigned_country_id
      : existUser?.country_id;

    const existTask = await db.tasks.findOne({
      attributes: ["id", "studentId", "title", "userId", "kyc_remarks", "description", "assigned_country"],
      where: {
        studentId: student_id,
        userId: counsellor_id,
        assigned_country: assignedCountry,
      },
      transaction,
    });

    if (!existTask) throw new Error("Task not found");

    const { kyc_remarks, description } = existTask;

    // Determine country name
    const resolvedCountryName = [process.env.APPLICATION_MANAGER_ID.toString(), process.env.APPLICATION_TEAM_ID].includes(role_id.toString())
      // ? (await db.country.findByPk(assigned_country_id, { attributes: ["country_name"] }))?.country_name
      ? (await db.country.findByPk(assigned_country_id, { attributes: ["country_name", "country_code"] }))?.country_code
      : existUser?.country?.country_name;

    // Update task remarks
    const formattedTaskRemark = [
      {
        id: (kyc_remarks?.length || 0) + 1,
        remark: remarks,
      },
      ...(kyc_remarks || []),
    ];

    // Create new task for rejection
    const newTask = await db.tasks.create(
      {
        studentId: existTask.studentId,
        userId: counsellor_id,
        title: `${studyPreference?.userPrimaryInfo?.full_name || "N/A"} - ${resolvedCountryName} - Rejected`,
        is_rejected: true,
        kyc_remarks: formattedTaskRemark,
        description,
        isCompleted: false,
        is_proceed_to_kyc: false,
        assigned_country: existTask?.assigned_country,
      },
      { transaction }
    );

    if (!newTask) throw new Error("Failed to create new task");

    const statusRes = await updateFollowUpStatus(existTask.studentId, existTask?.assigned_country);

    if (!statusRes) {
      return res.status(404).json({
        status: false,
        message: "Status not updated",
      });
    }

    // Update application status
    const [rejectApplication] = await db.application.update(
      {
        is_rejected_kyc: true,
        kyc_status: "rejected",
        remarks: formattedApplicationRemark,
        application_status: "rejected",
        proceed_to_application_manager: false,
      },
      { where: { id: application_id }, transaction }
    );

    if (!rejectApplication) throw new Error("Application rejection failed");

    // Log lead history
    const { country_id, role_name } = await getRoleForUserHistory(userDecodeId);
    const { role_name: counsellorRoleName } = await getRoleForUserHistory(counsellor_id);

    await Promise.all([
      addLeadHistory(
        student_id,
        `Application for ${courseName} - ${universityName} - ${campusName} rejected by ${role_name}`,
        userDecodeId,
        country_id,
        transaction
      ),
      addLeadHistory(
        student_id,
        `Task assigned to ${counsellorRoleName} - ${resolvedCountryName} for rejection`,
        userDecodeId,
        country_id,
        transaction
      ),
    ]);

    await transaction.commit();

    return res.status(200).json({ status: true, message: "KYC Rejected" });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({ status: false, message: error.message || "Internal server error" });
  }
};

exports.approveKYC = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_id, student_id } = req.body;
    const { role_name, userDecodeId } = req;

    const application = await db.application.findByPk(application_id, {
      attributes: ["studyPrefernceId", "remarks", "counsellor_id"],
      include: [
        {
          model: db.studyPreferenceDetails,
          as: "studyPreferenceDetails", // Must match the alias defined in the association
          attributes: ["id", "courseId", "universityId", "campusId", "studyPreferenceId"],
          include: [
            {
              model: db.studyPreference,
              as: "studyPreference",
              attributes: ["countryId"],
              include: [
                {
                  model: db.country,
                  as: "country",
                  attributes: ["country_name"],
                },
              ],
            },
            {
              model: db.course,
              as: "preferred_courses",
              attributes: ["course_name"],
            },
            {
              model: db.campus,
              as: "preferred_campus",
              attributes: ["campus_name"],
            },
            {
              model: db.university,
              as: "preferred_university",
              attributes: ["university_name"],
            },
          ],
        },
      ],
    });
    const student = await db.userPrimaryInfo.findByPk(student_id);

    if (!application || !student) {
      return res.status(404).json({
        status: false,
        message: "Application or Student not found",
      });
    }

    const { studyPreferenceDetails } = application;

    const courseName = studyPreferenceDetails.preferred_courses?.course_name || "N/A";
    const campusName = studyPreferenceDetails.preferred_campus?.campus_name || "N/A";
    const universityName = studyPreferenceDetails.preferred_university?.university_name || "N/A";
    const country_name = studyPreferenceDetails?.studyPreference?.country?.country_name || "N/A";

    const [approveApplication] = await db.application.update(
      { proceed_to_application_manager: true, kyc_status: "approved" },
      { where: { id: application_id }, transaction }
    );

    if (approveApplication == 0) {
      throw new Error("Application Approve Failed");
    }

    await student.update({
      stage: stageDatas.application,
    });

    const { country_id } = await getRoleForUserHistory(userDecodeId);
    await addLeadHistory(
      student_id,
      `KYC verfication approved by ${role_name}, for ${courseName} - ${universityName} - ${campusName} and application moved to application manager`,
      userDecodeId,
      country_id,
      transaction
    );

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "KYC Approved",
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getAllKycByUser = async (req, res) => {
  try {
    const { userDecodeId } = req;
    const { status } = req.query;

    let applicationData = await db.application.findAll({
      where: {
        [db.Sequelize.Op.and]: [{ proceed_to_application_manager: true }, { assigned_user: userDecodeId }, { application_status: status }],
      },

      include: [
        {
          model: db.adminUsers,
          as: "application",
          required: false,
          attributes: ["id", "name"],
        },
        {
          model: db.studyPreferenceDetails,
          as: "studyPreferenceDetails",
          attributes: ["id"],
          required: true, // Set this association as required
          include: [
            {
              model: db.studyPreference,
              as: "studyPreference",
              required: true, // Set this association as required
              include: [
                {
                  model: db.country,
                  as: "country",
                  attributes: ["country_name"],
                  required: true, // Set this association as required
                },
                {
                  model: db.userPrimaryInfo,
                  as: "userPrimaryInfo",
                  attributes: ["assign_type", "lead_received_date", "full_name", "counsiler_id"],
                  required: true, // Set this association as required
                  include: [
                    {
                      model: db.officeType,
                      as: "office_type_name",
                      attributes: ["office_type_name"],
                      required: true, // Set this association as required
                    },
                    {
                      model: db.leadSource,
                      as: "source_name",
                      attributes: ["source_name"],
                      required: true, // Set this association as required
                    },
                    {
                      model: db.adminUsers,
                      as: "counselors",
                      attributes: ["name", "id", "country_id"],
                      through: { attributes: [] },
                      subquery: false,
                      required: false, // Set this association as required
                      where: {
                        country_id: {
                          [db.Sequelize.Op.eq]: db.Sequelize.col("studyPreferenceDetails.studyPreference.countryId"), // Use the full alias path
                        },
                      },
                    },
                  ],
                },
              ],
            },
            {
              model: db.course,
              as: "preferred_courses",
              attributes: ["course_name"],
              required: true, // Set this association as required
            },
            {
              model: db.campus,
              as: "preferred_campus",
              attributes: ["campus_name"],
              required: true, // Set this association as required
            },
            {
              model: db.university,
              as: "preferred_university",
              attributes: ["university_name", "id"],
              required: true, // Set this association as required
            },
          ],
        },
      ],
      attributes: ["id", "kyc_status", "application_status", "offer_letter", "is_application_checks_passed", "comments", "reference_id"],
    });

    return res.status(200).json({
      status: true,
      data: applicationData,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateClosedStatus = async (studentId, countryId) => {
  const [updatedClosedStatus] = await db.userContries.update(
    {
      status_id: process.env.CLOSED_LEAD_STATUS_ID,
    },
    {
      where: { user_primary_info_id: studentId, country_id: countryId },
    }
  );

  return updatedClosedStatus != 0;
};

const updateFollowUpStatus = async (studentId, countryId) => {
  const [updatedFollowUpStatus] = await db.userContries.update(
    {
      status_id: FOLLOWUP_ID, dueDate: new Date()
    },
    {
      where: { user_primary_info_id: studentId, country_id: countryId },
    }
  );

  return updatedFollowUpStatus != 0;
};


