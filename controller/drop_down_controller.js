const db = require("../models");

const getDropdownData = async (req, res) => {
  try {
    const [
      universityDetails,
      countryDetails,
      courseDetails,
      courseTypeDetails,
      streamDetails,
      campusDetails,
    ] = await Promise.all([
      db.university.findAll({
        attributes: ["id", "university_name"],
      }),
      db.country.findAll({
        attributes: ["id", "country_name"],
      }),
      db.course.findAll({
        attributes: ["id", "course_name"],
      }),
      db.courseType.findAll({
        attributes: ["id", "type_name"],
      }),
      db.stream.findAll({
        attributes: ["id", "stream_name"],
      }),
      db.campus.findAll({
        attributes: ["id", "campus_name"],
      }),
    ]);

    // Mapping the data into { label: name, value: id } format
    const formatData = (data, name) => {
      return data.map((item) => ({
        label: item[name],
        value: item.id,
      }));
    };

    // Prepare the final response
    res.status(200).json({
      status: true,
      data: {
        universities: formatData(universityDetails, "university_name"),
        countries: formatData(countryDetails, "country_name"),
        courses: formatData(courseDetails, "course_name"),
        courseTypes: formatData(courseTypeDetails, "type_name"),
        streams: formatData(streamDetails, "stream_name"),
        campuses: formatData(campusDetails, "campus_name"),
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
