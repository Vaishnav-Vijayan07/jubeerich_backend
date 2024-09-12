const { where } = require("sequelize");
const db = require("../models");
const {
  addOrUpdateStudyPreference,
} = require("../utils/academic_query_helper");

// Need to change like Dynamic Form
// exports.createStudyPreferenceDetails = async (req, res) => {
//     try {
//         const { studyPreferenceId, universityId, campusId, courseTypeId, streamId, courseId, intakeYear, intakeMonth, estimatedBudget } = req.body;

//         if (!studyPreferenceId || !universityId || !campusId || !courseTypeId || !streamId || !courseId || !intakeYear || !intakeMonth || !estimatedBudget) {
//             return res.status(400).json({
//                 status: false,
//                 message: "All fields are required.",
//             });
//         }

//         const newDetails = await db.studyPreferenceDetails.create({
//             studyPreferenceId,
//             universityId,
//             campusId,
//             courseTypeId,
//             streamId,
//             courseId,
//             intakeYear,
//             intakeMonth,
//             estimatedBudget,
//         });

//         res.status(201).json({
//             status: true,
//             data: newDetails,
//         });
//     } catch (error) {
//         console.error(`Error creating study preference details: ${error}`);
//         res.status(500).json({
//             status: false,
//             message: "Internal server error",
//         });
//     }
// };

exports.createStudyPreferenceDetails = async (req, res) => {
  const transaction = await db.sequelize.transaction(); // Start a transaction
  try {
    const { study_preferences, studyPreferenceId } = req.body;

    // Call addOrUpdate function with transaction
    await addOrUpdateStudyPreference(
      study_preferences,
      studyPreferenceId,
      transaction
    );

    await transaction.commit(); // Commit transaction if all is successful

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

    const studyPreferences = await db.studyPreference.findAll({
      where: {
        userPrimaryInfoId, // Fetch study preferences by studentId
      },
      include: [
        {
          model: db.studyPreferenceDetails, // Include associated study preference details
          as: "studyPreferenceDetails", // Alias as defined in the association
        },
        {
          model: db.country, // Include the country model
          as: "country", // Alias for the country association
          attributes: ["country_name"], // Only fetch the countryName field
        },
      ],
    });

    if (!studyPreferences || studyPreferences.length === 0) {
      return res
        .status(404)
        .json({ message: "No study preferences found for this student" });
    }

    res.status(200).json({ data: studyPreferences[0] });
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

    // const detail = await db.studyPreferenceDetails.findByPk(id);

    // if (!detail) {
    //     return res.status(404).json({
    //         status: false,
    //         message: "Study preference detail not found.",
    //     });
    // }

    // await detail.update({
    //     universityId,
    //     campusId,
    //     courseTypeId,
    //     streamId,
    //     courseId,
    //     intakeYear,
    //     intakeMonth,
    //     estimatedBudget,
    // });

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
