const db = require("../models");
const Region = db.region;
const { validationResult, check } = require("express-validator");

// Validation rules for Region
const regionValidationRules = [
  check("region_name").not().isEmpty().withMessage("Region name is required"),
  check("region_description").optional().isString().withMessage("Region description must be a string"),
  check("updated_by").optional().isInt().withMessage("Updated by must be an integer"),
];

// Get all regions
exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Region.findAll();
    res.status(200).json({
      status: true,
      data: regions,
    });
  } catch (error) {
    console.error(`Error retrieving regions: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get region by ID
exports.getRegionById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        status: false,
        message: "Region not found",
      });
    }
    res.status(200).json({
      status: true,
      data: region,
    });
  } catch (error) {
    console.error(`Error retrieving region: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new region
exports.addRegion = [
  // Validation middleware
  ...regionValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { region_name, region_description, updated_by } = req.body;

    try {
      const newRegion = await Region.create({
        region_name,
        region_description,
        updated_by,
      });
      res.status(201).json({
        status: true,
        message: "Region created successfully",
        data: newRegion,
      });
    } catch (error) {
      console.error(`Error creating region: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a region
exports.updateRegion = [
  // Validation middleware
  ...regionValidationRules,
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
      const region = await Region.findByPk(id);
      if (!region) {
        return res.status(404).json({
          status: false,
          message: "Region not found",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedRegion = await region.update({
        region_name: req.body.region_name ?? region.region_name,
        region_description: req.body.region_description ?? region.region_description,
        updated_by: req.body.updated_by ?? region.updated_by,
      });

      res.status(200).json({
        status: true,
        message: "Region updated successfully",
        data: updatedRegion,
      });
    } catch (error) {
      console.error(`Error updating region: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete a region
exports.deleteRegion = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const region = await Region.findByPk(id);
    if (!region) {
      return res.status(404).json({
        status: false,
        message: "Region not found",
      });
    }

    await region.destroy();
    res.status(200).json({
      status: true,
      message: "Region deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting region: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
