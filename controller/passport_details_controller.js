const db = require("../models");
const PassportDetails = db.passportDetails;
const { validationResult, check } = require("express-validator");

// Get all passport details
exports.getPassportDetailsByUserId = async (req, res) => {
  const userId = parseInt(req.params.user_id, 10);

  try {
    const passportDetails = await PassportDetails.findOne({
      where: { user_id: userId },
    });

    res.status(200).json({
      status: true,
      data: passportDetails,
    });
  } catch (error) {
    console.error(`Error retrieving passport details: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Add new passport details
exports.addPassportDetails = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const { user_id, original_passports_in_hand, missing_passport_reason, visa_immigration_history, name_change, number_of_passports, passports } =
    req.body;

  try {
    // Check if passport details already exist for the given user_id
    const existingPassportDetails = await PassportDetails.findOne({
      where: { user_id },
    });

    if (existingPassportDetails) {
      return res.status(409).json({
        status: false,
        message: "Passport details already exist for this user.",
      });
    }

    const passportsModified = passports.map((passport, index) => {
      const { errors, ...rest } = passport; // Destructure to exclude `errors`
      return {
        ...rest,
        passport_id: index + 1, // Add passport_id
      };
    });

    const newPassportDetails = await PassportDetails.create({
      user_id,
      original_passports_in_hand,
      missing_passport_reason,
      visa_immigration_history,
      name_change,
      number_of_passports,
      passports : passportsModified,
    });

    res.status(201).json({
      status: true,
      message: "Passport details created successfully",
      data: newPassportDetails,
    });
  } catch (error) {
    console.error(`Error creating passport details: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Update passport details
exports.updatePassportDetails = async (req, res) => {
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
    const passportDetails = await PassportDetails.findOne({
      where: { user_id: id },
    });
    if (!passportDetails) {
      return res.status(404).json({ status: false, message: "Passport details not found" });
    }

    // Update only the fields that are provided in the request body
    const updatedPassportDetails = await passportDetails.update({
      user_id: req.body.user_id ?? passportDetails.user_id,
      original_passports_in_hand: req.body.original_passports_in_hand ?? passportDetails.original_passports_in_hand,
      missing_passport_reason: req.body.missing_passport_reason ?? passportDetails.missing_passport_reason,
      visa_immigration_history: req.body.visa_immigration_history ?? passportDetails.visa_immigration_history,
      name_change: req.body.name_change ?? passportDetails.name_change,
      passports: req.body.passports ?? passportDetails.passports,
      number_of_passports: req.body.number_of_passports ?? passportDetails.number_of_passports,
    });

    res.status(200).json({
      status: true,
      message: "Passport details updated successfully",
      data: updatedPassportDetails,
    });
  } catch (error) {
    console.error(`Error updating passport details: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Delete passport details
exports.deletePassportDetails = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const passportDetails = await PassportDetails.findByPk(id);
    if (!passportDetails) {
      return res.status(404).json({ status: false, message: "Passport details not found" });
    }

    await passportDetails.destroy();
    res.status(200).json({ status: true, message: "Passport details deleted successfully" });
  } catch (error) {
    console.error(`Error deleting passport details: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};
