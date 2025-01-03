const db = require("../models");

const getAvailabilityData = async (application_id) => {
  const existApplication = await db.application.findByPk(application_id);

  if (!existApplication) {
    throw new Error("Application not found");
  }

  try {
    const [studyPreferDetails, eligibilityChecks] = await Promise.all([
      existApplication.getStudyPreferenceDetails({
        attributes: ["id", "intakeYear", "intakeMonth", "streamId"],
        include: [
          {
            model: db.course,
            as: "preferred_courses",
            attributes: ["id", "course_name"],
            include: [
              {
                model: db.campus,
                through: "campus_course",
                as: "campuses",
                attributes: ["id", "campus_name"],
                through: {
                  attributes: ["course_link", "course_fee", "application_fee"],
                },
              },
            ],
          },
          {
            model: db.stream,
            as: "preferred_stream",
            attributes: ["id", "stream_name"],
          },
          {
            model: db.university,
            as: "preferred_university",
            attributes: ["id", "university_name"],
          },
          {
            model: db.studyPreference,
            as: "studyPreference",
            include: [
              {
                model: db.country,
                as: "country",
                attributes: ["id", "country_name"],
              },
            ],
          },
        ],
      }),
      existApplication.getEligibilityChecks({
        include: [
          {
            model: db.eligibilityRemarks,
            as: "eligibility_remarks",
            attributes: ["id", "availability_check"],
          },
        ],
      }),
    ]);

    const checks = {
      id: existApplication?.id,
      country_name: studyPreferDetails?.studyPreference?.country?.country_name || "N/A",
      university_name: studyPreferDetails?.preferred_university?.university_name || "N/A",
      stream_name: studyPreferDetails?.preferred_stream?.stream_name || "N/A",
      program_name: studyPreferDetails?.preferred_courses?.course_name || "N/A",
      intake_applying_for: `${studyPreferDetails?.intakeMonth || "N/A"} / ${studyPreferDetails?.intakeYear || "N/A"}`,
      course_link: studyPreferDetails?.preferred_courses?.campuses?.[0]?.course_link || "N/A",
    };

    const remarks = {
      id: eligibilityChecks?.eligibility_remarks?.id,
      application_id,
      remarks: eligibilityChecks?.eligibility_remarks?.availability_check,
    };

    return {
      checks,
      remarks,
    };
  } catch (error) {
    console.error("Error while fetching availability data", error);
    throw new Error("Error while fetching availability data");
  }
};

const getCampusData = async (application_id) => {
  const existApplication = await db.application.findByPk(application_id);

  if (!existApplication) {
    throw new Error("Application not found");
  }

  try {
    const [studyPreferDetails, eligibilityChecks] = await Promise.all([
      existApplication.getStudyPreferenceDetails({
        attributes: ["id"],
        include: [
          {
            model: db.campus,
            as: "preferred_campus",
            attributes: ["id", "campus_name"],
          },
        ],
      }),
      existApplication.getEligibilityChecks({
        include: [
          {
            attributes: ["id", "campus_check"],
            model: db.eligibilityRemarks,
            as: "eligibility_remarks",
          },
        ],
      }),
    ]);

    const checks = {
      id: existApplication?.id,
      campus_name: studyPreferDetails?.preferred_campus?.campus_name || "N/A",
    };

    const remarks = {
      id: eligibilityChecks?.eligibility_remarks?.id,
      application_id,
      remarks: eligibilityChecks?.eligibility_remarks?.campus_check,
    };

    return {
      checks,
      remarks,
    };
  } catch (error) {
    console.error("Error while fetching availability data", error);
    throw new Error("Error while fetching availability data");
  }
};
const getApplicationData = async (application_id) => {
  const existApplication = await db.application.findByPk(application_id);

  if (!existApplication) {
    throw new Error("Application not found");
  }

  try {
    const [studyPreferDetails, eligibilityChecks] = await Promise.all([
      existApplication.getStudyPreferenceDetails({
        attributes: ["id"],
        include: [
          {
            model: db.course,
            as: "preferred_courses",
            attributes: ["id", "course_name"],
            include: [
              {
                model: db.campus,
                through: "campus_course",
                as: "campuses",
                attributes: ["id", "campus_name"],
                through: {
                  attributes: ["course_link", "course_fee", "application_fee"],
                },
              },
            ],
          },
        ],
      }),
      existApplication.getEligibilityChecks({
        include: [
          {
            attributes: ["id", "application_fee_check"],
            model: db.eligibilityRemarks,
            as: "eligibility_remarks",
          },
        ],
      }),
    ]);


    const checks = {
      id: existApplication?.id,
      fee: studyPreferDetails?.preferred_courses?.campuses?.[0]?.campus_course?.application_fee || 0,
    };

    const remarks = {
      id: eligibilityChecks?.eligibility_remarks?.id,
      application_id,
      remarks: eligibilityChecks?.eligibility_remarks?.application_fee_check,
    };

    return {
      checks,
      remarks,
    };
  } catch (error) {
    console.error("Error while fetching availability data", error);
    throw new Error("Error while fetching availability data");
  }
};

const getCheckDataTypeWise = async (application_id, type) => {
  const existApplication = await db.application.findByPk(application_id);

  if (!existApplication) {
    throw new Error("Application not found");
  }

  const attributes = ["id", type];

  try {
    const [eligibilityChecks] = await Promise.all([
      existApplication.getEligibilityChecks({
        include: [
          {
            attributes: attributes,
            model: db.eligibilityRemarks,
            as: "eligibility_remarks",
          },
        ],
      }),
    ]);

    const remarks = {
      id: eligibilityChecks?.eligibility_remarks?.id,
      application_id,
      remarks: eligibilityChecks?.eligibility_remarks?.[type],
    };

    return {
      remarks,
    };
  } catch (error) {
    console.error("Error while fetching availability data", error);
    throw new Error("Error while fetching availability data");
  }
};

const updateEligibiltyRemark = async (application_id, eligibility_id, remarks, type) => {
  const existApplication = await db.application.findByPk(application_id);

  if (!existApplication) {
    throw new Error("Application not found");
  }

  try {
    const eligibility_remark = await db.eligibilityRemarks.findByPk(eligibility_id);

    if (!eligibility_remark) {
      throw new Error("Eligibility remark not found");
    }

    switch (type) {
      case "availability":
        eligibility_remark.availability_check = remarks;
        break;
      case "campus":
        eligibility_remark.campus_check = remarks;
        break;
      case "entry_requirement":
        eligibility_remark.entry_requirement_check = remarks;
        break;
      case "quantity":
        eligibility_remark.quantity_check = remarks;
        break;
      case "quality":
        eligibility_remark.quality_check = remarks;
        break;
      case "immigration":
        eligibility_remark.immigration_check = remarks;
        break;
      case "application_fee":
        eligibility_remark.application_fee_check = remarks;
        break;
    }

    await eligibility_remark.save();

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error while updating availability remark", error);
    throw new Error("Error while updating availability remark");
  }
};

module.exports = {
  getAvailabilityData,
  getCampusData,
  getCheckDataTypeWise,
  getApplicationData,
  updateEligibiltyRemark,
};
