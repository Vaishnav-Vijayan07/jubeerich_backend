const db = require("../models");
const Country = db.country;
const { validationResult, check } = require("express-validator");
const { getCountriesByType } = require("../raw/queries");
const { getCountryData } = require("../utils/dashboard_controller_helpers");
const { where, fn, col } = require("sequelize");

// Validation rules for Country
const countryValidationRules = [check("country_name").not().isEmpty().withMessage("Country name is required")];

// Get all countries
exports.getAllCountries = async (req, res) => {
  try {
    const countries = await Country.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.status(200).json({
      status: true,
      data: countries,
    });
  } catch (error) {
    console.error(`Error retrieving countries: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getAllCountriesByAdmin = async (req, res) => {
  const { role_id, userDecodeId } = req;

  try {
    const countryData = getCountriesByType(userDecodeId, role_id);
    const countries = await getCountryData(countryData);

    res.status(200).json({
      status: true,
      data: countries,
    });
  } catch (error) {
    console.error(`Error retrieving countries: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
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
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.addCountry = [
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
    const userId = req.userDecodeId;

    try {
      // Check for existing country name
      const existingCountryName = await Country.findOne({
        where: where(fn("LOWER", col("country_name")), country_name.trim().toLowerCase()),
      });

      if (existingCountryName) {
        return res.status(409).json({
          status: false,
          message: "A country with this name already exists",
        });
      }

      // Check for existing country code
      if (country_code) {
        const existingCountryCode = await Country.findOne({
          where: where(fn("LOWER", col("country_code")), country_code.trim().toLowerCase()),
        });

        if (existingCountryCode) {
          return res.status(409).json({
            status: false,
            message: "A country with this country code already exists",
          });
        }
      }

      // Check for existing ISD
      if (isd) {
        const existingISD = await Country.findOne({
          where: { isd: isd.trim() },
        });

        if (existingISD) {
          return res.status(409).json({
            status: false,
            message: "A country with this ISD already exists",
          });
        }
      }

      const newCountry = await Country.create(
        {
          country_name: country_name.trim(),
          isd: isd ? isd.trim() : null,
          country_code: country_code ? country_code.trim() : null,
        },
        { userId }
      );

      res.status(201).json({
        status: true,
        message: "Country created successfully",
        data: newCountry,
      });
    } catch (error) {
      console.error(`Error creating country: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

exports.updateCountry = [
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

    const userId = req.userDecodeId;

    try {
      const country = await Country.findByPk(id);
      if (!country) {
        return res.status(404).json({
          status: false,
          message: "Country not found",
        });
      }

      // Check for existing country name, excluding current record
      if (req.body.country_name && req.body.country_name.trim() !== country.country_name) {
        const existingCountryName = await Country.findOne({
          where: where(fn("LOWER", col("country_name")), req.body.country_name.trim().toLowerCase()),
        });

        if (existingCountryName) {
          return res.status(409).json({
            status: false,
            message: "A country with this name already exists",
          });
        }
      }

      // Check for existing country code, excluding current record
      if (req.body.country_code && req.body.country_code.trim() !== country.country_code) {
        const existingCountryCode = await Country.findOne({
          where: where(fn("LOWER", col("country_code")), req.body.country_code.trim().toLowerCase()),
        });

        if (existingCountryCode) {
          return res.status(409).json({
            status: false,
            message: "A country with this country code already exists",
          });
        }
      }

      // Check for existing ISD, excluding current record
      if (req.body.isd && req.body.isd.trim() !== country.isd) {
        const existingISD = await Country.findOne({
          where: { isd: req.body.isd.trim() },
        });

        if (existingISD) {
          return res.status(409).json({
            status: false,
            message: "A country with this ISD already exists",
          });
        }
      }

      // Prepare updated data
      const updatedData = {
        isd: req.body.isd ? req.body.isd.trim() : country.isd,
        country_code: req.body.country_code ? req.body.country_code.trim() : country.country_code,
        country_name: req.body.country_name ? req.body.country_name.trim() : country.country_name,
      };

      // Update the country
      const updatedCountry = await country.update(updatedData, { userId });

      res.status(200).json({
        status: true,
        message: "Country updated successfully",
        data: updatedCountry,
      });
    } catch (error) {
      console.error(`Error updating country: ${error}`);
      res.status(500).json({
        status: false,
        message: "An error occurred while processing your request. Please try again later.",
      });
    }
  },
];

// Delete a country
exports.deleteCountry = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;

  try {
    const country = await Country.findByPk(id);
    if (!country) {
      return res.status(404).json({
        status: false,
        message: "Country not found",
      });
    }

    await country.destroy({ userId });
    res.status(200).json({
      status: true,
      message: "Country deleted successfully",
    });
  } catch (error) {
    console.error(`Error deleting country: ${error}`);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

// Controller to get all country changes from the history table
exports.getCountryHistory = async (req, res) => {
  try {
    const { tableName } = req.query;

    // Validate table name
    if (!tableName) {
      return res.status(400).json({ status: false, message: "Table name is required" });
    }

    // Fetch all changes for the 'country' table
    const tableChanges = await db.tableHistory.findAll({
      where: { table_name: "country" },
      attributes: [
        "id",
        "record_id",
        "changed_by",
        "change_type",
        "changed_at",
        "old_values",
        "new_values",
        // "createdAt",
        // "updatedAt",
      ],
      order: [["changed_at", "DESC"]], // Sort by change date in descending order
      include: [
        {
          model: db.adminUsers, // Assuming there's a 'User' model for the 'changed_by' field
          as: "changedBy", // Alias for the association
          attributes: ["id", "name", "email"], // Specify which fields to include from the 'User' model
        },
      ],
    });

    // If no history is found, return a 404 error
    if (!tableChanges || tableChanges.length === 0) {
      return res.status(404).json({ message: "No changes found for the country table" });
    }

    const formattedHistory = tableChanges.map((history) => {
      const historyJson = history.toJSON();

      const { createdAt, updatedAt, id, ...filteredOldValues } = historyJson.old_values || {};
      const { createdAt: newCreatedAt, id: newId, updatedAt: newUpdatedAt, ...filteredNewValues } = historyJson.new_values || {};

      return {
        ...historyJson,
        old_values: filteredOldValues,
        new_values: filteredNewValues,
        changedBy: history.changedBy.name || null,
      };
    });

    // Return the history of the country table
    return res.status(200).json({
      status: true,
      data: formattedHistory,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error fetching country history", error: error.message });
  }
};
