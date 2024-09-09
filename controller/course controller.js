const db = require("../models");
const Course = db.course;
const { validationResult, check } = require("express-validator");

// Validation rules for Course
const courseValidationRules = [
  check("course_name").not().isEmpty().withMessage("Course name is required"),
  check("course_description")
    .optional()
    .isString()
    .withMessage("Course description must be a string"),
  check("course_type_id")
    .not()
    .isEmpty()
    .isInt()
    .withMessage("Course type ID must be an integer"),
  check("stream_id")
    .not()
    .isEmpty()
    .isInt()
    .withMessage("Stream ID must be an integer"),
  check("updated_by")
    .optional()
    .isInt()
    .withMessage("Updated by must be an integer"),
];

// Get all courses
exports.getAllCourses = async (req, res) => {
  try {
    const courses = await db.course.findAll({
      include: [
        {
          model: db.courseType,
          attributes: ["id", "type_name"],
        },
        {
          model: db.stream,
          attributes: ["id", "stream_name"],
        },
      ],
      attributes: ["id", "course_name", "course_description"],
    });

    res.status(200).json({ status: true, data: courses });
  } catch (error) {
    console.error(`Error retrieving courses: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const course = await Course.findByPk(id);
    if (!course) {
      return res
        .status(404)
        .json({ status: false, message: "Course not found" });
    }
    res.status(200).json({ status: true, data: course });
  } catch (error) {
    console.error(`Error retrieving course: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Add a new course
exports.addCourse = [
  // Validation middleware
  ...courseValidationRules,
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
      course_name,
      course_description,
      course_type_id,
      stream_id,
      updated_by,
    } = req.body;

    try {
      const newCourse = await Course.create({
        course_name,
        course_description,
        course_type_id,
        stream_id,
        updated_by,
      });
      res.status(201).json({
        status: true,
        message: "Course created successfully",
        data: newCourse,
      });
    } catch (error) {
      console.error(`Error creating course: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Update a course
exports.updateCourse = [
  // Validation middleware
  ...courseValidationRules,
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
      const course = await Course.findByPk(id);
      if (!course) {
        return res
          .status(404)
          .json({ status: false, message: "Course not found" });
      }

      console.log(req.body);

      // Update only the fields that are provided in the request body
      const updatedCourse = await course.update({
        course_name: req.body.course_name ?? course.course_name,
        course_description:
          req.body.course_description ?? course.course_description,
        course_type_id: req.body.course_type_id ?? course.course_type_id,
        stream_id: req.body.stream_id ?? course.stream_id,
        updated_by: req.body.updated_by ?? course.updated_by,
      });

      res.status(200).json({
        status: true,
        message: "Course updated successfully",
        data: updatedCourse,
      });
    } catch (error) {
      console.error(`Error updating course: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Delete a course
exports.deleteCourse = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const course = await Course.findByPk(id);
    if (!course) {
      return res
        .status(404)
        .json({ status: false, message: "Course not found" });
    }

    await course.destroy();
    res
      .status(200)
      .json({ status: true, message: "Course deleted successfully" });
  } catch (error) {
    console.error(`Error deleting course: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
