const { Op } = require("sequelize");
const db = require("../models");

exports.getStudyPreferencesByUserPrimaryInfo = async (req, res) => {
    const { userPrimaryInfoId } = req.query;

    if (!userPrimaryInfoId) {
        return res.status(400).json({
            status: false,
            message: "Invalid input. Please provide userPrimaryInfoId.",
        });
    }

    try {
        // Fetch study preferences for the userPrimaryInfo
        const studyPreferences = await db.studyPreference.findAll({
            where: { userPrimaryInfoId },
            include: [
                {
                    model: db.studyPreferenceDetails,
                    include: [
                        db.university,
                        db.campus,
                        db.courseType,
                        db.stream,
                        db.course,
                    ],
                },
                {
                    model: db.country,
                    attributes: ['id', 'country_name'], // Fetch only the required attributes
                },
            ],
        });

        // Organize data by country
        const result = studyPreferences.reduce((acc, pref) => {
            const countryId = pref.country.id;
            if (!acc[countryId]) {
                acc[countryId] = {
                    countryId,
                    countryName: pref.country.country_name,
                    preferences: [],
                };
            }

            acc[countryId].preferences.push({
                ...pref.toJSON(),
                details: pref.studyPreferenceDetails.map(detail => ({
                    ...detail.toJSON(),
                    university: detail.university,
                    campus: detail.campus,
                    courseType: detail.courseType,
                    stream: detail.stream,
                    course: detail.course,
                })),
            });

            return acc;
        }, {});

        res.status(200).json({
            status: true,
            data: Object.values(result),
        });
    } catch (error) {
        console.error(`Error retrieving study preferences: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};

exports.createStudyPreferencesByUserPrimaryInfo = async (req, res) => {
    const { userPrimaryInfoId, countryIds } = req.body;

    console.log('userPrimaryInfoId',userPrimaryInfoId);
    console.log('countryIds',countryIds);
    

    if (!userPrimaryInfoId || !countryIds.length) {
        return res.status(400).json({
            status: false,
            message: "Invalid input. Please provide userPrimaryInfoId.",
        });
    }

    try {

        for(let index = 0; index < countryIds.length; index++){
            const createUserPrimaryJoinInfo = await db.studyPreference.create(
                {
                    userPrimaryInfoId,
                    countryId: countryIds[index]
                }
            )
            console.log('createUserPrimaryJoinInfo',createUserPrimaryJoinInfo);
        }

        res.status(200).json({
            status: true,
            message: 'Created UserPrimaryJoinInfo'
        });

    } catch (error) {
        console.error(`Error creating study preferences: ${error}`);
        res.status(500).json({
            status: false,
            message: "Internal server error",
        });
    }
};
