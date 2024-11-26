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

// exports.getCoursesWithDetails = async (req, res) => {
//   const { campus_id } = req.query;

//   try {
//     // Fetch courses associated with the campus, if `campus_id` is provided
//     const courses = await Course.findAll({
//       include: [
//         {
//           model: Campus,
//           as: "campuses",
//           attributes: ["id", "campus_name"],
//           through: {
//             attributes: ["id", "course_fee", "course_link", "application_fee"], // Include details from the junction table
//           },
//           where: campus_id ? { id: campus_id } : undefined, // Filter by campus_id if provided
//         },
//       ],
//     });

//     // Transform the courses for a cleaner response structure
//     const modifiedCourses = courses.map((course) => ({
//       id: course.id,
//       course_name: course.course_name,
//       description: course.description,
//       duration: course.duration,
//       course_fee: course.campuses[0]?.campus_course?.course_fee || null,
//       application_fee: course.campuses[0]?.campus_course?.application_fee || null,
//       course_link: course.campuses[0]?.campus_course?.course_link || null,
//     }));

//     res.status(200).json({
//       status: true,
//       message: "Courses retrieved successfully",
//       data: courses,
//     });
//   } catch (error) {
//     console.error(`Error retrieving courses: ${error}`);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

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

// // Add a new campus and associate courses
// exports.addCampus = [
//   // Validation middleware
//   ...campusValidationRules,
//   async (req, res) => {
//     const errors = validationResult(req);
//     if (!errors.isEmpty()) {
//       return res.status(400).json({ status: false, message: "Validation failed", errors: errors.array() });
//     }

//     const userId = req.userDecodeId;
//     const { campus_name, location, university_id, courses } = req.body;

//     try {
//       // Create the new campus
//       const newCampus = await Campus.create({
//         campus_name,
//         location,
//         university_id,
//         updated_by: userId,
//       });

//       // Associate courses with the newly created campus
//       if (courses && Array.isArray(courses)) {
//         const courseIds = courses.map((course) => course.course_id);

//         // Check for duplicate courses in the campus
//         const existingCourses = await newCampus.getCourses({ where: { id: courseIds } });

//         if (existingCourses.length > 0) {
//           const existingCourseIds = existingCourses.map((course) => course.id);
//           const duplicateCourses = courses.filter((course) => existingCourseIds.includes(course.course_id));

//           return res.status(400).json({
//             status: false,
//             message: "Duplicate courses detected",
//             duplicates: duplicateCourses.map((course) => course.course_id),
//           });
//         }

//         // If no duplicates, proceed to add courses
//         for (const course of courses) {
//           // Adding course to the junction table
//           await newCampus.addCourse(course.course_id, {
//             through: {
//               course_fee: course.course_fee,
//               application_fee: course.application_fee,
//               course_link: course.course_link,
//             },
//           });
//         }
//       }

//       res.status(201).json({ status: true, message: "Campus created successfully", data: newCampus });
//     } catch (error) {
//       console.error(`Error creating campus: ${error}`);
//       res.status(500).json({ status: false, message: "Internal server error" });
//     }
//   },
// ];

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

// Associate courses with an existing campus
exports.configureCourses = async (req, res) => {
  const { campus_id, course_id, course_fee, application_fee, course_link } = req.body;

  // Validate required inputs
  if (!campus_id || !course_id) {
    return res.status(400).json({
      status: false,
      message: "Invalid input. Campus ID and Course ID are required.",
    });
  }

  try {
    // Check if the campus exists
    const campus = await Campus.findByPk(campus_id);
    if (!campus) {
      return res.status(404).json({
        status: false,
        message: "Campus not found.",
      });
    }

    // Check if the course is already associated with the campus
    const existingCourses = await campus.getCourses({ where: { id: course_id } });
    if (existingCourses.length > 0) {
      return res.status(400).json({
        status: false,
        message: "Duplicate course detected. This course is already associated with the campus.",
      });
    }

    // Associate the course with the campus
    await campus.addCourse(course_id, {
      through: {
        course_fee: course_fee || null,
        application_fee: application_fee || null,
        course_link: course_link || null,
      },
    });

    res.status(200).json({
      status: true,
      message: "Course associated successfully.",
    });
  } catch (error) {
    console.error(`Error associating course: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error.",
    });
  }
};

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
