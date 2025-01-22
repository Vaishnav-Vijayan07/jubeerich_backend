const { validationResult } = require("express-validator");
const db = require("../models");
const FamilyInformation = db.familyInformation; // Adjust the import path as necessary

// Add or Update Family Information
exports.addOrUpdateFamilyInformation = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      status: false,
      message: "Validation failed",
      errors: errors.array(),
    });
  }

  const {
    user_id,
    father,
    mother,
    number_of_siblings,
    siblings_info,
    children_info,
    spouse,
    accompanying_spouse,
    number_of_children,
    accompanying_child,
    relatives_info,
    paternal_grand_mother_info,
    paternal_grand_father_info,
    maternal_grand_mother_info,
    maternal_grand_father_info,
    paternal_grand_mother_info_spouse,
    paternal_grand_father_info_spouse,
    maternal_grand_mother_info_spouse,
    maternal_grand_father_info_spouse,
    father_in_law_info,
    mother_in_law_info
  } = req.body;

  try {
    // Check if family information already exists for the user
    let familyInfo = await FamilyInformation.findOne({ where: { user_id } });

    if (familyInfo) {
      // If it exists, update the existing record
      familyInfo = await familyInfo.update({
        father,
        mother,
        number_of_siblings,
        siblings_info,
        children_info,
        spouse,
        accompanying_spouse,
        relatives_info,
        number_of_children,
        accompanying_child,
        paternal_grand_mother_info,
        paternal_grand_father_info,
        maternal_grand_mother_info,
        maternal_grand_father_info,
        paternal_grand_mother_info_spouse,
        paternal_grand_father_info_spouse,
        maternal_grand_mother_info_spouse,
        maternal_grand_father_info_spouse,
        father_in_law_info,
        mother_in_law_info
      });
      return res.status(200).json({
        status: true,
        message: "Family information updated successfully",
        data: familyInfo,
      });
    } else {
      // If it doesn't exist, create a new record
      const newFamilyInfo = await FamilyInformation.create({
        user_id,
        father,
        mother,
        number_of_siblings,
        siblings_info,
        children_info,
        spouse,
        accompanying_spouse,
        relatives_info,
        number_of_children,
        accompanying_child,
        paternal_grand_mother_info,
        paternal_grand_father_info,
        maternal_grand_mother_info,
        maternal_grand_father_info,
        paternal_grand_mother_info_spouse,
        paternal_grand_father_info_spouse,
        maternal_grand_mother_info_spouse,
        maternal_grand_father_info_spouse,
        father_in_law_info,
        mother_in_law_info
      });

      return res.status(201).json({
        status: true,
        message: "Family information created successfully",
        data: newFamilyInfo,
      });
    }
  } catch (error) {
    console.error(`Error adding or updating family information: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Get Family Information by User ID
exports.getFamilyInformationByUserId = async (req, res) => {
  const userId = parseInt(req.params.userId, 10);

  try {
    const familyInfo = await FamilyInformation.findOne({
      where: { user_id: userId },
    });

    res.status(200).json({
      status: true,
      data: familyInfo,
    });
  } catch (error) {
    console.error(`Error fetching family information: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Delete Family Information
exports.deleteFamilyInformation = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const familyInfo = await FamilyInformation.findByPk(id);
    if (!familyInfo) {
      return res
        .status(404)
        .json({ status: false, message: "Family information not found" });
    }

    await familyInfo.destroy();
    res.status(200).json({
      status: true,
      message: "Family information deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting family information: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};
