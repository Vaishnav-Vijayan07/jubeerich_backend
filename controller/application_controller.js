const db = require("../models");
const sequelize = db.sequelize;
const { Sequelize } = require("sequelize");

const types = {
  education: "education",
  visa: "visa",
};

const CheckTypes = {
  availability: "availability",
  campus: "campus",
  entry_requirement: "entry_requirement",
  quantity: "quantity",
  quality: "quality",
  immigration: "immigration",
  application_fee: "application_fee",
};

exports.getApplicationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existApplication = await db.application.findByPk(id);

    if (!existApplication) {
      throw new Error("Application not found");
    }

    const [assigned_user, studyPreferDetails, checks] = await Promise.all([
      existApplication.getApplication({ attributes: ["id", "name"] }),
      existApplication.getStudyPreferenceDetails({
        attributes: ["id", "intakeYear", "intakeMonth", "streamId"],
        include: [
          {
            model: db.course,
            as: "preferred_courses",
            attributes: ["id", "course_name"],
            include: [
              {
                model: db.campus,
                through: "campus_course",
                as: "campuses",
                attributes: ["id", "campus_name"],
                through: {
                  attributes: ["course_link", "course_fee", "application_fee"],
                },
              },
            ],
          },
          {
            model: db.stream,
            as: "preferred_stream",
            attributes: ["id", "stream_name"],
          },
          {
            model: db.campus,
            as: "preferred_campus",
            attributes: ["id", "campus_name"],
          },
          {
            model: db.university,
            as: "preferred_university",
            attributes: ["id", "university_name"],
          },
          {
            model: db.studyPreference,
            as: "studyPreference",
            include: [
              {
                model: db.country,
                as: "country",
                attributes: ["id", "country_name"],
              },
              {
                model: db.userPrimaryInfo,
                as: "userPrimaryInfo",
                attributes: ["id", "full_name", "office_type", "source_id", "lead_received_date", "assign_type"],
                include: [
                  {
                    model: db.leadSource,
                    required: true,
                    as: "source_name",
                    attributes: ["id", "source_name"],
                  },
                  {
                    model: db.officeType,
                    required: true,
                    as: "office_type_name",
                    attributes: ["id", "office_type_name"],
                  },
                ],
              },
            ],
          },
        ],
      }),
      existApplication.getEligibilityChecks(),
    ]);

    return res.status(200).json({
      status: true,
      data: {
        existApplication: existApplication,
        studyPreferDetails: studyPreferDetails,
        assigned_user: assigned_user,
        checks: checks,
      },
      message: "Application Assigned to Team Member",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.assignApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_ids, user_id } = req.body;

    // Find the admin user to whom applications will be assigned
    const adminUser = await db.adminUsers.findByPk(user_id, { transaction });
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    // Retrieve all applications by IDs
    const applications = await db.application.findAll({
      where: { id: application_ids },
      transaction,
    });

    if (applications.length !== application_ids.length) {
      throw new Error("One or more applications not found");
    }

    // Use the magic method to assign multiple applications
    await adminUser.addAssigned_applications(applications, { transaction });

    // Commit the transaction
    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Applications successfully assigned to the members",
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

exports.autoAssignApplication = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_ids } = req.body;

    const leastAssignedUser = await getLeastAssignedApplicationMember();
    console.log("leastAssignedUser", leastAssignedUser);

    const { user_id } = leastAssignedUser;

    const adminUser = await db.adminUsers.findByPk(user_id, { transaction });
    if (!adminUser) {
      throw new Error("Admin user not found");
    }

    // Retrieve all applications by IDs
    const applications = await db.application.findAll({
      where: { id: application_ids },
      transaction,
    });

    if (applications.length !== application_ids.length) {
      throw new Error("One or more applications not found");
    }

    // Use the magic method to assign multiple applications
    await adminUser.addAssigned_applications(applications, { transaction });

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Application Assigned to Team Member",
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

