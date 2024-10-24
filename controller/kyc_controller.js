const db = require("../models");

exports.getKycDetails = async (req, res, next) => {
    try {
        const { id } = req.params;
        console.log('id', id);

        const personalDetails = await db.userPrimaryInfo.findOne({
            where: { id: id },
            attributes: ["id", "full_name", "email", "phone", "source_id", "city", "channel_id"],
        });

        if (!personalDetails) {
            throw new Error('User not found');
        }
        
        const [leadSource, branches, assignedCounselor, createdBy, educationDetails, studyPreferences, previousVisaDeclines, previousVisaApprovals, travelHistories, basicInfoDetails, passportDetails, workInfos, familyDetails, fundPlan, exams, graduationDetails, gapReasons, userEmploymentHistories, channel_name] = await Promise.all([
            personalDetails.getSource_name(),
            personalDetails.getBranch_name(),
            personalDetails.getAssigned_branch_counselor_name(),
            personalDetails.getCre_name(), 
            personalDetails.getEducationDetails({ where: { student_id: id } }),
            personalDetails.getStudyPreferences({
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
            }), 
            personalDetails.getPreviousVisaDeclines(
                {
                    where: { student_id: id },
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
                        },
                    ]
                }
            ),
            personalDetails.getPreviousVisaApprovals(
                {
                    where: { student_id: id },
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
                        }
                    ]
                }
            ), 
            personalDetails.getTravelHistories(
                { 
                    where: { student_id: id },
                    include: [
                        {
                            model: db.country,
                            as: "travelHistoryCountry",
                            required: false,
                            attributes: ["country_name", "country_code"]
                        }
                    ] 
                },
            ),
            personalDetails.getBasic_info_details(
                {
                    where: { user_id: id },
                    include: [
                        {
                            model: db.maritalStatus,
                            as: "marital_status_details",
                            required: false,
                            attributes: ["marital_status_name"]
                        }
                    ]
                }
            ), 
            personalDetails.getPassportDetails({ where: { user_id: id } }),
            personalDetails.getUserWorkInfos({ where: { user_id: id } }),  
            personalDetails.getFamilyDetails({ where: { user_id: id } }), 
            personalDetails.getFundPlan({ where: { student_id: id } }), 
            personalDetails.getExams({ where: { student_id: id } }), 
            personalDetails.getGraduationDetails({ where: { student_id: id } }),
            personalDetails.getGapReasons({ where: { student_id: id } }),
            personalDetails.getUserEmploymentHistories({ where: { student_id: id } }),
            personalDetails.getChannel_name()
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
  try {
    const { student_id } = req.body;
    const { role_name, role_id, userDecodeId } = req;

    const { country_id } = await db.adminUsers.findByPk(userDecodeId);

    const studyPrefDetails = await db.studyPreferenceDetails.findAll({
      include: [
        {
          model: db.studyPreference,
          as: "studyPreference",
          where: { countryId: country_id },
          attributes: [],
        },
      ],
      attributes: ["id"],
    });

    if (studyPrefDetails.length > 0) {
      const applicationsToCreate = studyPrefDetails.map((detail) => ({
        studyPrefernceId: detail.id,
      }));

      // Bulk create applications in one go
      await db.application.bulkCreate(applicationsToCreate);
    }

    res.status(200).json({
      status: true,
      data: studyPrefDetails,
      message: "Data retrieved successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.kycPendingDetails = async (req, res) => {
  try {
    const applicationData = await db.application.findAll({
      logging: console.log,
      include: [
        {
          model: db.studyPreferenceDetails,
          as: "studyPreferenceDetails",
          attributes: ["id", "kyc_status"],
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
      attributes: ["id"],
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