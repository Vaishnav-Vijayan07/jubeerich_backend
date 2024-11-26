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

exports.getCoursesWithDetails = async (req, res) => {
  const { campus_id } = req.params;

  try {
    // Fetch data directly from the join table (campus_course)
    const campusCourses = await db.campusCourse.findAll({
      where: campus_id ? { campus_id } : {},
      include: [
        {
          model: db.course, // Assuming the model is named 'course'
          as: "courses", // Use the correct alias for the course relation
          attributes: ["course_name"], // Fetch only the name field of the course
        },
      ],
    });

    const flattenedResponse = campusCourses.map((item) => ({
      id: item.id,
      course_fee: item.course_fee,
      application_fee: item.application_fee,
      course_link: item.course_link,
      campus_id: item.campus_id,
      course_id: item?.course_id,
      course_name: item.courses ? item.courses.course_name : null, // Extract course_name
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));
    res.status(200).json({
      status: true,
      message: "Courses retrieved successfully",
      data: flattenedResponse,
    });
  } catch (error) {
    console.error(`Error retrieving courses: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
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

exports.addCampus = [
  ...campusValidationRules, // Apply campus validation rules
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
    const { campus_name, location, university_id } = req.body;

    try {
      // Create the new campus
      const newCampus = await Campus.create({
        campus_name,
        location,
        university_id,
        updated_by: userId,
      });

      res.status(201).json({
        status: true,
        message: "Campus created successfully",
        data: newCampus,
      });
    } catch (error) {
      console.error(`Error creating campus: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

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

// Associate courses with an existing campus
// exports.configureCourses = async (req, res) => {
//   const { campus_id, course_id, course_fee, application_fee, course_link } = req.body;

//   // Validate required inputs
//   if (!campus_id || !course_id) {
//     return res.status(400).json({
//       status: false,
//       message: "Invalid input. Campus ID and Course ID are required.",
//     });
//   }

//   try {
//     // Check if the campus exists
//     const campus = await Campus.findByPk(campus_id);
//     if (!campus) {
//       return res.status(404).json({
//         status: false,
//         message: "Campus not found.",
//       });
//     }

//     // Check if the course is already associated with the campus
//     const existingCourses = await campus.getCourses({ where: { id: course_id } });
//     if (existingCourses.length > 0) {
//       return res.status(400).json({
//         status: false,
//         message: "Duplicate course detected. This course is already associated with the campus.",
//       });
//     }

//     // Associate the course with the campus
//     await campus.addCourse(course_id, {
//       through: {
//         course_fee: course_fee || null,
//         application_fee: application_fee || null,
//         course_link: course_link || null,
//       },
//     });

//     res.status(200).json({
//       status: true,
//       message: "Course associated successfully.",
//     });
//   } catch (error) {
//     console.error(`Error associating course: ${error}`);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error.",
//     });
//   }
// };

// exports.configureCourses = async (req, res) => {
//   const { campus_id, course_id, course_fee, application_fee, course_link } = req.body;

//   // Validate required inputs
//   if (!campus_id || !course_id) {
//     return res.status(400).json({
//       status: false,
//       message: "Invalid input. Campus ID and Course ID are required.",
//     });
//   }

//   try {
//     // Check if the campus and course exist
//     const campus = await Campus.findByPk(campus_id);
//     if (!campus) {
//       return res.status(404).json({
//         status: false,
//         message: "Campus not found.",
//       });
//     }

//     const course = await db.course.findByPk(course_id);
//     if (!course) {
//       return res.status(404).json({
//         status: false,
//         message: "Course not found.",
//       });
//     }

//     // Check if the association already exists
//     const campusCourse = await db.campusCourse.findOne({
//       where: { campus_id, course_id },
//     });

//     if (campusCourse) {
//       // Update the existing association
//       await campusCourse.update({
//         course_fee: course_fee || campusCourse.course_fee,
//         application_fee: application_fee || campusCourse.application_fee,
//         course_link: course_link || campusCourse.course_link,
//       });

//       return res.status(200).json({
//         status: true,
//         message: "Course association updated successfully.",
//         data: campusCourse,
//       });
//     } else {
//       // Insert a new association
//       const newCampusCourse = await db.campusCourse.create({
//         campus_id,
//         course_id,
//         course_fee: course_fee || null,
//         application_fee: application_fee || null,
//         course_link: course_link || null,
//       });

//       return res.status(201).json({
//         status: true,
//         message: "Course associated successfully.",
//         data: newCampusCourse,
//       });
//     }
//   } catch (error) {
//     console.error(`Error configuring course association: ${error}`);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error.",
//     });
//   }
// };

exports.configureCourses = async (req, res) => {
  const { campus_id, course_id, course_fee, application_fee, course_link, operation } = req.body;

  // Validate required inputs
  if (!campus_id || !course_id || !operation) {
    return res.status(400).json({
      status: false,
      message: "Invalid input. Campus ID, Course ID, and operation are required.",
    });
  }

  try {
    // Check if the campus and course exist
    const campus = await Campus.findByPk(campus_id);
    if (!campus) {
      return res.status(404).json({
        status: false,
        message: "Campus not found.",
      });
    }

    const course = await db.course.findByPk(course_id);
    if (!course) {
      return res.status(404).json({
        status: false,
        message: "Course not found.",
      });
    }

    // Check for existing association
    const campusCourse = await db.campusCourse.findOne({
      where: { campus_id, course_id },
    });

    if (operation === "add") {
      // Handle add operation
      if (campusCourse) {
        return res.status(400).json({
          status: false,
          message: "Course is already associated with the campus. Use the update operation to modify it.",
        });
      }

      // Create a new association
      const newCampusCourse = await db.campusCourse.create({
        campus_id,
        course_id,
        course_fee: course_fee || null,
        application_fee: application_fee || null,
        course_link: course_link || null,
      });

      return res.status(201).json({
        status: true,
        message: "Course associated successfully.",
        data: newCampusCourse,
      });
    } else if (operation === "update") {
      // Handle update operation
      if (!campusCourse) {
        return res.status(404).json({
          status: false,
          message: "No existing association found for the given campus and course. Use the add operation to create one.",
        });
      }

      // Check if the update would result in no changes
      const isUnchanged =
        (course_fee == null || course_fee === campusCourse.course_fee) &&
        (application_fee == null || application_fee === campusCourse.application_fee) &&
        (course_link == null || course_link === campusCourse.course_link);

      if (isUnchanged) {
        return res.status(400).json({
          status: false,
          message: "No changes detected. The course association already has the same data.",
        });
      }

      // Update the existing association
      await campusCourse.update({
        course_fee: course_fee || campusCourse.course_fee,
        application_fee: application_fee || campusCourse.application_fee,
        course_link: course_link || campusCourse.course_link,
      });

      return res.status(200).json({
        status: true,
        message: "Course association updated successfully.",
        data: campusCourse,
      });
    } else {
      // Invalid operation
      return res.status(400).json({
        status: false,
        message: "Invalid operation. Use 'add' or 'update'.",
      });
    }
  } catch (error) {
    console.error(`Error configuring course association: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};

exports.deleteCourseAssociation = async (req, res) => {
  const { campus_id, course_id } = req.body;

  // Validate required inputs
  if (!campus_id || !course_id) {
    return res.status(400).json({
      status: false,
      message: "Invalid input. Campus ID and Course ID are required.",
    });
  }

  try {
    // Find the existing association
    const campusCourse = await db.campusCourse.findOne({
      where: { campus_id, course_id },
    });

    if (!campusCourse) {
      return res.status(404).json({
        status: false,
        message: "Course association not found.",
      });
    }

    // Delete the association
    await campusCourse.destroy();

    res.status(200).json({
      status: true,
      message: "Course association deleted successfully.",
    });
  } catch (error) {
    console.error(`Error deleting course association: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};
