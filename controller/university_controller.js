const db = require("../models");
const University = db.university;
const { validationResult, check } = require("express-validator");

// Validation rules for University
const universityValidationRules = [
  check("university_name").not().isEmpty().withMessage("University name is required"),
  check("location").not().isEmpty().withMessage("Location is required"),
  check("country_id").optional().isInt().withMessage("Choose a country"),
];

// Helper function to check if country exists
const checkCountryExists = async (country_id) => {
  if (country_id) {
    const country = await db.country.findByPk(country_id);
    if (!country) {
      return false;
    }
  }
  return true;
};

// Get all universities
exports.getAllUniversities = async (req, res) => {
  try {
    const universities = await University.findAll({
      include: [
        {
          model: db.country,
          as: "country_name",
          attributes: ["country_name"],
        },
      ],
    });

    const formattedResponse = universities.map((university) => ({
      ...university.toJSON(),
      country_name: university.country_name.country_name
    }));
    res.status(200).json({
      status: true,
      data: formattedResponse,
    });
  } catch (error) {
    console.error(`Error retrieving universities: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get university by ID
exports.getUniversityById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const university = await University.findByPk(id);
    if (!university) {
      return res.status(404).json({
        status: false,
        message: "University not found",
      });
    }
    res.status(200).json({
      status: true,
      data: university,
    });
  } catch (error) {
    console.error(`Error retrieving university: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new university
exports.addUniversity = [
  // Validation middleware
  ...universityValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { university_name, location, country_id, website_url, image_url, updated_by } = req.body;

    try {
      if (!(await checkCountryExists(country_id))) {
        return res.status(400).json({
          status: false,
          message: "Invalid country_id",
        });
      }

      const newUniversity = await University.create({
        university_name,
        location,
        country_id,
        website_url,
        image_url,
        updated_by,
      });
      res.status(201).json({
        status: true,
        message: "University created successfully",
        data: newUniversity,
      });
    } catch (error) {
      console.error(`Error creating university: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a university
exports.updateUniversity = [
  // Validation middleware
  ...universityValidationRules,
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
      const university = await University.findByPk(id);
      if (!university) {
        return res.status(404).json({
          status: false,
          message: "University not found",
        });
      }

      if (!(await checkCountryExists(req.body.country_id))) {
        return res.status(400).json({
          status: false,
          message: "Invalid country_id",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedUniversity = await university.update({
        university_name: req.body.university_name ?? university.university_name,
        location: req.body.location ?? university.location,
        country_id: req.body.country_id ?? university.country_id,
        website_url: req.body.website_url ?? university.website_url,
        image_url: req.body.image_url ?? university.image_url,
        updated_by: req.body.updated_by ?? university.updated_by,
      });

      res.status(200).json({
        status: true,
        message: "University updated successfully",
        data: updatedUniversity,
      });
    } catch (error) {
      console.error(`Error updating university: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete a university
exports.deleteUniversity = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const university = await University.findByPk(id);
    if (!university) {
      return res.status(404).json({
        status: false,
        message: "University not found",
      });
    }

    await university.destroy();
    res.status(200).json({
      status: true,
      message: "University deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting university: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
