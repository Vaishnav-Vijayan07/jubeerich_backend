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
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("marital")) {
      promises.push(
        db.maritalStatus.findAll({ attributes: ["id", "marital_status_name"] })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("countries")) {
      promises.push(db.country.findAll({ attributes: ["id", "country_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("leadTypes")) {
      promises.push(db.leadType.findAll({ attributes: ["id", "name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("sources")) {
      promises.push(
        db.leadSource.findAll({
          attributes: ["id", "source_name", "lead_type_id"],
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("channels")) {
      promises.push(
        db.leadChannel.findAll({
          attributes: ["id", "channel_name", "source_id"],
        })
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

    if (!types || requestedTypes.includes("officeType")) {
      promises.push(
        db.officeType.findAll({ attributes: ["id", "office_type_name"] })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("region")) {
      promises.push(db.region.findAll({ attributes: ["id", "region_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("status")) {
      promises.push(db.status.findAll({ attributes: ["id", "status_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("adminUsers")) {
      promises.push(db.adminUsers.findAll({ attributes: ["id", "name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("cres")) {
      promises.push(
        db.adminUsers.findAll({
          attributes: ["id", "name"],
          where: {
            role_id: process.env.CRE_ID,
          },
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("campuses")) {
      promises.push(db.campus.findAll({ attributes: ["id", "campus_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("franchise")) {
      promises.push(db.franchise.findAll({ attributes: ["id", "name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("branchCounsellors")) {
      promises.push(
        db.adminUsers.findAll({
          attributes: ["id", "name", "branch_id"],
          where: {
            role_id: process.env.BRANCH_COUNSELLOR_ID,
          },
        })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("access_powers")) {
      promises.push(
        db.accessPowers.findAll({ attributes: ["id", "power_name"] })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("branches")) {
      promises.push(db.branches.findAll({ attributes: ["id", "branch_name"] }));
    } else {
      promises.push(Promise.resolve(null));
    }

    if (!types || requestedTypes.includes("access_roles")) {
      promises.push(
        db.accessRoles.findAll({ attributes: ["id", "role_name"] })
      );
    } else {
      promises.push(Promise.resolve(null));
    }

    const [
      universityDetails,
      maritalStatusDetails,
      countryDetails,
      leadTypeDetails,
      sourceDetails,
      channelDetails,
      courseDetails,
      courseTypeDetails,
      streamDetails,
      officeTypeDetails,
      regionDetails,
      statusDetails,
      adminUserDetails,
      cresDetails,
      campusDetails,
      franchiseDetails,
      branchCounsellorsDetails,
      accessPowerDetails,
      branchDetails,
      accessRoleDetails,
    ] = await Promise.all(promises);

    const formatData = (data, name) => {
      return data
        ? data.map((item) => ({
            label: item[name],
            value: item.id,
            lead_type: item.lead_type_id,
            source_id: item.source_id,
            branch_id: item.branch_id,
          }))
        : [];
    };

    res.status(200).json({
      status: true,
      data: {
        universities: formatData(universityDetails, "university_name"),
        countries: formatData(countryDetails, "country_name"),
        leadTypes: formatData(leadTypeDetails, "name"),
        courses: formatData(courseDetails, "course_name"),
        courseTypes: formatData(courseTypeDetails, "type_name"),
        streams: formatData(streamDetails, "stream_name"),
        campuses: formatData(campusDetails, "campus_name"),
        sources: formatData(sourceDetails, "source_name"),
        channels: formatData(channelDetails, "channel_name"),
        officeTypes: formatData(officeTypeDetails, "office_type_name"),
        regions: formatData(regionDetails, "region_name"),
        statuses: formatData(statusDetails, "status_name"),
        adminUsers: formatData(adminUserDetails, "name"),
        cres: formatData(cresDetails, "name"),
        franchises: formatData(franchiseDetails, "name"),
        maritalStatus: formatData(maritalStatusDetails, "marital_status_name"),
        branchCounsellors: formatData(branchCounsellorsDetails, "name"),
        accessPowers: formatData(accessPowerDetails, "power_name"),
        branches: formatData(branchDetails, "branch_name"),
        accessRoles: formatData(accessRoleDetails, "role_name"),
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
