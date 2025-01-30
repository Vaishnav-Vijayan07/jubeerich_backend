const db = require("../models");
const CourseType = db.courseType;
const { validationResult, check } = require("express-validator");

// Validation rules for CourseType
const courseTypeValidationRules = [
  check("type_name").not().isEmpty().withMessage("Course type name is required"),
  check("description").optional().isString().withMessage("Course type description must be a string"),
];

// Get all course types
exports.getAllCourseTypes = async (req, res) => {
  try {
    const courseTypes = await CourseType.findAll({
      order: [["created_at", "DESC"]],
    });
    const formattedCourseTypes = courseTypes.map((courseType) => ({
      label: courseType.type_name,
      value: courseType.id,
    }));
    res.status(200).json({ status: true, data: courseTypes, formattedCourseTypes });
  } catch (error) {
    console.error(`Error retrieving course types: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Get course type by ID
exports.getCourseTypeById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const courseType = await CourseType.findByPk(id);
    if (!courseType) {
      return res.status(404).json({ status: false, message: "Course type not found" });
    }
    res.status(200).json({ status: true, data: courseType });
  } catch (error) {
    console.error(`Error retrieving course type: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Add a new course type
exports.addCourseType = [
  // Validation middleware
  ...courseTypeValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const userId = req.userDecodeId;
    const { type_name, description } = req.body;

    try {
      const newCourseType = await CourseType.create(
        {
          type_name,
          description,
          updated_by: userId,
        },
        { userId }
      );
      res.status(201).json({
        status: true,
        message: "Course type created successfully",
        data: newCourseType,
      });
    } catch (error) {
      console.error(`Error creating course type: ${error}`);
      res
        .status(500)
        .json({ status: false, message: "An error occurred while processing your request. Please try again later." });
    }
  },
];

// Update a course type
exports.updateCourseType = [
  // Validation middleware
  ...courseTypeValidationRules,
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

    try {
      const userId = req.userDecodeId;
      const courseType = await CourseType.findByPk(id);
      if (!courseType) {
        return res.status(404).json({ status: false, message: "Course type not found" });
      }

      // Update only the fields that are provided in the request body
      const updatedCourseType = await courseType.update(
        {
          type_name: req.body.type_name ?? courseType.type_name,
          description: req.body.description ?? courseType.description,
          updated_by: userId,
        },
        { userId }
      );

      res.status(200).json({
        status: true,
        message: "Course type updated successfully",
        data: updatedCourseType,
      });
    } catch (error) {
      console.error(`Error updating course type: ${error}`);
      res
        .status(500)
        .json({ status: false, message: "An error occurred while processing your request. Please try again later." });
    }
  },
];

// Delete a course type
exports.deleteCourseType = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  const userId = req.userDecodeId;

  try {
    const courseType = await CourseType.findByPk(id);
    if (!courseType) {
      return res.status(404).json({ status: false, message: "Course type not found" });
    }

    await courseType.destroy({ userId });
    res.status(200).json({ status: true, message: "Course type deleted successfully" });
  } catch (error) {
    console.error(`Error deleting course type: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};
