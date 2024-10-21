const db = require("../models");
const { sequelize } = require("../models");

exports.getKycDetails = async (req, res, next) => {
    const transaction = await sequelize.transaction();
    try {
        const { id } = req.params;
        console.log('id', id);

        const personalDetails = await db.userPrimaryInfo.findOne({
            where: { id: id },
            include: [
                {
                    model: db.leadSource,
                    as: "source_name",
                    attributes: ["source_name"],
                    required: false,
                },
                {
                    model: db.leadChannel,
                    as: "channel_name",
                    attributes: ["channel_name"],
                    required: false,
                },
                {
                    model: db.leadType,
                    as: "type_name",
                    attributes: ["name"],
                    required: false,
                },
                {
                    model: db.officeType,
                    as: "office_type_name",
                    attributes: ["office_type_name"],
                    required: false,

                },
                {
                    model: db.flag,
                    as: "user_primary_flags",
                    attributes: ["flag_name"],
                    required: false,
                },
                {
                    model: db.country,
                    as: "preferredCountries",
                    attributes: ["country_name"],
                    required: false,
                },
                {
                    model: db.educationDetails,
                    as: "educationDetails",
                    where: { student_id: id },
                    required: false,
                },
                {
                    model: db.previousVisaDecline,
                    as: "previousVisaDeclines",
                    where: { student_id: id },
                    required: false,
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
                            attributes: ["course_name"]
                        },
                        { 
                            model: db.university,
                            as: "declined_university_applied",
                            required: false,
                            attributes: ["university_name"]
                        }
                    ]
                },
                {
                    model: db.previousVisaApprove,
                    as: "previousVisaApprovals",
                    where: { student_id: id },
                    required: false,
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
                            attributes: ["university_name"]
                        }
                    ]
                },
                {
                    model: db.travelHistory,
                    as: "travelHistories",
                    where: { student_id: id },
                    required: false,
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
