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
        "full_name",
        "email",
        "phone",
        "city",
        "preferred_country",
        "office_type",
        "remarks",
        "source_id",
        "channel_id",
        "lead_received_date",
        "status_id"
      ], // List the required fields
      include: [
        {
          model: db.country,
          as: "country_name",
          attributes: ["country_name"],
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
        },
        {
          model: db.leadChannel,
          as: "channel_name",
          attributes: ["channel_name"],
        },
        {
          model: db.status,
          as:"status",
          attributes: ["status_name"],
        },
      ],
      nest: true,
    });

    // Extract data values, or use default empty object if no data
    const basicInfoData = basicInfo ? basicInfo.dataValues : {};
    const primaryInfoData = primaryInfo ? primaryInfo.dataValues : {};

    // Combine basicInfoData with filtered primaryInfoData
    const combinedInfo = {
      ...primaryInfoData,
      country_name: primaryInfo?.country_name?.country_name,
      source_name: primaryInfo?.source_name?.source_name,
      channel_name: primaryInfo?.channel_name.channel_name,
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
