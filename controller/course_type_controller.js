const db = require("../models");
const CourseType = db.courseType;
const { validationResult, check } = require("express-validator");

// Validation rules for CourseType
const courseTypeValidationRules = [
  check("course_type_name").not().isEmpty().withMessage("Course type name is required"),
  check("course_type_description").optional().isString().withMessage("Course type description must be a string"),
  check("updated_by").optional().isInt().withMessage("Updated by must be an integer"),
];

// Get all course types
exports.getAllCourseTypes = async (req, res) => {
  try {
    const courseTypes = await CourseType.findAll();
    res.status(200).json({ status: true, data: courseTypes });
  } catch (error) {
    console.error(`Error retrieving course types: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
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
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Add a new course type
exports.addCourseType = [
  // Validation middleware
  ...courseTypeValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
    }

    const { course_type_name, course_type_description, updated_by } = req.body;

    try {
      const newCourseType = await CourseType.create({
        course_type_name,
        course_type_description,
        updated_by,
      });
      res.status(201).json({ status: true, message: "Course type created successfully", data: newCourseType });
    } catch (error) {
      console.error(`Error creating course type: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
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
      return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
    }

    try {
      const courseType = await CourseType.findByPk(id);
      if (!courseType) {
        return res.status(404).json({ status: false, message: "Course type not found" });
      }

      // Update only the fields that are provided in the request body
      const updatedCourseType = await courseType.update({
        course_type_name: req.body.course_type_name ?? courseType.course_type_name,
        course_type_description: req.body.course_type_description ?? courseType.course_type_description,
        updated_by: req.body.updated_by ?? courseType.updated_by,
      });

      res.status(200).json({ status: true, message: "Course type updated successfully", data: updatedCourseType });
    } catch (error) {
      console.error(`Error updating course type: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Delete a course type
exports.deleteCourseType = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const courseType = await CourseType.findByPk(id);
    if (!courseType) {
      return res.status(404).json({ status: false, message: "Course type not found" });
    }

    await courseType.destroy();
    res.status(200).json({ status: true, message: "Course type deleted successfully" });
  } catch (error) {
    console.error(`Error deleting course type: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
