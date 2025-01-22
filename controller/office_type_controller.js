const db = require("../models");
const OfficeType = db.officeType;
const { validationResult, check } = require("express-validator");

// Validation rules for OfficeType
const officeTypeValidationRules = [
  check("office_type_name").not().isEmpty().withMessage("Office type name is required"),
  check("office_type_description").optional().isString().withMessage("Office type description must be a string"),
  check("updated_by").optional().isInt().withMessage("Updated by must be an integer"),
];

// Utility function to generate a unique slug
async function generateUniqueSlug(name, model) {
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '').toUpperCase();
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await model.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}_${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// Get all office types
exports.getAllOfficeTypes = async (req, res) => {
  try {
    const officeTypes = await OfficeType.findAll();
    res.status(200).json({
      status: true,
      data: officeTypes,
    });
  } catch (error) {
    console.error(`Error retrieving office types: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Get office type by ID
exports.getOfficeTypeById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const officeType = await OfficeType.findByPk(id);
    if (!officeType) {
      return res.status(404).json({
        status: false,
        message: "Office type not found",
      });
    }
    res.status(200).json({
      status: true,
      data: officeType,
    });
  } catch (error) {
    console.error(`Error retrieving office type: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Add a new office type
exports.addOfficeType = [
  // Validation middleware
  officeTypeValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { office_type_name, office_type_description, updated_by } = req.body;

    try {
      const slug = await generateUniqueSlug(office_type_name, OfficeType);
      const newOfficeType = await OfficeType.create({
        office_type_name,
        office_type_description,
        slug, // Add the slug here
        updated_by,
      });
      res.status(201).json({
        status: true,
        message: "Office type created successfully",
        data: newOfficeType,
      });
    } catch (error) {
      console.error(`Error creating office type: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Update an office type
exports.updateOfficeType = [
  // Validation middleware
  officeTypeValidationRules,
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
      const officeType = await OfficeType.findByPk(id);
      if (!officeType) {
        return res.status(404).json({
          status: false,
          message: "Office type not found",
        });
      }

      const updatedData = {
        office_type_name: req.body.office_type_name !== undefined ? req.body.office_type_name : officeType.office_type_name,
        office_type_description: req.body.office_type_description !== undefined ? req.body.office_type_description : officeType.office_type_description,
        updated_by: req.body.updated_by !== undefined ? req.body.updated_by : officeType.updated_by,
      };

      // Update slug if office_type_name is changed
      if (req.body.office_type_name && req.body.office_type_name !== officeType.office_type_name) {
        updatedData.slug = await generateUniqueSlug(req.body.office_type_name, OfficeType);
      }

      const updatedOfficeType = await officeType.update(updatedData);

      res.status(200).json({
        status: true,
        message: "Office type updated successfully",
        data: updatedOfficeType,
      });
    } catch (error) {
      console.error(`Error updating office type: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Delete an office type
exports.deleteOfficeType = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const officeType = await OfficeType.findByPk(id);
    if (!officeType) {
      return res.status(404).json({
        status: false,
        message: "Office type not found",
      });
    }

    await officeType.destroy();
    res.status(200).json({
      status: true,
      message: "Office type deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting office type: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
