const db = require("../models");
const Campus = db.campus;
const Course = db.course;
const { validationResult, check } = require("express-validator");

// Validation rules for Campus
const campusValidationRules = [
  check("campus_name").not().isEmpty().withMessage("Campus name is required"),
  check("location").not().isEmpty().withMessage("Location is required"),
  check("university_id").not().isEmpty().isInt().withMessage("University ID must be an integer"),
];

// Get all campuses with their courses
exports.getAllCampuses = async (req, res) => {
  try {
    const campuses = await Campus.findAll({
      include: [
        {
          model: db.university,
          attributes: ["university_name"],
        },
        {
          model: db.course,
          as: "courses",
          through: {
            attributes: ["course_fee", "course_link", "application_fee"],
          },
        },
      ],
    });

    const modifiedCampuses = campuses.map((campus) => {
      const courseNames = campus.courses.map((course) => course.course_name);

      return {
        ...campus.toJSON(),
        university: campus.university ? campus.university.university_name : null,
        courses: campus.courses.map((course) => ({
          ...course.toJSON(),
          course_id: course ? course.id : null,
          course_fee: course.campus_course ? course.campus_course.course_fee : null,
          application_fee: course.campus_course ? course.campus_course.application_fee : null,
          course_link: course.campus_course ? course.campus_course.course_link : null,
          campus_course: undefined,
        })),
        courseNames,
      };
    });

    res.status(200).json({ status: true, data: modifiedCampuses });
  } catch (error) {
    console.error(`Error retrieving campuses: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Get campus by ID with its courses
exports.getCampusById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const campus = await Campus.findByPk(id, {
      include: [
        {
          model: db.university,
          attributes: ["university_name"],
        },
        {
          model: db.course,
          as: "courses",
          through: {
            attributes: ["course_fee", "course_link", "application_fee"],
          },
        },
      ],
    });

    if (!campus) {
      return res.status(404).json({ status: false, message: "Campus not found" });
    }

    const modifiedCampus = {
      ...campus.toJSON(),
      university: campus.university ? campus.university.university_name : null,
      courses: campus.courses.map((course) => ({
        ...course.toJSON(),
        course_id: course ? course.id : null,
        course_fee: course.campus_course ? course.campus_course.course_fee : null,
        application_fee: course.campus_course ? course.campus_course.application_fee : null,
        course_link: course.campus_course ? course.campus_course.course_link : null,
        campus_course: undefined,
      })),
    };

    res.status(200).json({ status: true, data: modifiedCampus });
  } catch (error) {
    console.error(`Error retrieving campus: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};

// Add a new campus and associate courses
exports.addCampus = [
  // Validation middleware
  ...campusValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
    }

    const userId = req.userDecodeId;
    const { campus_name, location, university_id, courses } = req.body;

    try {
      // Create the new campus
      const newCampus = await Campus.create({
        campus_name,
        location,
        university_id,
        updated_by: userId,
      });

      // Associate courses with the newly created campus
      if (courses && Array.isArray(courses)) {
        const courseIds = courses.map((course) => course.course_id);

        // Check for duplicate courses in the campus
        const existingCourses = await newCampus.getCourses({ where: { id: courseIds } });

        if (existingCourses.length > 0) {
          const existingCourseIds = existingCourses.map((course) => course.id);
          const duplicateCourses = courses.filter((course) => existingCourseIds.includes(course.course_id));

          return res.status(400).json({
            status: false,
            message: "Duplicate courses detected",
            duplicates: duplicateCourses.map((course) => course.course_id),
          });
        }

        // If no duplicates, proceed to add courses
        for (const course of courses) {
          // Adding course to the junction table
          await newCampus.addCourse(course.course_id, {
            through: {
              course_fee: course.course_fee,
              application_fee: course.application_fee,
              course_link: course.course_link,
            },
          });
        }
      }

      res.status(201).json({ status: true, message: "Campus created successfully", data: newCampus });
    } catch (error) {
      console.error(`Error creating campus: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Update a campus and its associated courses
exports.updateCampus = [
  // Validation middleware
  ...campusValidationRules,
  async (req, res) => {
    const id = parseInt(req.params.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
    }

    const userId = req.userDecodeId;
    const { campus_name, location, university_id, courses } = req.body;

    try {
      // Find the campus
      const campus = await Campus.findByPk(id);
      if (!campus) {
        return res.status(404).json({ status: false, message: "Campus not found" });
      }

      // Update campus details
      const updatedCampus = await campus.update({
        campus_name: campus_name ?? campus.campus_name,
        location: location ?? campus.location,
        university_id: university_id ?? campus.university_id,
        updated_by: userId,
      });

      // Manage course associations with duplicate validation
      if (courses && Array.isArray(courses)) {
        await campus.setCourses([]);

        // Add or update course associations
        for (const course of courses) {
          await campus.addCourse(course.course_id, {
            through: {
              course_fee: course.course_fee,
              application_fee: course.application_fee,
              course_link: course.course_link,
            },
          });
        }
      }

      res.status(200).json({ status: true, message: "Campus updated successfully", data: updatedCampus });
    } catch (error) {
      console.error(`Error updating campus: ${error}`);
      res.status(500).json({ status: false, message: "Internal server error" });
    }
  },
];

// Delete a campus
exports.deleteCampus = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const campus = await Campus.findByPk(id);
    if (!campus) {
      return res.status(404).json({ status: false, message: "Campus not found" });
    }

    await campus.destroy();
    res.status(200).json({ status: true, message: "Campus deleted successfully" });
  } catch (error) {
    console.error(`Error deleting campus: ${error}`);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
