const db = require("../models");
const Country = db.country;
const { validationResult, check } = require("express-validator");

// Validation rules for Country
const countryValidationRules = [
  check("country_name").not().isEmpty().withMessage("Country name is required"),
];

// Get all countries
exports.getAllCountries = async (req, res) => {
  try {
    const countries = await Country.findAll();
    res.status(200).json({
      status: true,
      data: countries,
    });
  } catch (error) {
    console.error(`Error retrieving countries: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get country by ID
exports.getCountryById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const country = await Country.findByPk(id);
    if (!country) {
      return res.status(404).json({
        status: false,
        message: "Country not found",
      });
    }
    res.status(200).json({
      status: true,
      data: country,
    });
  } catch (error) {
    console.error(`Error retrieving country: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new country
exports.addCountry = [
  // Validation middleware
  ...countryValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { country_name, isd, country_code } = req.body;

    try {
      const newCountry = await Country.create({
        country_name,
        isd,
        country_code,
      });
      res.status(201).json({
        status: true,
        message: "Country created successfully",
        data: newCountry,
      });
    } catch (error) {
      console.error(`Error creating country: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Update a country
exports.updateCountry = [
  // Validation middleware
  ...countryValidationRules,
  async (req, res) => {
    const id = parseInt(req.params.id);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const country = await Country.findByPk(id);
      if (!country) {
        return res.status(404).json({
          status: false,
          message: "Country not found",
        });
      }

      // Prepare updated data
      const updatedData = {
        isd: req.body.isd ?? country.isd,
        country_code: req.body.country_code ?? country.country_code,
      };

      // Check if the country_name has changed and update the slug accordingly
      if (req.body.country_name && req.body.country_name !== country.country_name) {
        updatedData.country_name = req.body.country_name;
        updatedData.slug = await generateUniqueSlug(req.body.country_name);
      } else {
        updatedData.country_name = req.body.country_name ?? country.country_name;
      }

      // Update the country with the prepared data
      const updatedCountry = await country.update(updatedData);

      res.status(200).json({
        status: true,
        message: "Country updated successfully",
        data: updatedCountry,
      });
    } catch (error) {
      console.error(`Error updating country: ${error}`);
      res.status(500).json({
        status: false,
        message: "Internal server error",
      });
    }
  },
];

// Delete a country
exports.deleteCountry = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const country = await Country.findByPk(id);
    if (!country) {
      return res.status(404).json({
        status: false,
        message: "Country not found",
      });
    }


    await country.destroy();
    res.status(200).json({
      status: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting country: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
