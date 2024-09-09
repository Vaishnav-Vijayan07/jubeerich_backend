const { Op } = require("sequelize");
const db = require("../models");
const Franchise = db.franchise;
const { validationResult, check } = require("express-validator");

// Validation rules for Franchise
const franchiseValidationRules = [
  check("name").not().isEmpty().withMessage("Name is required"),
  check("email").isEmail().withMessage("Valid email is required"),
  check("address").not().isEmpty().withMessage("Address is required"),
  check("phone").isNumeric().withMessage("Phone number must be numeric"),
  // check("pocName")
  //   .not()
  //   .isEmpty()
  //   .withMessage("Point of contact name is required"),
];

// Utility function to generate a unique slug
async function generateUniqueSlug(name, model) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "")
    .toUpperCase();
  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await model.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}_${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// Get all franchises
exports.getAllFranchises = async (req, res) => {
  try {
    const franchises = await Franchise.findAll({
      where: { isDeleted: false },
      include: [
        {
          model: db.adminUsers,
          as: "adminUsers", // Alias for the join, can be any name
        //   required: true, // This will perform a right join
        },
      ],
    });

    res.status(200).json({
      status: true,
      data: franchises,
    });
  } catch (error) {
    console.error(`Error retrieving franchises: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get franchise by ID
exports.getFranchiseById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const franchise = await Franchise.findByPk(id);
    if (!franchise) {
      return res.status(404).json({
        status: false,
        message: "Franchise not found",
      });
    }
    res.status(200).json({
      status: true,
      data: franchise,
    });
  } catch (error) {
    console.error(`Error retrieving franchise: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new franchise
exports.addFranchise = [
  // Validation middleware
  franchiseValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { name, email, address, phone, pocName } = req.body;

    try {
      const slug = await generateUniqueSlug(name, Franchise);
      const newFranchise = await Franchise.create({
        name,
        email,
        address,
        phone,
        pocName,
        slug, // Add the slug here
      });
      res.status(201).json({
        status: true,
        message: "Franchise created successfully",
        data: newFranchise,
      });
    } catch (error) {
      console.error(`Error creating franchise: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a franchise
exports.updateFranchise = [
  // Validation middleware
  franchiseValidationRules,
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
      const emailExist = await Franchise.findAll({
        where: {
          email: req.body.email,
          id: { [Op.ne]: id }, // Ensures that it doesn't match the current record's id
        },
      });

      if (emailExist.length > 0) {
        return res.status(400).json({
          status: false,
          status_code: 400,
          message: "Email already exists for another franchise",
          data: null,
        });
      }

      const franchise = await Franchise.findByPk(id);
      if (!franchise) {
        return res.status(404).json({
          status: false,
          message: "Franchise not found",
        });
      }

      const updatedData = {
        name: req.body.name !== undefined ? req.body.name : franchise.name,
        email: req.body.email !== undefined ? req.body.email : franchise.email,
        address:
          req.body.address !== undefined ? req.body.address : franchise.address,
        phone: req.body.phone !== undefined ? req.body.phone : franchise.phone,
        pocName:
          req.body.pocName !== undefined ? req.body.pocName : franchise.pocName,
      };

      // Update slug if name is changed
      if (req.body.name && req.body.name !== franchise.name) {
        updatedData.slug = await generateUniqueSlug(req.body.name, Franchise);
      }

      const updatedFranchise = await franchise.update(updatedData);

      res.status(200).json({
        status: true,
        message: "Franchise updated successfully",
        data: updatedFranchise,
      });
    } catch (error) {
      console.error(`Error updating franchise: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Soft delete a franchise
exports.deleteFranchise = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const franchise = await Franchise.findByPk(id);
    if (!franchise) {
      return res.status(404).json({
        status: false,
        message: "Franchise not found",
      });
    }

    // Set the isDeleted flag to true
    await franchise.update({ isDeleted: true });

    res.status(200).json({
      status: true,
      message: "Franchise deleted successfully",
    });
  } catch (error) {
    console.error(`Error soft deleting franchise: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
