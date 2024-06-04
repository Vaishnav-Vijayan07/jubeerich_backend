const { validationResult, check } = require("express-validator");
const db = require("../models");
const UserBasicInfo = db.userBasicInfo;
const UserPrimaryInfo = db.userPrimaryInfo;
const UserStudyPreferenceInfo = db.userStudyPreference;
const UserAccadamicInfo = db.userAcademicInfo;
const sequelize = db.sequelize;

// Validation rules
const validationRules = [
  // Validation rules for UserBasicInfo
  check("firstname").not().isEmpty().withMessage("First name is required"),
  check("lastname").not().isEmpty().withMessage("Last name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("phone").not().isEmpty().withMessage("Phone is required"),
  check("dob").isDate().withMessage("Date of birth is required"),
  check("gender").isIn(["Male", "Female", "Other"]).withMessage("Valid gender is required"),
  check("marital_status")
    .isIn(["Single", "Married", "Divorced", "Widowed"])
    .withMessage("Valid marital status is required"),

  // Validation rules for UserStudyPreferenceInfo
  check("intake_year")
    .isInt({ min: 1900, max: new Date().getFullYear() + 10 })
    .withMessage("Valid intake year is required"),
  check("intake_month").not().isEmpty().withMessage("Intake month is required"),
  check("estimated_budget").isDecimal().withMessage("Estimated budget must be a decimal value"),

  // Validation rules for UserAccadamicInfo
  check("qualification").not().isEmpty().withMessage("Qualification is required"),
  check("place").not().isEmpty().withMessage("Place is required"),
  check("percentage").isDecimal().withMessage("Percentage must be a decimal value"),
  check("year_of_passing")
    .isInt({ min: 1900, max: new Date().getFullYear() })
    .withMessage("Valid year of passing is required"),
];

// Create user and preferences
exports.createUserAndPreferences = [
  ...validationRules,
  async (req, res) => {
    const {
      firstname,
      lastname,
      email,
      phone,
      passport_no,
      dob,
      gender,
      marital_status,
      intersted_country,
      no_country_preference,
      intrested_institution,
      intake_year,
      intake_month,
      estimated_budget,
      course_field_of_intrest,
      qualification,
      place,
      percentage,
      year_of_passing,
      backlogs,
      work_experience,
      designation,
    } = req.body;

    const transaction = await sequelize.transaction();

    try {
      // Create user primary info
      const userPrimaryInfo = await UserPrimaryInfo.create(
        {
          category_id: req.body.category_id,
          source_id: req.body.source_id,
          channel_id: req.body.channel_id,
          region_id: req.body.region_id,
          counsiler_id: req.body.counsiler_id,
          branch_id: req.body.branch_id,
          updated_by: req.body.updated_by,
          is_deleted: req.body.is_deleted,
        },
        { transaction }
      );

      // Get the generated user ID
      const user_id = userPrimaryInfo.id;

      // Create user basic info
      const userBasicInfo = await UserBasicInfo.create(
        {
          firstname,
          lastname,
          email,
          phone,
          passport_no,
          dob,
          gender,
          marital_status,
          user_id,
        },
        { transaction }
      );

      // Create user study preference
      const userStudyPreferenceInfo = await UserStudyPreferenceInfo.create(
        {
          intersted_country,
          no_country_preference,
          intrested_institution,
          intake_year,
          intake_month,
          estimated_budget,
          course_field_of_intrest,
          user_id,
        },
        { transaction }
      );

      // Create user academic info
      const userAcademicInfo = await UserAcademicInfo.create(
        {
          qualification,
          place,
          percentage,
          year_of_passing,
          backlogs,
          work_experience,
          designation,
          user_id,
        },
        { transaction }
      );

      // Commit the transaction
      await transaction.commit();

      res.status(201).json({
        status: true,
        message: "User and preferences created successfully",
        data: {
          userPrimaryInfo,
          userBasicInfo,
          userStudyPreferenceInfo,
          userAcademicInfo,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error(`Error creating user and preferences: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Get user with preferences
exports.getAllUsersWithDetails = async (req, res) => {
  try {
    const allUsersWithDetails = await UserPrimaryInfo.findAll({
      include: [
        { model: db.userBasicInfo, as: "basicInfo" },
        { model: db.userStudyPreference, as: "studyPreference" },
        { model: db.userAcademicInfo, as: "academicInfo" },
      ],
    });

    if (!allUsersWithDetails || allUsersWithDetails.length === 0) {
      return res.status(404).json({
        status: false,
        message: "No users found",
      });
    }

    res.status(200).json({
      status: true,
      data: allUsersWithDetails,
    });
  } catch (error) {
    console.error(`Error fetching users with details: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
// Update user and preferences
exports.updateUserAndPreferences = [
  ...validationRules,
  async (req, res) => {
    const { id } = req.params;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      firstname,
      lastname,
      email,
      phone,
      passport_no,
      dob,
      gender,
      marital_status,
      intersted_country,
      no_country_preference,
      intrested_institution,
      intake_year,
      intake_month,
      estimated_budget,
      course_field_of_intrest,
      qualification,
      place,
      percentage,
      year_of_passing,
      backlogs,
      work_experience,
      designation,
      user_id,
    } = req.body;

    const transaction = await sequelize.transaction();

    try {
      const userBasicInfo = await UserBasicInfo.findByPk(id);
      if (!userBasicInfo) {
        await transaction.rollback();
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }

      await userBasicInfo.update(
        {
          firstname,
          lastname,
          email,
          phone,
          passport_no,
          dob,
          gender,
          marital_status,
          user_id,
        },
        { transaction }
      );

      const userStudyPreferenceInfo = await UserStudyPreferenceInfo.findOne({ where: { user_id: id } });
      if (userStudyPreferenceInfo) {
        await userStudyPreferenceInfo.update(
          {
            intersted_country,
            no_country_preference,
            intrested_institution,
            intake_year,
            intake_month,
            estimated_budget,
            course_field_of_intrest,
          },
          { transaction }
        );
      }

      const userAccadamicInfo = await UserAccadamicInfo.findOne({ where: { user_id: id } });
      if (userAccadamicInfo) {
        await userAccadamicInfo.update(
          {
            qualification,
            place,
            percentage,
            year_of_passing,
            backlogs,
            work_experience,
            designation,
          },
          { transaction }
        );
      }

      await transaction.commit();

      res.status(200).json({
        status: true,
        message: "User and preferences updated successfully",
        data: {
          userBasicInfo,
          userStudyPreferenceInfo,
          userAccadamicInfo,
        },
      });
    } catch (error) {
      await transaction.rollback();
      console.error(`Error updating user and preferences: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete user and preferences
exports.deleteUserAndPreferences = async (req, res) => {
  const { id } = req.params;
  const transaction = await sequelize.transaction();

  try {
    const userBasicInfo = await UserBasicInfo.findByPk(id);
    if (!userBasicInfo) {
      await transaction.rollback();
      return res.status(404).json({
        status: false,
        message: "User not found",
      });
    }

    await UserStudyPreferenceInfo.destroy({ where: { user_id: id }, transaction });
    await UserAccadamicInfo.destroy({ where: { user_id: id }, transaction });
    await userBasicInfo.destroy({ transaction });

    await transaction.commit();

    res.status(200).json({
      status: true,
      message: "User and preferences deleted successfully",
    });
  } catch (error) {
    await transaction.rollback();
    console.error(`Error deleting user and preferences: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
