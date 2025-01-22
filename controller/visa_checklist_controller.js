const db = require("../models");
const VisaChecklist = db.visaChecklistsMaster;
const VisaChecklistField = db.visaChecklistFields;
const { validationResult, check } = require("express-validator");
const VisaConfiguration = db.visaConfiguration;
const Country = db.country;

// Validation rules for VisaChecklist
const visaChecklistValidationRules = [
  check("step_name").not().isEmpty().withMessage("Step name is required"),
  check("description").optional().isString().withMessage("Description must be a string"),
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
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
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
      return res.status(404).json({ status: false, message: "Visa checklist not found" });
    }
    res.status(200).json({ status: true, data: visaChecklist });
  } catch (error) {
    console.error(`Error retrieving visa checklist: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
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
        const formattedFields = fields.map((field) => ({
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
      res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
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
        return res.status(404).json({ status: false, message: "Visa checklist not found" });
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
        const formattedFields = fields.map((field) => ({
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
      res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
    }
  },
];

// Delete a visa checklist
exports.deleteVisaChecklist = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const visaChecklist = await VisaChecklist.findByPk(id);
    if (!visaChecklist) {
      return res.status(404).json({ status: false, message: "Visa checklist not found" });
    }

    await visaChecklist.destroy();
    res.status(200).json({ status: true, message: "Visa checklist deleted successfully" });
  } catch (error) {
    console.error(`Error deleting visa checklist: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// ============== visa Configuration ==============

// Create or Update VisaConfiguration entries
exports.configureVisa = async (req, res) => {
  const { country_id, visa_checklist_ids } = req.body;

  // Validate request
  if (!country_id || !visa_checklist_ids || !Array.isArray(visa_checklist_ids)) {
    return res.status(400).send({
      message:
        "Invalid input data. 'country_id' and 'visa_checklist_ids' are required, and 'visa_checklist_ids' should be an array.",
    });
  }

  try {
    // Ensure the country exists
    const country = await Country.findByPk(country_id);
    if (!country) {
      return res.status(404).send({
        message: `Country with id ${country_id} not found.`,
      });
    }

    // Ensure the visa checklists exist
    const visaChecklists = await VisaChecklist.findAll({
      where: {
        id: visa_checklist_ids,
      },
    });

    if (visaChecklists.length !== visa_checklist_ids.length) {
      return res.status(404).send({
        message: "Some visa checklists were not found.",
      });
    }

    // Delete existing configurations for this country
    await VisaConfiguration.destroy({
      where: { country_id },
    });

    // Create new entries in the VisaConfiguration table
    const visaConfigurationEntries = visa_checklist_ids.map((visa_checklist_id) => ({
      visa_checklist_id,
      country_id,
    }));

    await VisaConfiguration.bulkCreate(visaConfigurationEntries);

    res.send({
      message: "Visa configurations were updated successfully.",
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while updating the visa configurations.",
    });
  }
};

// List all countries with their associated visa checklists
exports.getVisaConfiguration = async (req, res) => {
  try {
    // Retrieve all countries with their associated visa checklists
    const countries = await Country.findAll({
      attributes: ["id", "country_name", "country_code"],
      include: [
        {
          model: VisaChecklist,
          through: {
            attributes: [], // Exclude join table attributes
          },
          attributes: ["id", "step_name"], // Adjust attributes as needed
        },
      ],
    });
    res.send({
      message: "Countries with associated Visa Checklists retrieved successfully.",
      data: countries,
    });
  } catch (error) {
    res.status(500).send({
      message: error.message || "Some error occurred while retrieving the countries with visa checklists.",
    });
  }
};
