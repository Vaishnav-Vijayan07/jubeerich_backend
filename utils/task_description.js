const moment = require("moment");
const db = require("../models");

const createTaskDesc = async (primaryInfo, userId) => {
    try {
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

        let formattedYear = moment(existBasicInfo?.dob).year();
        let currentYear = moment().year();

        let formattedGender;

        if (existBasicInfo?.gender == 'Male') {
            formattedGender = 'Mr.';
        } else if (existBasicInfo?.gender == 'Female') {
            formattedGender = 'Ms.';
        } else if (existBasicInfo?.gender == 'Other') {
            formattedGender = 'Mx.'
        } else {
            formattedGender = ''
        }

        let age = currentYear && formattedYear ? `(${Number(currentYear) - Number(formattedYear)})` : '';
        let maritalStatus = existBasicInfo?.marital_status_details?.marital_status_name ? `${existBasicInfo?.marital_status_details?.marital_status_name},` : '';
        let city = primaryInfo?.city ? `${primaryInfo?.city},` : '';
        let studyPref = existStudyPref?.studyPreferenceDetails?.[0] ? `pursuing ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_courses?.course_name} at ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_university?.university_name}, Intake ${existStudyPref?.studyPreferenceDetails?.[0]?.intakeYear}` : '';

        let desc = `${formattedGender} ${primaryInfo?.full_name} ${Number.isNaN(age) ? '' : age}, ${maritalStatus} from ${city} ${studyPref}`

        return desc;

    } catch (error) {
        throw error
    }
}


const updateTaskDesc = async (primaryInfo, basicInfo, userId, loggedUserId, roleId) => {
    try {

        let countryName;

        if(roleId == process.env.COUNSELLOR_ROLE_ID || roleId == process.env.COUNTRY_MANAGER_ID){

            const adminUser = await db.adminUsers.findByPk(loggedUserId, {
                include: [
                    {
                        model: db.country,
                        attributes: ["country_name"]
                    }
                ]
            });

            if(!adminUser){
                throw new Error('No User Found');
            }
            countryName = adminUser?.country?.country_name;

        } else {
            const existTask = await db.tasks.findAll({ where: { studentId: userId, isCompleted: false, is_proceed_to_kyc: false } })
    
            if (!existTask.length > 0) {
                return true
            }
            countryName = existTask[0]?.title?.split("-")?.[1];
        }

        let existMaritalStatus;
        
        if(basicInfo?.['marital_status'] != 'null') {
            existMaritalStatus = await db.maritalStatus.findByPk(basicInfo?.['marital_status'])
        }
        
        let formattedYear = moment(basicInfo?.['dob']).year();
        
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

        let formattedGender;

        if (basicInfo?.['gender'] == 'Male') {
            formattedGender = 'Mr.';
        } else if (basicInfo?.['gender'] == 'Female') {
            formattedGender = 'Ms.';
        } else if (basicInfo?.['gender'] == 'Other') {
            formattedGender = 'Mx.'
        } else {
            formattedGender = ''
        }

        let age = currentYear && formattedYear ? `(${Number(currentYear) - Number(formattedYear)})` : '';
        // let age = currentYear && formattedYear && !isNaN(Number(formattedYear)) ? `(${Number(currentYear) - Number(formattedYear)})` : '';

        let maritalStatus = existMaritalStatus?.marital_status_name ? `${existMaritalStatus?.marital_status_name},` : '';
        let city = primaryInfo?.['city'] ? `${primaryInfo?.['city']},` : '';
        let studyPref = existStudyPref?.studyPreferenceDetails?.[0] ? `pursuing ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_courses?.course_name} at ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_university?.university_name}, Intake ${existStudyPref?.studyPreferenceDetails?.[0]?.intakeYear}` : '';

        let desc = `${formattedGender} ${primaryInfo?.['full_name']} ${Number.isNaN(age) ? '' : age}, ${maritalStatus} from ${city} ${studyPref}`
        let title = `${primaryInfo?.['full_name']} - ${countryName}`

        const updateTask = await db.tasks.update(
            {
                description: desc,
                title: title
            },
            { where: { studentId: userId, isCompleted: false, is_proceed_to_kyc: false, userId: loggedUserId } }
        )

        if ([updateTask] == 0) {
            return false
        } else {
            return true;
        }

    } catch (error) {
        throw error
    }
}

const updateTaskDescStudyPref = async (studyPrefId) => {
    try {
        const existStudyPref = await db.studyPreference.findByPk(studyPrefId,
            {
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
                    },
                    {
                        model: db.userPrimaryInfo,
                        as: "userPrimaryInfo",
                    }
                ]
            }
        )

        if (!existStudyPref?.studyPreferenceDetails.length > 0) {
            throw new Error('Study Preference not found')
        }

        const existBasicInfo = await db.userBasicInfo.findOne(
            {
                where: { user_id: existStudyPref?.userPrimaryInfoId },
                include: [
                    {
                        model: db.maritalStatus,
                        as: "marital_status_details"
                    }
                ]
            }
        )

        let formattedYear = moment(existBasicInfo?.['dob']).year();
        let currentYear = moment().year();

        let formattedGender;

        if (existBasicInfo?.['gender'] == 'Male') {
            formattedGender = 'Mr.';
        } else if (existBasicInfo?.['gender'] == 'Female') {
            formattedGender = 'Ms.';
        } else if (existBasicInfo?.['gender'] == 'Other') {
            formattedGender = 'Mx.'
        } else {
            formattedGender = ''
        }

        let age = currentYear && formattedYear ? `(${Number(currentYear) - Number(formattedYear)})` : '';

        let maritalStatus = existBasicInfo?.marital_status_details?.marital_status_name ? `${existBasicInfo?.marital_status_details?.marital_status_name},` : '';
        let city = existStudyPref?.userPrimaryInfo?.['city'] ? `${existStudyPref?.userPrimaryInfo?.['city']},` : '';
        let studyPref = existStudyPref?.studyPreferenceDetails?.[0] ? `pursuing ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_courses?.course_name} at ${existStudyPref?.studyPreferenceDetails?.[0]?.preferred_university?.university_name}, Intake ${existStudyPref?.studyPreferenceDetails?.[0]?.intakeYear}` : '';

        let desc = `${formattedGender} ${existStudyPref?.userPrimaryInfo?.['full_name']} ${Number.isNaN(age) ? '' : age}, ${maritalStatus} from ${city} ${studyPref}`

        const updateTask = await db.tasks.update(
            {
                description: desc,
            },
            // { where: { studentId: existStudyPref?.userPrimaryInfoId, isCompleted: false, is_proceed_to_kyc: false } }
            { where: { studentId: existStudyPref?.userPrimaryInfoId, isCompleted: false } }
        )

        if ([updateTask] == 0) {
            return false
        } else {
            return true;
        }

    } catch (error) {
        throw error
    }
}

module.exports = { createTaskDesc, updateTaskDesc, updateTaskDescStudyPref };