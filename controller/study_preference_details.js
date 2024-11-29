const { where } = require("sequelize");
const db = require("../models");
const { addOrUpdateStudyPreference } = require("../utils/academic_query_helper");
const { updateTaskDescStudyPref } = require("../utils/task_description");

exports.createStudyPreferenceDetails = async (req, res) => {
  const transaction = await db.sequelize.transaction(); // Start a transaction
  try {
    const { study_preferences, studyPreferenceId } = req.body;

    // Call addOrUpdate function with transaction
    await addOrUpdateStudyPreference(study_preferences, studyPreferenceId, transaction);

    await transaction.commit(); // Commit transaction if all is successful

    const updatedTask = await updateTaskDescStudyPref(studyPreferenceId);

    res.status(201).json({
      status: true,
      data: "Data Added Successfully",
    });
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    } // Rollback transaction if there is an error
    console.error(`Error creating study preference details: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudyPreferenceDetails = async (req, res) => {
  try {
    const userPrimaryInfoId = parseInt(req.params.id);
    const { userDecodeId, role_name, role_id } = req;

    console.log("Application ASSOCIATIONS ===========>", db.application.associations);
    console.log("sTUDY PREF ASSOCIATIONS ===========>", db.studyPreferenceDetails.associations);

    const { country } =
      (await db.adminUsers.findByPk(userDecodeId, {
        include: [
          {
            model: db.country,
            as: "country", // alias used in association
            attributes: ["id", "country_name"], // Only fetch these attributes
          },
        ],
      })) || {};

    let where = {
      userPrimaryInfoId, // Fetch study preferences by studentId
    };

    // Check if the role is a counsellor and set the countryId accordingly
    if (role_id === process.env.COUNSELLOR_ROLE_ID) {
      if (country?.id) {
        where.countryId = country.id; // Set countryId only if it exists
      }
    }

    const studyPreferences = await db.studyPreference.findAll({
      where, // Use the defined where object directly
      include: [
        {
          model: db.studyPreferenceDetails, // Include associated study preference details
          as: "studyPreferenceDetails", // Alias as defined in the association
          include: [
            {
              model: db.application,
              as: "applications", // Alias defined in association
              required: false,
            },
          ],
        },
        {
          model: db.country, // Include the country model
          as: "country", // Alias for the country association
          attributes: ["country_name", "id"], // Only fetch the countryName and id fields
        },
      ],
    });

    if (!studyPreferences || studyPreferences.length === 0) {
      return res.status(404).json({ message: "No study preferences found for this student" });
    }

    console.log(role_id == process.env.COUNSELLOR_ROLE_ID);
    console.log(role_id);
    console.log(process.env.COUNSELLOR_ROLE_ID);

    const modifiedResponse = studyPreferences.map((preference) => ({
      studyPreferenceId: preference.id,
      studyDetails: preference.studyPreferenceDetails,
      country_name: preference.country.country_name,
      country_id: preference.country.id,
      isEditable: role_id == process.env.COUNSELLOR_ROLE_ID ? preference.country.id == country?.id : true,
    }));

    res.status(200).json({ data: modifiedResponse });
  } catch (error) {
    console.error(`Error getting study preference details: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// exports.updateStudyPreferenceDetails = async (req, res) => {
//     const { id } = req.params;
//     const { universityId, campusId, courseTypeId, streamId, courseId, intakeYear, intakeMonth, estimatedBudget } = req.body;

//     try {
//         const detail = await db.studyPreferenceDetails.findByPk(id);

//         if (!detail) {
//             return res.status(404).json({
//                 status: false,
//                 message: "Study preference detail not found.",
//             });
//         }

//         await detail.update({
//             universityId,
//             campusId,
//             courseTypeId,
//             streamId,
//             courseId,
//             intakeYear,
//             intakeMonth,
//             estimatedBudget,
//         });

//         res.status(200).json({
//             status: true,
//             data: detail,
//         });
//     } catch (error) {
//         console.error(`Error updating study preference details: ${error}`);
//         res.status(500).json({
//             status: false,
//             message: "Internal server error",
//         });
//     }
// };

exports.updateStudyPreferenceDetails = async (req, res) => {
  const { id } = req.params;
  const { study_preferences } = req.body;

  try {
    let detail;

    for (const countryWiseData of study_preferences) {
      detail = await db.studyPreferenceDetails.findByPk(id);

      if (!detail) {
        return res.status(404).json({
          status: false,
          message: "Study preference detail not found.",
        });
      }

      await detail.update({
        universityId: countryWiseData?.universityId,
        campusId: countryWiseData?.campusId,
        courseTypeId: countryWiseData?.courseTypeId,
        streamId: countryWiseData?.streamId,
        courseId: countryWiseData?.courseId,
        intakeYear: countryWiseData?.intakeYear,
        intakeMonth: countryWiseData?.intakeMonth,
        estimatedBudget: countryWiseData?.estimatedBudget,
      });
    }

    res.status(200).json({
      status: true,
      data: detail,
    });
  } catch (error) {
    console.error(`Error updating study preference details: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.deleteStudyPreferenceDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const detail = await db.studyPreferenceDetails.findByPk(id);

    if (!detail) {
      return res.status(404).json({
        status: false,
        message: "Study preference detail not found.",
      });
    }

    await detail.destroy();

    res.status(200).json({
      status: true,
      message: "Study preference detail deleted successfully.",
    });
  } catch (error) {
    console.error(`Error deleting study preference details: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
