const db = require("../models");
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
    const { student_id, task_id } = req.body;
    const { userDecodeId } = req;

    const { country_id } = await db.adminUsers.findByPk(userDecodeId, { transaction });

    const studyPrefDetails = await db.studyPreferenceDetails.findAll({
      include: [
        {
          model: db.studyPreference,
          as: "studyPreference",
          where: { countryId: country_id, userPrimaryInfoId: student_id },
          attributes: [],
        },
      ],
      attributes: ["id"],
      transaction,
    });

    console.log("studyPrefDetails ======>", studyPrefDetails);

    // if (studyPrefDetails.length > 0) {
    //   const applicationsToCreate = studyPrefDetails.map((detail) => ({
    //     studyPrefernceId: detail.id,
    //   }));

    //   console.log('applicationsToCreate ======>', applicationsToCreate);

    //   await db.application.bulkCreate(applicationsToCreate, { transaction });
    // }

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
          applicationsToCreate.push({ studyPrefernceId: detail.id });
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
          { is_rejected_kyc: false },
          {
            where: { id: { [db.Sequelize.Op.in]: applicationsToUpdate } },
            transaction,
          }
        );
      }
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
                        required: true, // Set this association as required
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
                        required: true, // Set this association as required
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
                      required: true, // Set this association as required
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
                      required: true, // Set this association as required
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
    const { userDecodeId } = req;
    const { student_id, remarks, application_id } = req.body;

    const existUser = await db.adminUsers.findByPk(userDecodeId, { attributes: ["name"] });

    const existTask = await db.tasks.findOne({
      where: { studentId: student_id },
      transaction,
    });

    const existApplication = await db.application.findByPk(application_id);

    const formattedApplicationRemark = [
      {
        id: existApplication?.remarks?.length + 1 || 1,
        remark: remarks,
        created_by: existUser?.name
      },
      ...(existApplication?.remarks || []),
    ];

    console.log('formattedApplicationRemark',formattedApplicationRemark);

    const formattedRemark = [
      {
        id: existTask?.kyc_remarks?.length + 1 || 1,
        remark: remarks,
      },
      ...(existTask?.kyc_remarks || []),
    ];

    const newTaskData = {
      ...existTask.toJSON(),
      title: `${existTask.title} - Rejected`,
      is_rejected: true,
      kyc_remarks: formattedRemark,
      isCompleted: false,
      is_proceed_to_kyc: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    delete newTaskData.id;

    console.log("newTaskData", newTaskData);

    const newTask = await db.tasks.create(newTaskData, { transaction });

    if (!newTask) {
      throw new Error("Failed to create new task");
    }

    const [rejectApplication] = await db.application.update(
      { is_rejected_kyc: true, kyc_status: "rejected", remarks: formattedApplicationRemark },
      { where: { id: application_id }, transaction }
    );

    if (rejectApplication == 0) {
      throw new Error("Application Rejection Failed");
    }

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "KYC Rejected",
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

exports.approveKYC = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_id } = req.body;

    const [approveApplication] = await db.application.update(
      { proceed_to_application_manager: true, kyc_status: "approved"},
      { where: { id: application_id }, transaction }
    );

    if (approveApplication == 0) {
      throw new Error("Application Approve Failed");
    }

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
                      required: true, // Set this association as required
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
              attributes: ["university_name","id"],
              required: true, // Set this association as required
            },
          ],
        },
      ],
      attributes: ["id", "kyc_status", "application_status", "offer_letter","is_application_checks_passed","comments","reference_id"],
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
