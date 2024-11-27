const moment = require("moment");
const db = require("../models");

const updateTaskDesc = async (primaryInfo, basicInfo, userId) => {
    try {

        const existTask = await db.tasks.findAll({ where: { studentId: userId, isCompleted: false, is_proceed_to_kyc: false }})

        console.log('existTask',existTask);

        if(!existTask.length > 0) {
            return true
        }

        let existTaskName = existTask[0]?.title?.split("-")?.[1];

        const existMaritalStatus = await db.maritalStatus.findByPk(basicInfo['marital_status']);

        let formattedYear = moment(basicInfo['dob']).year();
        let currentYear = moment().year();
        
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

        // if (!existStudyPref?.studyPreferenceDetails.length > 0) {
        //     throw new Error('Study Preference not found')
        // }

        console.log('Entered');

        let formattedGender;

        if(basicInfo['gender'] == 'Male'){
            formattedGender = 'Mr.';
        } else if(basicInfo['gender'] == 'Female'){
            formattedGender = 'Ms.';
        } else if (basicInfo['gender'] == 'Other'){
            formattedGender = 'Mx.'
        } else {
            formattedGender = ''
        }

        let age = currentYear && formattedGender ? `(${currentYear - formattedYear})` : '';
        let maritalStatus = existMaritalStatus?.marital_status_name ? `${existMaritalStatus?.marital_status_name},` : '';
        let city = primaryInfo['city'] ? `${primaryInfo['city']},` : '';
        let studyPref = existStudyPref?.studyPreferenceDetails?.[0] ? `pursuing ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_courses?.course_name} at ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_university?.university_name}, Intake ${existStudyPref?.studyPreferenceDetails?.[0]?.intakeYear}` : '';

        // let desc = `${formattedGender} ${primaryInfo['full_name']} ${age}, ${maritalStatus} from ${city} pursuing ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_courses?.course_name} at ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_university?.university_name}, Intake ${existStudyPref?.studyPreferenceDetails?.[0]?.intakeYear}`
        let desc = `${formattedGender} ${primaryInfo['full_name']} ${age}, ${maritalStatus} from ${city} ${studyPref}`
        let title = `${primaryInfo['full_name']} - ${existTaskName}`

        const updateTask = await db.tasks.update(
            { 
                description: desc,
                title: title 
            },
            { where: { studentId: userId, isCompleted: false, is_proceed_to_kyc: false } }
        )

        if([updateTask] == 0){
            return false
        } else {
            return true;
        }
        
    } catch (error) {
        throw error
    }
}

module.exports = { updateTaskDesc };