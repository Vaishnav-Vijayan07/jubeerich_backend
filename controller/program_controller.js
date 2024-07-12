const db = require("../models");
const Program = db.programs;
const University = db.university; // Assuming you have a university model defined
const { validationResult, check } = require("express-validator");

// Validation rules for Program
const programValidationRules = [
  check("program_name").not().isEmpty().withMessage("Program name is required"),
  check("university_id").optional().isInt().withMessage("University ID must be an integer"),
  check("degree_level").not().isEmpty().withMessage("Degree level is required"),
  check("duration").isInt({ min: 1 }).withMessage("Duration must be a positive integer"),
  check("tuition_fees").isDecimal({ decimal_digits: '0,2' }).withMessage("Tuition fees must be a decimal with up to two decimal places"),
  check("currency").not().isEmpty().withMessage("Currency is required"),
];

// Helper function to check if university exists
const checkUniversityExists = async (university_id) => {
  if (university_id) {
    const university = await University.findByPk(university_id);
    if (!university) {
      return false;
    }
  }
  return true;
};

// Get all programs
exports.getAllPrograms = async (req, res) => {
  try {
    const programs = await Program.findAll({
      include: {
        model: University,
        as: 'university_name',
        attributes: ['university_name'], // Include only the name attribute
      },
    });
    const formattedResponse = programs.map((program) => ({
      ...program.toJSON(),
      university_name: program.university_name.university_name
    }));
    res.status(200).json({
      status: true,
      data: formattedResponse,
    });
  } catch (error) {
    console.error(`Error retrieving programs: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get program by ID
exports.getProgramById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({
        status: false,
        message: "Program not found",
      });
    }
    res.status(200).json({
      status: true,
      data: program,
    });
  } catch (error) {
    console.error(`Error retrieving program: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new program
exports.addProgram = [
  // Validation middleware
  ...programValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { program_name, university_id, degree_level, duration, tuition_fees, currency } = req.body;

    try {
      if (!(await checkUniversityExists(university_id))) {
        return res.status(400).json({
          status: false,
          message: "Invalid university_id",
        });
      }

      const newProgram = await Program.create({
        program_name,
        university_id,
        degree_level,
        duration,
        tuition_fees,
        currency,
      });
      res.status(201).json({
        status: true,
        message: "Program created successfully",
        data: newProgram,
      });
    } catch (error) {
      console.error(`Error creating program: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a program
exports.updateProgram = [
  // Validation middleware
  ...programValidationRules,
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
      const program = await Program.findByPk(id);
      if (!program) {
        return res.status(404).json({
          status: false,
          message: "Program not found",
        });
      }

      if (!(await checkUniversityExists(req.body.university_id))) {
        return res.status(400).json({
          status: false,
          message: "Invalid university_id",
        });
      }

      // Update only the fields that are provided in the request body
      const updatedProgram = await program.update({
        program_name: req.body.program_name ?? program.program_name,
        university_id: req.body.university_id ?? program.university_id,
        degree_level: req.body.degree_level ?? program.degree_level,
        duration: req.body.duration ?? program.duration,
        tuition_fees: req.body.tuition_fees ?? program.tuition_fees,
        currency: req.body.currency ?? program.currency,
      });

      res.status(200).json({
        status: true,
        message: "Program updated successfully",
        data: updatedProgram,
      });
    } catch (error) {
      console.error(`Error updating program: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete a program
exports.deleteProgram = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const program = await Program.findByPk(id);
    if (!program) {
      return res.status(404).json({
        status: false,
        message: "Program not found",
      });
    }

    await program.destroy();
    res.status(200).json({
      status: true,
      message: "Program deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting program: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
