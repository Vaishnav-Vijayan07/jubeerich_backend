const db = require("../models");
const MaritalStatus = db.maritalStatus;
const { validationResult, check } = require("express-validator");

// Validation rules for MaritalStatus
const maritalStatusValidationRules = [
  check("marital_status_name").not().isEmpty().withMessage("Marital status name is required"),
  check("marital_status_description").optional().isString().withMessage("Marital status description must be a string"),
  check("updated_by").optional().isInt().withMessage("Updated by must be an integer"),
];

// Get all marital statuses
exports.getAllMaritalStatuses = async (req, res) => {
  try {
    const maritalStatuses = await MaritalStatus.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      status: true,
      data: maritalStatuses,
    });
  } catch (error) {
    console.error(`Error retrieving marital statuses: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Get marital status by ID
exports.getMaritalStatusById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const maritalStatus = await MaritalStatus.findByPk(id);
    if (!maritalStatus) {
      return res.status(404).json({
        status: false,
        message: "Marital status not found",
      });
    }
    res.status(200).json({
      status: true,
      data: maritalStatus,
    });
  } catch (error) {
    console.error(`Error retrieving marital status: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Add a new marital status
exports.addMaritalStatus = [
  // Validation middleware
  ...maritalStatusValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { marital_status_name, marital_status_description, updated_by } = req.body;
    const userId = req.userDecodeId;

    try {
      const newMaritalStatus = await MaritalStatus.create(
        {
          marital_status_name,
          marital_status_description,
          updated_by,
        },
        { userId }
      );
      res.status(201).json({
        status: true,
        message: "Marital status created successfully",
        data: newMaritalStatus,
      });
    } catch (error) {
      console.error(`Error creating marital status: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Update a marital status
exports.updateMaritalStatus = [
  // Validation middleware
  ...maritalStatusValidationRules,
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
      const maritalStatus = await MaritalStatus.findByPk(id);
      if (!maritalStatus) {
        return res.status(404).json({
          status: false,
          message: "Marital status not found",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedMaritalStatus = await maritalStatus.update(
        {
          marital_status_name: req.body.marital_status_name ?? maritalStatus.marital_status_name,
          marital_status_description: req.body.marital_status_description ?? maritalStatus.marital_status_description,
          updated_by: req.body.updated_by ?? maritalStatus.updated_by,
        },
        { userId }
      );

      res.status(200).json({
        status: true,
        message: "Marital status updated successfully",
        data: updatedMaritalStatus,
      });
    } catch (error) {
      console.error(`Error updating marital status: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Delete a marital status
exports.deleteMaritalStatus = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;

  try {
    const maritalStatus = await MaritalStatus.findByPk(id);
    if (!maritalStatus) {
      return res.status(404).json({
        status: false,
        message: "Marital status not found",
      });
    }

    await maritalStatus.destroy({userId});
    res.status(200).json({
      status: true,
      message: "Marital status deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting marital status: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
