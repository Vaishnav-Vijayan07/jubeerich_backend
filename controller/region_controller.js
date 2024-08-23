const db = require("../models");
const Region = db.region;
const { validationResult, check } = require("express-validator");

// Validation rules for Region
const regionValidationRules = [
  check("region_name").not().isEmpty().withMessage("Region name is required"),
  check("region_description").optional().isString().withMessage("Region description must be a string"),
  check("regional_manager_id").optional().isInt().withMessage("Regional manager id must be an integer"),
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

// Get all regions
exports.getAllRegions = async (req, res) => {
  try {
    const regions = await Region.findAll({
      include: [
        {
          model: db.adminUsers,
          as: "regional_manager",
          attributes: ["name"],
        },
      ]
    });

    // Map through the regions to format the response properly
    const modifiedResponse = regions.map(region => {
      const regionData = region.toJSON();
      return {
        ...regionData,
        regional_manager: regionData.regional_manager ? regionData.regional_manager.name : null
      };
    });

    res.status(200).json({
      status: true,
      data: modifiedResponse,
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

    const { region_name, region_description, updated_by, regional_manager_id } = req.body;

    try {
      const slug = await generateUniqueSlug(region_name, Region);
      const newRegion = await Region.create({
        region_name,
        region_description,
        regional_manager_id,
        updated_by,
        slug, // Add the slug here
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

      const updatedData = {
        region_name: req.body.region_name ?? region.region_name,
        region_description: req.body.region_description ?? region.region_description,
        updated_by: req.body.updated_by ?? region.updated_by,
        regional_manager_id: req.body.regional_manager_id ?? region.regional_manager_id,
      };

      // Update slug if region_name is changed
      if (req.body.region_name && req.body.region_name !== region.region_name) {
        updatedData.slug = await generateUniqueSlug(req.body.region_name, Region);
      }

      const updatedRegion = await region.update(updatedData);

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

// Get all regional managers
exports.getAllRegionalManagers = async (req, res) => {
  try {
    const regionalManagerId = parseInt(process.env.REGIONAL_MANAGER_ID, 10);

    if (isNaN(regionalManagerId)) {
      return res.status(400).json({
        status: false,
        message: "Invalid regional manager ID in environment variables",
      });
    }

    const regionalManagers = await db.adminUsers.findAll({
      where: {
        role_id: regionalManagerId,
      },
    });

    res.status(200).json({
      status: true,
      data: regionalManagers,
    });
  } catch (err) {
    console.error(`Error retrieving regional managers: ${err.message}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
