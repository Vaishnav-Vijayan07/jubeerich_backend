const db = require("../models");

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
    try {
       const { study_preferences } = req.body;

       let newDetails;

        for (const countryWiseData of study_preferences) {
            newDetails = await db.studyPreferenceDetails.create({
                studyPreferenceId: countryWiseData?.studyPreferenceId,
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

        res.status(201).json({
            status: true,
            data: newDetails,
        });
    } catch (error) {
        console.error(`Error creating study preference details: ${error}`);
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
