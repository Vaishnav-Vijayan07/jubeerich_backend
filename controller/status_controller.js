const db = require("../models");
const Status = db.status;
const { validationResult, check } = require("express-validator");


// Validation rules for Status
const statusValidationRules = [
  check("status_name").not().isEmpty().withMessage("Status name is required"),
  check("status_description").optional().isString().withMessage("Status description must be a string"),
  check("color").optional().isString().isLength({ min: 7, max: 40 }).withMessage("Color must be a valid hex code"),
  check("updated_by").optional().isInt().withMessage("Updated by must be an integer"),
];

// Get all statuses
exports.getAllStatuses = async (req, res) => {
  try {
    const statuses = await Status.findAll();
    res.status(200).json({
      status: true,
      data: statuses,
    });
  } catch (error) {
    console.error(`Error retrieving statuses: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get status by ID
exports.getStatusById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({
        status: false,
        message: "Status not found",
      });
    }
    res.status(200).json({
      status: true,
      data: status,
    });
  } catch (error) {
    console.error(`Error retrieving status: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new status
exports.addStatus = [
  // Validation middleware
  ...statusValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { status_name, status_description, color, updated_by } = req.body;

    try {
      const newStatus = await Status.create({
        status_name,
        status_description,
        color,
        updated_by,
      });
      res.status(201).json({
        status: true,
        message: "Status created successfully",
        data: newStatus,
      });
    } catch (error) {
      console.error(`Error creating status: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a status
exports.updateStatus = [
  // Validation middleware
  ...statusValidationRules,
  async (req, res) => {
    const id = parseInt(req.params.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const status = await Status.findByPk(id);
      if (!status) {
        return res.status(404).json({
          status: false,
          message: "Status not found",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedStatus = await status.update({
        status_name: req.body.status_name ?? status.status_name,
        status_description: req.body.status_description ?? status.status_description,
        color: req.body.color ?? status.color,
        updated_by: req.body.updated_by ?? status.updated_by,
      });

      res.status(200).json({
        status: true,
        message: "Status updated successfully",
        data: updatedStatus,
      });
    } catch (error) {
      console.error(`Error updating status: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete a status
exports.deleteStatus = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const status = await Status.findByPk(id);
    if (!status) {
      return res.status(404).json({
        status: false,
        message: "Status not found",
      });
    }

    await status.destroy();
    res.status(200).json({
      status: true,
      message: "Status deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting status: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};