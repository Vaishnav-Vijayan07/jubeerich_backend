const db = require("../models");
const Flag = db.flag;
const { validationResult, check } = require("express-validator");

// Validation rules for Flag
const flagValidationRules = [
  check("flag_name").not().isEmpty().withMessage("Flag name is required"),
  check("flag_description").optional().isString().withMessage("Flag description must be a string"),
  check("updated_by").optional().isInt().withMessage("Updated by must be an integer"),
];

// Get all flags
exports.getAllFlags = async (req, res) => {
  try {
    const flags = await Flag.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      status: true,
      data: flags,
    });
  } catch (error) {
    console.error(`Error retrieving flags: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Get flag by ID
exports.getFlagById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const flag = await Flag.findByPk(id);
    if (!flag) {
      return res.status(404).json({
        status: false,
        message: "Flag not found",
      });
    }
    res.status(200).json({
      status: true,
      data: flag,
    });
  } catch (error) {
    console.error(`Error retrieving flag: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Add a new flag
exports.addFlag = [
  // Validation middleware
  ...flagValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.userDecodeId;
    const { flag_name, flag_description, updated_by, color } = req.body;

    try {
      const newFlag = await Flag.create(
        {
          flag_name,
          flag_description,
          updated_by,
          color,
        },
        { userId }
      );
      res.status(201).json({
        status: true,
        message: "Flag created successfully",
        data: newFlag,
      });
    } catch (error) {
      console.error(`Error creating flag: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Update a flag
exports.updateFlag = [
  // Validation middleware
  ...flagValidationRules,
  async (req, res) => {
    const id = parseInt(req.params.id);
    const userId = req.userDecodeId;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const flag = await Flag.findByPk(id);
      if (!flag) {
        return res.status(404).json({
          status: false,
          message: "Flag not found",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedFlag = await flag.update(
        {
          flag_name: req.body.flag_name ?? flag.flag_name,
          flag_description: req.body.flag_description ?? flag.flag_description,
          color: req.body.color ?? flag.color,
          updated_by: req.body.updated_by ?? flag.updated_by,
        },
        { userId }
      );

      res.status(200).json({
        status: true,
        message: "Flag updated successfully",
        data: updatedFlag,
      });
    } catch (error) {
      console.error(`Error updating flag: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Delete a flag
exports.deleteFlag = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;

  try {
    const flag = await Flag.findByPk(id);
    if (!flag) {
      return res.status(404).json({
        status: false,
        message: "Flag not found",
      });
    }

    await flag.destroy({ userId });
    res.status(200).json({
      status: true,
      message: "Flag deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting flag: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
