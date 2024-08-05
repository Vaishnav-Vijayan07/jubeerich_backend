const db = require("../models");
const Branch = db.branches;
const { validationResult, check } = require("express-validator");

// Validation rules for Branch
const branchValidationRules = [
  check("branch_name").not().isEmpty().withMessage("Branch name is required"),
  check("email")
    .not()
    .isEmpty()
    .withMessage("Email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  check("phone").not().isEmpty().withMessage("Phone is required"),
  check("address").not().isEmpty().withMessage("Address is required"),
  check("city").not().isEmpty().withMessage("City is required"),
  check("state").not().isEmpty().withMessage("State is required"),
  check("country").not().isEmpty().withMessage("Country is required"),
  check("pincode").not().isEmpty().withMessage("Pincode is required"),
  check("contact_person_email")
    .not()
    .isEmpty()
    .withMessage("Contact person email is required")
    .isEmail()
    .withMessage("Invalid email format"),
  check("contact_person_name")
    .not()
    .isEmpty()
    .withMessage("Contact person name is required"),
  check("contact_person_mobile")
    .not()
    .isEmpty()
    .withMessage("Contact person mobile is required"),
  check("contact_person_designation")
    .not()
    .isEmpty()
    .withMessage("Contact person designation is required"),
  check("status")
    .not()
    .isEmpty()
    .withMessage("Status is required")
    .isBoolean()
    .withMessage("Status must be a boolean value"),
];

const checkRegionExists = async (region_id) => {
  if (region_id) {
    const region = await db.region.findByPk(region_id);
    if (!region) {
      return false;
    }
  }
  return true;
};

// Get all branches
exports.getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      include: [
        {
          model: db.officeType,
          as: "office_name",
          attributes: ["office_type_name"],
        },
        {
          model: db.region,
          as: "region_name",
          attributes: ["region_name"],
        },
      ],
    });

    const formattedResponse = branches.map((branch) => ({
      ...branch.toJSON(),
      office_name: branch.office_name?.office_type_name,
      region_name: branch.region_name?.region_name,
    }));

    res.status(200).json({
      status: true,
      data: formattedResponse,
    });
  } catch (error) {
    console.error(`Error retrieving branches: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get branch by ID
exports.getBranchById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        status: false,
        message: "Branch not found",
      });
    }
    res.status(200).json({
      status: true,
      data: branch,
    });
  } catch (error) {
    console.error(`Error retrieving branch: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new branch
exports.addBranch = [
  // Validation middleware
  ...branchValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const {
      branch_name,
      email,
      phone,
      address,
      city,
      state,
      country,
      pincode,
      contact_person_email,
      contact_person_name,
      contact_person_mobile,
      contact_person_designation,
      website,
      social_media,
      account_mail,
      support_mail,
      office_type,
      region_id,
      updated_by,
      status,
    } = req.body;

    try {
      if (!(await checkRegionExists(region_id))) {
        return res.status(400).json({
          status: false,
          message: "Invalid region_id",
        });
      }
      const newBranch = await Branch.create({
        branch_name,
        email,
        phone,
        address,
        city,
        state,
        country,
        pincode,
        contact_person_email,
        contact_person_name,
        contact_person_mobile,
        contact_person_designation,
        website,
        social_media,
        account_mail,
        support_mail,
        office_type,
        region_id,
        updated_by,
        status,
      });
      res.status(201).json({
        status: true,
        message: "Branch created successfully",
        data: newBranch,
      });
    } catch (error) {
      console.error(`Error creating branch: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a branch
exports.updateBranch = [
  // Validation middleware
  ...branchValidationRules,
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
      if (!(await checkRegionExists(req.body.region_id))) {
        return res.status(400).json({
          status: false,
          message: "Invalid region_id",
        });
      }
      const branch = await Branch.findByPk(id);
      if (!branch) {
        return res.status(404).json({
          status: false,
          message: "Branch not found",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedBranch = await branch.update(req.body);

      res.status(200).json({
        status: true,
        message: "Branch updated successfully",
        data: updatedBranch,
      });
    } catch (error) {
      console.error(`Error updating branch: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete a branch
exports.deleteBranch = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const branch = await Branch.findByPk(id);
    if (!branch) {
      return res.status(404).json({
        status: false,
        message: "Branch not found",
      });
    }

    await branch.destroy();
    res.status(200).json({
      status: true,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting branch: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