exports.getApplicationDetailsByType = async (req, res, next) => {
  try {
    const { id, type } = req.params;

    let response = { status: true, message: "Successly fetched details" };

    if (type == types.education) {
      const educationalDetails = await db.userPrimaryInfo.findByPk(id, {
        attributes: ["id"],
        include: [
          {
            model: db.educationDetails,
            required: true,
            as: "educationDetails",
            attributes: ["id", "qualification", "start_date", "end_date", "percentage", "board_name", "school_name"],
          },
          {
            model: db.graduationDetails,
            required: true,
            as: "graduationDetails",
            attributes: ["id", "qualification", "start_date", "end_date", "percentage", "university_name", "college_name"],
          },
          {
            model: db.gapReason,
            required: true,
            as: "gapReasons",
            attributes: ["id", "reason", "start_date", "end_date", "type"],
          },
        ],
      });
      response.data = educationalDetails;
    } else if (type == types.visa) {
      const visaDetails = await db.userPrimaryInfo.findByPk(id, {
        attributes: ["id"],
        include: [
          {
            model: db.previousVisaApprove,
            required: true,
            as: "previousVisaApprovals",
            attributes: ["id", "country_id", "visa_type", "approved_letter"],
            include: [
              {
                model: db.country,
                required: true,
                as: "approved_country",
                attributes: ["id", "country_name"],
              },
            ],
          },
          {
            model: db.previousVisaDecline,
            required: true,
            as: "previousVisaDeclines",
            attributes: ["id", "country_id", "visa_type", "declined_letter"],
            include: [
              {
                model: db.country,
                required: true,
                as: "declined_country",
                attributes: ["id", "country_name"],
              },
            ],
          },
        ],
      });
      response.visaDetails = visaDetails;
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

const getLeastAssignedApplicationMember = async () => {
  try {
    const [leastAssignedMember] = await db.adminUsers.findAll({
      attributes: [
        ["id", "user_id"],
        "username",
        [
          Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "application_details"
                        WHERE "application_details"."assigned_user" = "admin_user"."id"
                    )`),
          "assignment_count",
        ],
      ],
      where: {
        [Sequelize.Op.or]: [{ role_id: process.env.APPLICATION_TEAM_ID }, { role_id: process.env.APPLICATION_MANAGER_ID }],
      },
      order: [
        [
          Sequelize.literal(`(
                        SELECT COUNT(*)
                        FROM "application_details"
                        WHERE "application_details"."assigned_user" = "admin_user"."id"
                    )`),
          "ASC",
        ],
      ],
      limit: 1,
    });

    if (!leastAssignedMember) return null;

    return {
      user_id: leastAssignedMember.dataValues.user_id,
      assignment_count: parseInt(leastAssignedMember.dataValues.assignment_count, 10),
    };
  } catch (error) {
    console.error("Error fetching least assigned member:", error.message || error);
    throw error;
  }
};

exports.updateApplicationChecks = async (req, res, next) => {
  const transaction = await sequelize.transaction();
  try {
    const { application_id, check_type, quality_value } = req.body;

    let updateCheck;
    let updateValues = {};

    switch (check_type) {
      case CheckTypes.availability:
        updateValues = { availability_check: true };
        break;
      case CheckTypes.campus:
        updateValues = { campus_check: true };
        break;
      case CheckTypes.entry_requirement:
        updateValues = { entry_requirement_check: true };
        break;
      case CheckTypes.quantity:
        updateValues = { quantity_check: true };
        break;
      case CheckTypes.immigration:
        updateValues = { immigration_check: true };
        break;
      case CheckTypes.application_fee:
        await updateApplication(application_id, transaction);
        updateValues = { application_fee_check: true };
        break;
      case CheckTypes.quality:
        console.log("Entered quality check");
        updateValues = { quality_check: quality_value };
        break;
      default:
        throw new Error("Invalid check type");
    }

    [updateCheck] = await db.eligibilityChecks.update(updateValues, { where: { application_id: application_id }, transaction });

    console.log("updateCheck", updateCheck);
    if (updateCheck == 0) {
      throw new Error("Application check not updated");
    }

    await transaction.commit();

    return res.status(200).json({
      status: true,
      message: "Check Updated Successfully",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    await transaction.rollback();
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getApplicationChecks = async (req, res, next) => {
  try {
    const { id } = req.params;

    const applicationChecks = await db.eligibilityChecks.findOne({ where: { application_id: id } });

    return res.status(200).json({
      status: true,
      data: applicationChecks,
      message: "Check Updated Successfully",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.getPortalDetails = async (req, res, next) => {
  try {
    const { id } = req.params;

    const portalDetails = await db.university.findByPk(id, { attributes: ["id", "portal_link", "username", "password"] });

    return res.status(200).json({
      status: true,
      data: portalDetails,
      message: "Portal Details fetched Successfully",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.completeApplication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ref_id, comment } = req.body;

    const [completeApplication] = await db.application.update(
      { application_status: "submitted", reference_id: ref_id, comments: comment },
      { where: { id: id } }
    );

    console.log("completeApplication", completeApplication);

    if (completeApplication == 0) {
      throw new Error("Application not completed");
    }

    return res.status(200).json({
      status: true,
      message: "Application completed successfully",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.provdeOfferLetter = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { offer_letter_type } = req.body;
    const offer_letter = req?.files?.offer_letter?.[0];

    console.log("Filess", offer_letter?.path);
    console.log("offer_letter_type", offer_letter_type);

    const [provideOffer] = await db.application.update(
      { application_status: "offer_accepted", offer_letter_type: offer_letter_type, offer_letter: offer_letter?.path },
      { where: { id: id } }
    );

    console.log("provideOffer", provideOffer);

    if (provideOffer == 0) {
      throw new Error("Offer not accepted");
    }

    return res.status(200).json({
      status: true,
      message: "Offer accepted successfully",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

const updateApplication = async (application_id, transaction) => {
  try {
    const application = await db.application.findOne({ where: { id: application_id } });
    if (!application) {
      throw new Error("Application not found");
    }
    await db.application.update(
      { is_application_checks_passed: true },
      { where: { id: application_id }, transaction } // Correctly apply the transaction
    );
  } catch (error) {
    throw new Error("Application not found");
  }
};
