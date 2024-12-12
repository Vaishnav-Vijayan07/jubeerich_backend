const moment = require("moment");
const db = require("../models");

const createTaskDesc = async (primaryInfo, userId) => {
    try {
        const [existBasicInfo, existStudyPref] = await Promise.all([
            db.userBasicInfo.findOne({
                where: { user_id: userId },
                attributes: ["id", "dob", "gender", "marital_status"],
                include: [{
                    model: db.maritalStatus,
                    as: 'marital_status_details'
                }]
            }),
            db.studyPreference.findOne({
                where: { userPrimaryInfoId: userId },
                include: [{
                    model: db.studyPreferenceDetails,
                    as: "studyPreferenceDetails",
                    attributes: ["id", "universityId", "courseId", "intakeYear", "intakeMonth"],
                    include: [
                        { model: db.university, as: "preferred_university" },
                        { model: db.course, as: "preferred_courses" }
                    ]
                }]
            })
        ]);

        const formattedYear = moment(existBasicInfo?.dob).year();
        const currentYear = moment().year();
        const age = formattedYear && formattedYear < currentYear ? `(${currentYear - formattedYear})` : '';

        const genderMap = { Male: 'Mr.', Female: 'Ms.', Other: 'Mx.' };
        const formattedGender = genderMap[existBasicInfo?.gender] || '';

        const maritalStatus = existBasicInfo?.marital_status_details?.marital_status_name
            ? `${existBasicInfo.marital_status_details.marital_status_name},`
            : '';

        const city = primaryInfo?.city ? `${primaryInfo.city},` : '';

        const studyPrefDetails = existStudyPref?.studyPreferenceDetails?.[0];
        const studyPref = studyPrefDetails
            ? `pursuing ${studyPrefDetails.preferred_courses?.course_name} at ${studyPrefDetails.preferred_university?.university_name}, Intake ${studyPrefDetails.intakeYear}`
            : '';

        return `${formattedGender} ${primaryInfo?.full_name} ${age}, ${maritalStatus} from ${city} ${studyPref}`;
    } catch (error) {
        throw error;
    }
};



const updateTaskDesc = async (primaryInfo, basicInfo, userId, loggedUserId, roleId) => {
    try {
        let countryName;

        if ([process.env.COUNSELLOR_ROLE_ID.toString(), process.env.COUNTRY_MANAGER_ID.toString()].includes(roleId.toString())) {
            const adminUser = await db.adminUsers.findByPk(loggedUserId, {
                include: [{
                    model: db.country,
                    attributes: ["country_name"]
                }]
            });

            if (!adminUser) throw new Error('No User Found');

            countryName = adminUser?.country?.country_name;
        } else {
            const existTask = await db.tasks.findAll({
                where: { studentId: userId, isCompleted: false, is_proceed_to_kyc: false }
            });

            if (!existTask.length) return true;

            countryName = existTask[0]?.title?.split("-")?.[1];
        }

        const existMaritalStatus = basicInfo?.['marital_status'] !== 'null'
            ? await db.maritalStatus.findByPk(basicInfo?.['marital_status'])
            : null;

        const formattedYear = moment(basicInfo?.['dob']).year();
        const currentYear = moment().year();
        const age = formattedYear && formattedYear < currentYear ? `(${currentYear - formattedYear})` : '';

        const genderMap = { Male: 'Mr.', Female: 'Ms.', Other: 'Mx.' };
        const formattedGender = genderMap[basicInfo?.['gender']] || '';

        const maritalStatus = existMaritalStatus?.marital_status_name
            ? `${existMaritalStatus.marital_status_name},`
            : '';

        const city = primaryInfo?.['city'] ? `${primaryInfo['city']},` : '';

        const existStudyPref = await db.studyPreference.findOne({
            where: { userPrimaryInfoId: userId },
            include: [{
                model: db.studyPreferenceDetails,
                as: "studyPreferenceDetails",
                attributes: ["id", "universityId", "courseId", "intakeYear", "intakeMonth"],
                include: [
                    { model: db.university, as: "preferred_university" },
                    { model: db.course, as: "preferred_courses" }
                ]
            }]
        });

        const studyPrefDetails = existStudyPref?.studyPreferenceDetails?.[0];
        const studyPref = studyPrefDetails
            ? `pursuing ${studyPrefDetails.preferred_courses?.course_name} at ${studyPrefDetails.preferred_university?.university_name}, Intake ${studyPrefDetails.intakeYear}`
            : '';

        const desc = `${formattedGender} ${primaryInfo?.['full_name']} ${age}, ${maritalStatus} from ${city} ${studyPref}`;
        const title = `${primaryInfo?.['full_name']} - ${countryName}`;

        const [updateTask] = await db.tasks.update(
            { description: desc, title: title },
            { where: { studentId: userId, isCompleted: false, is_proceed_to_kyc: false, userId: loggedUserId } }
        );

        return !!updateTask;
    } catch (error) {
        throw error;
    }
};

const updateTaskDescStudyPref = async (studyPrefId) => {
    try {
        const existStudyPref = await db.studyPreference.findByPk(studyPrefId, {
            include: [
                {
                    model: db.studyPreferenceDetails,
                    as: "studyPreferenceDetails",
                    attributes: ["id", "universityId", "courseId", "intakeYear", "intakeMonth"],
                    include: [
                        { model: db.university, as: "preferred_university" },
                        { model: db.course, as: "preferred_courses" }
                    ]
                },
                {
                    model: db.userPrimaryInfo,
                    as: "userPrimaryInfo",
                }
            ]
        });

        if (!existStudyPref?.studyPreferenceDetails?.length) {
            throw new Error('Study Preference not found');
        }

        const existBasicInfo = await db.userBasicInfo.findOne({
            where: { user_id: existStudyPref?.userPrimaryInfoId },
            include: [
                {
                    model: db.maritalStatus,
                    as: "marital_status_details"
                }
            ]
        });

        const formattedYear = moment(existBasicInfo?.['dob']).year();
        const currentYear = moment().year();
        const age = formattedYear && formattedYear < currentYear ? `(${currentYear - formattedYear})` : '';

        const genderMap = { Male: 'Mr.', Female: 'Ms.', Other: 'Mx.' };
        const formattedGender = genderMap[existBasicInfo?.['gender']] || '';

        const maritalStatus = existBasicInfo?.marital_status_details?.marital_status_name
            ? `${existBasicInfo.marital_status_details.marital_status_name},`
            : '';

        const city = existStudyPref?.userPrimaryInfo?.['city'] ? `${existStudyPref.userPrimaryInfo['city']},` : '';

        const studyPrefDetails = existStudyPref?.studyPreferenceDetails?.[0];
        const studyPref = studyPrefDetails
            ? `pursuing ${studyPrefDetails.preferred_courses?.course_name} at ${studyPrefDetails.preferred_university?.university_name}, Intake ${studyPrefDetails.intakeYear}`
            : '';

        const desc = `${formattedGender} ${existStudyPref?.userPrimaryInfo?.['full_name']} ${age}, ${maritalStatus} from ${city} ${studyPref}`;

        const [updateTask] = await db.tasks.update(
            { description: desc },
            { where: { studentId: existStudyPref?.userPrimaryInfoId, isCompleted: false } }
        );

        return !!updateTask;
    } catch (error) {
        throw error;
    }
};

module.exports = { createTaskDesc, updateTaskDesc, updateTaskDescStudyPref };