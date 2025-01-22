const db = require("../models");

exports.createOrUpdateTaskConfig = async (req, res) => {
  try {
    const { task_prefix, id } = req.body;

    const [config, created] = await db.masterData.upsert(
      {
        id,
        task_prefix,
      },
      {
        returning: true,
      }
    );

    if (created) {
      res.status(201).json({
        status: true,
        message: "Task Config created successfully",
        data: config,
      });
    } else {
      res.status(200).json({
        status: true,
        message: "Task Config updated successfully",
        data: config,
      });
    }
  } catch (error) {
    console.error(`Error in upserting task config: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.deleteTaskConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedConfig = await db.masterData.destroy({ where: { id: id } });

    if (!deletedConfig) {
      return res.status(409).json({
        status: false,
        message: "Task config not deleted",
      });
    }

    res.status(200).json({
      status: true,
      message: "Task Config deleted successfully",
    });
  } catch (error) {
    console.error(`Error deletion: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getTaskConfig = async (req, res) => {
  try {
    const { id } = req.params;

    const existTaskConfig = await db.masterData.findByPk(id, { attributes: ["id", "task_prefix"] });

    if (!existTaskConfig) {
      return res.status(409).json({
        status: false,
        message: "Task config not found",
      });
    }

    res.status(200).json({
      status: true,
      data: existTaskConfig,
      message: "Task Config retrieved successfully",
    });
  } catch (error) {
    console.error(`Error deletion: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getAllTaskConfig = async (req, res) => {
  try {
    const existTaskConfig = await db.masterData.findAll({ attributes: ["id", "task_prefix"] });

    res.status(200).json({
      status: true,
      data: existTaskConfig || [],
      message: "Task Config retrieved successfully",
    });
  } catch (error) {
    console.error(`Error deletion: ${error}`);
    return res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
