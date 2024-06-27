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
