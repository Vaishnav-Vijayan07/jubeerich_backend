const db = require("../models");
const VisaChecklist = db.visaChecklistsMaster;
const VisaChecklistField = db.visaChecklistFields;
const { validationResult, check } = require("express-validator");

// Validation rules for VisaChecklist
const visaChecklistValidationRules = [
  check("step_name").not().isEmpty().withMessage("Step name is required"),
  check("description")
    .optional()
    .isString()
    .withMessage("Description must be a string"),
];

// Get all visa checklists
exports.getAllVisaChecklists = async (req, res) => {
  try {
    const visaChecklists = await VisaChecklist.findAll({
      include: [
        {
          model: VisaChecklistField,
          as: "fields",
          attributes: ["field_name", "field_type"],
        },
      ],
    });

    res.status(200).json({ status: true, data: visaChecklists });
  } catch (error) {
    console.error(`Error retrieving visa checklists: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get visa checklist by ID
exports.getVisaChecklistById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const visaChecklist = await VisaChecklist.findByPk(id, {
      include: [
        {
          model: VisaChecklistField,
          as: "fields",
        },
      ],
    });
    if (!visaChecklist) {
      return res
        .status(404)
        .json({ status: false, message: "Visa checklist not found" });
    }
    res.status(200).json({ status: true, data: visaChecklist });
  } catch (error) {
    console.error(`Error retrieving visa checklist: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Add a new visa checklist with multiple fields
exports.addVisaChecklist = [
  // Validation middleware
  ...visaChecklistValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { step_name, description, fields } = req.body;

    try {
      // Create the visa checklist
      const newVisaChecklist = await VisaChecklist.create({
        step_name,
        description,
      });

      // Create multiple visa checklist fields (if any)
      if (fields && fields.length > 0) {
        const formattedFields = fields.map(field => ({
          visa_checklist_id: newVisaChecklist.id,
          field_name: field.field_name,
          field_type: field.field_type,
        }));

        await VisaChecklistField.bulkCreate(formattedFields);
      }
 
      res.status(201).json({
        status: true,
        message: "Visa checklist created successfully",
        data: newVisaChecklist,
      });
    } catch (error) {

      console.error(`Error creating visa checklist: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Update a visa checklist with multiple fields
exports.updateVisaChecklist = [
  // Validation middleware
  ...visaChecklistValidationRules,
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { step_name, description, fields } = req.body;

    try {
      const visaChecklist = await VisaChecklist.findByPk(id);
      if (!visaChecklist) {
        return res
          .status(404)
          .json({ status: false, message: "Visa checklist not found" });
      }

      // Update the visa checklist
      const updatedVisaChecklist = await visaChecklist.update({
        step_name: step_name ?? visaChecklist.step_name,
        description: description ?? visaChecklist.description,
      });

      // Update the visa checklist fields (if any)
      if (fields && fields.length > 0) {
        // Delete old fields
        await VisaChecklistField.destroy({
          where: { visa_checklist_id: id },
        });

        // Insert new fields
        const formattedFields = fields.map(field => ({
          visa_checklist_id: updatedVisaChecklist.id,
          field_name: field.field_name,
          field_type: field.field_type,
        }));

        console.log("Formatted Fields");
        

        await VisaChecklistField.bulkCreate(formattedFields);
      }

      res.status(200).json({
        status: true,
        message: "Visa checklist updated successfully",
        data: updatedVisaChecklist,
      });
    } catch (error) {
      console.error(`Error updating visa checklist: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Delete a visa checklist
exports.deleteVisaChecklist = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const visaChecklist = await VisaChecklist.findByPk(id);
    if (!visaChecklist) {
      return res
        .status(404)
        .json({ status: false, message: "Visa checklist not found" });
    }

    await visaChecklist.destroy();
    res
      .status(200)
      .json({ status: true, message: "Visa checklist deleted successfully" });
  } catch (error) {
    console.error(`Error deleting visa checklist: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
