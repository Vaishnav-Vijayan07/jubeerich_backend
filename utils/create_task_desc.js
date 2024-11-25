const moment = require("moment");
const db = require("../models");

const createTaskDesc = async (primaryInfo, userId) => {
    try {

        console.log('primaryInfo',primaryInfo);
        
        const existBasicInfo = await db.userBasicInfo.findOne({
            where: { user_id: userId },
            attributes: ["id", "dob", "gender", "marital_status"],
            include: [
                {
                    model: db.maritalStatus,
                    as: 'marital_status_details'
                }
            ]
        });
        
        if (!existBasicInfo) {
            throw new Error('Basic info not found')
        }

        const existStudyPref = await db.studyPreference.findOne({
            where: { userPrimaryInfoId: userId },
            include: [
                {
                    model: db.studyPreferenceDetails,
                    as: "studyPreferenceDetails",
                    attributes: ["id", "universityId", "courseId", "intakeYear", "intakeMonth"],
                    include: [
                        {
                            model: db.university,
                            as: "preferred_university"
                        },
                        {
                            model: db.course,
                            as: "preferred_courses"
                        }
                    ]
                }
            ]
        })

        if (!existStudyPref) {
            throw new Error('Study Preference not found')
        }

        let formattedYear = moment(existBasicInfo?.dob).year();
        let currentYear = moment().year();

        let formattedGender;

        if(existBasicInfo?.gender == 'Male'){
            formattedGender = 'Mr.';
        } else if(existBasicInfo?.gender == 'Female'){
            formattedGender = 'Ms.';
        } else {
            formattedGender = 'Mx.'
        }

        let desc = `${formattedGender} ${primaryInfo?.full_name} (${currentYear - formattedYear}), ${existBasicInfo?.marital_status_details?.marital_status_name}, from ${primaryInfo?.city}, pursuing ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_courses?.course_name} at ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_university?.university_name}, Intake ${existStudyPref?.studyPreferenceDetails?.[0]?.intakeYear}`

        console.log('DESC', desc);

        return desc;
        
    } catch (error) {
        console.log(error);
        throw new Error('Internal server error')
    }
}

module.exports = { createTaskDesc };