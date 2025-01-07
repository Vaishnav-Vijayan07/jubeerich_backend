const CheckTypes = require("../constants/checkTypes");
const {
  getAvailabilityData,
  updateEligibiltyRemark,
  getCampusData,
  getRequirementData,
  getQuantityData,
  getQualityData,
  getCheckDataTypeWise,
  getApplicationData,
} = require("../utils/check_helpers");

const types = {
  education: "education",
  visa: "visa",
};

exports.getChecksById = async (req, res, next) => {
  try {
    const { application_id, type } = req.params;

    let response;

    switch (type) {
      case CheckTypes.availability: {
        const { checks: availability_check, remarks: availability_remarks } = await getAvailabilityData(application_id);
        response = {
          checks: availability_check,
          remarks: availability_remarks,
        };
        break;
      }
      case CheckTypes.campus: {
        const { checks: campus_check, remarks: campus_remarks } = await getCampusData(application_id);
        response = {
          checks: campus_check,
          remarks: campus_remarks,
        };
        break;
      }
      case CheckTypes.entry_requirement: {
        const { remarks: requirement_remarks } = await getCheckDataTypeWise(application_id, "entry_requirement_check");
        response = {
          remarks: requirement_remarks,
        };
        break;
      }
      case CheckTypes.quantity: {
        const { remarks: quantity_remarks } = await getCheckDataTypeWise(application_id, "quantity_check");
        response = {
          remarks: quantity_remarks,
        };
        break;
      }
      case CheckTypes.quality: {
        const { remarks: quality_remarks } = await getCheckDataTypeWise(application_id, "quality_check");
        response = {
          remarks: quality_remarks,
        };
        break;
      }
      case CheckTypes.immigration: {
        const { remarks: immigration_remarks } = await getCheckDataTypeWise(application_id, "immigration_check");
        response = {
          remarks: immigration_remarks,
        };
        break;
      }
      case CheckTypes.application_fee: {
        const { checks: application_check, remarks: application_remarks } = await getApplicationData(application_id);
        response = {
          checks: application_check,
          remarks: application_remarks,
        };
        break;
      }
      default:
        return res.status(400).json({
          status: false,
          message: "Invalid check type.",
        });
    }

    console.log(response);

    return res.status(200).json({
      status: true,
      data: response,
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};

exports.updateCheckRemarks = async (req, res, next) => {
  try {
    const { application_id, type } = req.params;
    const { remarks, eligibility_id } = req.body;

    const { success } = await updateEligibiltyRemark(application_id, eligibility_id, remarks, type);

    return res.status(200).json({
      status: success,
      message: "Remarks updated successfully",
    });
  } catch (error) {
    console.error(`Error: ${error.message}`);
    return res.status(500).json({
      status: false,
      message: error.message || "Internal server error",
    });
  }
};
