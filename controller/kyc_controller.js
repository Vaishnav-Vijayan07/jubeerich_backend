const db = require("../models");

exports.getKycDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log('id', id);

        const personalDetails = await db.userPrimaryInfo.findOne({
            where: { id: id },
            attributes: ["id", "full_name", "email", "phone", "source_id"],
            include: [
                {
                    model: db.leadSource,
                    as: "source_name",
                    attributes: ["source_name"],
                    required: false,
                },
                {
                    model: db.branches,
                    as: "branch_name",
                    attributes: ["branch_name"],
                    required: false,
                },
                {
                    model: db.adminUsers,
                    as: "assigned_branch_counselor_name",
                    attributes: ["name"],
                    required: false,
                },
                {
                    model: db.adminUsers,
                    as: "cre_name",
                    attributes: ["name"],
                    required: false,
                },
                {
                    model: db.educationDetails,
                    as: "educationDetails",
                    where: { student_id: id },
                    required: false,
                    attributes: ["id", "qualification", "start_date", "end_date", "percentage", "board_name", "school_name"]
                },
                {
                    model: db.studyPreference,
                    as: "studyPreferences",
                    require: false,
                    include: [
                        {
                            model: db.studyPreferenceDetails,
                            as: "studyPreferenceDetails",
                            required: false,
                            include: [
                                {
                                    model: db.course,
                                    as: "preferred_courses",
                                    required: false,
                                },
                                {
                                    model: db.campus,
                                    as: "preferred_campus",
                                    required: false,
                                }
                            ]
                        }
                    ]
                },
                {
                    model: db.previousVisaDecline,
                    as: "previousVisaDeclines",
                    where: { student_id: id },
                    required: false,
                    attributes: ["id", "country_id", "visa_type", "course_applied", "university_applied", "rejection_reason"],
                    include: [
                        {
                            model: db.country,
                            as: "declined_country",
                            required: false,
                            attributes: ["country_name", "country_code"]
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
                            // attributes: ["id","university_name", "location"],
                        },
                    ]
                },
                {
                    model: db.previousVisaApprove,
                    as: "previousVisaApprovals",
                    where: { student_id: id },
                    required: false,
                    attributes: ["id", "country_id", "visa_type", "course_applied", "university_applied"],
                    include: [
                        {
                            model: db.country,
                            as: "approved_country",
                            required: false,
                            attributes: ["country_name", "country_code"]
                        },
                        {
                            model: db.course,
                            as: "approved_course",
                            required: false,
                            attributes: ["course_name"]
                        },
                        {
                            model: db.university,
                            as: "approved_university_applied",
                            required: false,
                            // attributes: ["university_name"]
                        }
                    ]
                },
                {
                    model: db.travelHistory,
                    as: "travelHistories",
                    where: { student_id: id },
                    required: false,
                    attributes: ["id", "country_id", "start_date", "end_date", "purpose_of_travel"],
                    include: [
                        {
                            model: db.country,
                            as: "travelHistoryCountry",
                            required: false,
                            attributes: ["country_name", "country_code"]
                        }
                    ]
                },
                {
                    model: db.userBasicInfo,
                    as: "basic_info_details",
                    where: { user_id: id },
                    required: false,
                    attributes: ["id", "dob", "marital_status", "address", "emergency_contact_name", "emergency_contact_relationship", "emergency_contact_phone"],
                    include: [
                        {
                            model: db.maritalStatus,
                            as: "marital_status_details",
                            required: false,
                            attributes: ["marital_status_name"]
                        }
                    ]
                },
                {
                    model: db.passportDetails,
                    as: "passportDetails",
                    where: { user_id: id },
                    required: false,
                },
                {
                    model: db.workInfos,
                    as: "userWorkInfos",
                    where: { user_id: id },
                    required: false,
                },
                {
                    model: db.familyInformation,
                    as: "familyDetails",
                    where: { user_id: id },
                    required: false,
                },
                {
                    model: db.fundPlan,
                    as: "fundPlan",
                    where: { student_id: id },
                    required: false,
                },
                {
                    model: db.userExams,
                    as: "exams",
                    where: { student_id: id },
                    required: false,
                }
            ]
        });

        if (!personalDetails) {
            return res.status(404).json({
                status: false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            status: true,
            data: personalDetails,
            message: "Data retrieved successfully",
        });

    } catch (error) {
        console.log(error);
        await transaction.rollback();
        console.error(`Error: ${error.message}`);
        return res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
