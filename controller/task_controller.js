const db = require("../models");

exports.getTasks = async (req, res) => {
  try {
    const userId = req.userDecodeId;
    const tasks = await db.tasks.findAll({
      where: { userId: userId },
    });

    res.status(200).json({
      status: true,
      message: "Tasks retrieved successfully",
      data: tasks,
    });
  } catch (error) {
    console.error(`Error fetching tasks: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentBasicInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const basicInfo = await db.userBasicInfo.findOne({
      where: { user_id: studentId },
    });

    // Fetch primary information for the student
    const primaryInfo = await db.userPrimaryInfo.findOne({
      where: { id: studentId },
      attributes: [
        'full_name',
        'email',
        'phone',
        'city',
        'preferred_country',
        'office_type',
        'remarks',
        'lead_received_date'
      ],  // List the required fields
    });

    // Extract data values, or use default empty object if no data
    const basicInfoData = basicInfo ? basicInfo.dataValues : {};
    const primaryInfoData = primaryInfo ? primaryInfo.dataValues : {};

    // Combine basicInfoData with filtered primaryInfoData
    const combinedInfo = {
      ...primaryInfoData,
      ...basicInfoData,
    };

    console.log("Combined info:", combinedInfo);

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: combinedInfo,
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentAcademicInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const academicInfo = await db.userAcademicInfo.findOne({
      where: { user_id: studentId },
    });

    // Extract data values, or use default empty object if no data
    const acadmicInfoData = academicInfo ? academicInfo.dataValues : {};

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: acadmicInfoData,
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getStudentStudyPreferenceInfoById = async (req, res) => {
  try {
    const studentId = req.params.id;
    console.log("Fetching info for studentId:", studentId);

    // Fetch basic information for the student
    const studyPreferenceInfo = await db.userStudyPreference.findOne({
      where: { user_id: studentId },
    });

    // Extract data values, or use default empty object if no data
    const studyPreferenceInfoData = studyPreferenceInfo ? studyPreferenceInfo.dataValues : {};

    // Send the response with combined information
    res.status(200).json({
      status: true,
      message: "Student info retrieved successfully",
      data: studyPreferenceInfoData,
    });
  } catch (error) {
    console.error(`Error fetching student info: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};