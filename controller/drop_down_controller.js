const db = require("../models");

const getDropdownData = async (req, res) => {
  try {
    const { types } = req.query; // e.g., types=universities,countries,courses
    const requestedTypes = types ? types.split(",") : []; // convert to array

    console.log(requestedTypes);

    const promises = [];

    if (!types || requestedTypes.includes("universities")) {
      promises.push(
        db.university.findAll({ attributes: ["id", "university_name"] })
      );
    } else {
      promises.push(Promise.resolve(null)); // add null if not requested
    }

    if (!types || requestedTypes.includes("countries")) {
      promises.push(db.country.findAll({ attributes: ["id", "country_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("sources")) {
      promises.push(
        db.leadSource.findAll({ attributes: ["id", "source_name"] })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("courses")) {
      promises.push(db.course.findAll({ attributes: ["id", "course_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("courseTypes")) {
      promises.push(db.courseType.findAll({ attributes: ["id", "type_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("streams")) {
      promises.push(db.stream.findAll({ attributes: ["id", "stream_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("campuses")) {
      promises.push(db.campus.findAll({ attributes: ["id", "campus_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    console.log(promises);

    const [
      universityDetails,
      countryDetails,
      sourceDetails,
      courseDetails,
      courseTypeDetails,
      streamDetails,
      campusDetails,
    ] = await Promise.all(promises);

    const formatData = (data, name) => {
      return data
        ? data.map((item) => ({ label: item[name], value: item.id }))
        : [];
    };

    res.status(200).json({
      status: true,
      data: {
        universities: formatData(universityDetails, "university_name"),
        countries: formatData(countryDetails, "country_name"),
        courses: formatData(courseDetails, "course_name"),
        courseTypes: formatData(courseTypeDetails, "type_name"),
        streams: formatData(streamDetails, "stream_name"),
        campuses: formatData(campusDetails, "campus_name"),
        sources: formatData(sourceDetails, "source_name"),
      },
    });
  } catch (error) {
    console.error(`Error retrieving dropdown data: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

module.exports = getDropdownData;
