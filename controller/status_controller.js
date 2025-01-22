const db = require("../models");
const Status = db.status;
const StatusType = db.statusType;
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
    const statuses = await Status.findAll({
      include: [
        {
          model: StatusType,
          attributes: ["type_name"],
          as: "statusType",
        },
      ],
      order: [["created_at", "DESC"]],
    });
    const transformedStatuses = statuses.map((status) => ({
      ...status.toJSON(),
      statusType: status.statusType?.type_name || null, // Add a new field with fallback
    }));
    res.status(200).json({
      status: true,
      data: transformedStatuses,
    });
  } catch (error) {
    console.error(`Error retrieving statuses: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
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
      message: "An error occurred while processing your request. Please try again later.",
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

    const { status_name, status_description, color, type_id, updated_by } = req.body;

    try {
      const newStatus = await Status.create({
        status_name,
        status_description,
        color,
        type_id,
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
        message: "An error occurred while processing your request. Please try again later.",
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
        type_id: req.body.type_id ?? status.type_id,
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
        message: "An error occurred while processing your request. Please try again later.",
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
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Fetch all status types
exports.getStatusTypes = async (req, res) => {
  try {
    const statusTypes = await StatusType.findAll({
      attributes: ["id", "type_name", "priority"],
    });
    res.status(200).json({ success: true, data: statusTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error fetching status types", error: error.message });
  }
};

// Add a new status type
exports.addStatusType = async (req, res) => {
  try {
    const { type_name, priority } = req.body;

    if (!type_name || priority === undefined) {
      res.status(400).json({ success: false, message: "type_name and priority are required" });
      return;
    }

    const newStatusType = await StatusType.create({ type_name, priority });
    res.status(201).json({ success: true, data: newStatusType });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error adding status type", error: error.message });
  }
};

// Update an existing status type
exports.updateStatusType = async (req, res) => {
  try {
    const { id } = req.params;
    const { type_name, priority } = req.body;

    const statusType = await StatusType.findByPk(id);

    if (!statusType) {
      res.status(404).json({ success: false, message: "Status type not found" });
      return;
    }

    await statusType.update({ type_name, priority });
    res.status(200).json({ success: true, data: statusType });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error updating status type", error: error.message });
  }
};

// Delete a status type
exports.deleteStatusType = async (req, res) => {
  try {
    const { id } = req.params;

    const statusType = await StatusType.findByPk(id);

    if (!statusType) {
      res.status(404).json({ success: false, message: "Status type not found" });
      return;
    }

    await statusType.destroy();
    res.status(200).json({ success: true, message: "Status type deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Error deleting status type", error: error.message });
  }
};
