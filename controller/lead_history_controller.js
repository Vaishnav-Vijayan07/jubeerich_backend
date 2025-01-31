const db = require("../models");
const { getUniqueCountryData, getUserDataWithCountry } = require("../utils/academic_query_helper");

exports.getLeadHistory = async (req, res) => {
  try {
    const { id: leadId, country: countryId } = req.params;

    let isfilterAvailable = countryId !== "all";

    let where = {};
    if (isfilterAvailable) {
      // Check if country is not "all"
      where = { id: Number(countryId) }; // Set where condition for country ID
    }

    const lead = await db.userPrimaryInfo.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found!",
      });
    }

    const countriesInHistory = await getUserDataWithCountry(leadId, db.userHistory, "history");

    const leadHistory = await lead.getUserHistories({
      order: [["updated_on", "DESC"]],
      include: [
        {
          model: db.country, // Include the associated country model
          as: "country", // Alias for the association
          attributes: ["country_name", "id"],
          where,
          required: false,
        },
      ],
    });

    const uniqueCountryData = getUniqueCountryData(countriesInHistory);

    let finalisedHistory = [];

    if (isfilterAvailable) {
      finalisedHistory = leadHistory
        .filter((history) => history.country?.id === Number(countryId) || (!history.country_id && !history.country))
        .sort((a, b) => new Date(b.updated_on) - new Date(a.updated_on));
    }

    // Send the response
    res.status(200).json({
      success: true,
      data: {
        leadHistory: isfilterAvailable ? finalisedHistory : leadHistory,
        countries: uniqueCountryData,
        finalisedHistory,
      },
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

exports.addLeadHistory = async (req, res) => {
  try {
    const { histories, leadId } = req.body;
    // Check if the lead exists
    const lead = await db.userPrimaryInfo.findByPk(leadId);

    // If the lead does not exist, return a 404 error
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found!",
      });
    }

    const updated_by = req.userDecodeId;

    const historyPromises = histories.map((history) => {
      // Each history should have the action and updated_by defined
      return lead.createUserHistory({
        action: history.action,
        updated_by, // You can adjust this as per your logic
      });
    });

    // Execute all promises
    const newHistories = await Promise.all(historyPromises);

    // Send the response with the newly created history records
    res.status(201).json({
      success: true,
      data: newHistories,
    });

    // here i need to perform some complex tasks
    // For example, you can do something like this:
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};

exports.testData = async (req, res) => {
  try {
    const { page = 1, limit = 20, office = 0, country = 0, keyword, source = 0, sort_level = "DESC", sort_by = "id" } = req.query;

    console.log(req.query);

    let officeWhere = {};
    let countryWhere = {};
    let sourceWhere = {};

    if (office !== 0) {
      officeWhere = {
        id: office,
      };
    }

    if (country !== 0) {
      countryWhere = {
        id: country,
      };
    }

    if (source !== 0) {
      sourceWhere = {
        id: source,
      };
    }

    const dynamicIlike = keyword ? `%${keyword}%` : `%%`;
    const offset = (page - 1) * limit;
    const parsedLimit = parseInt(limit, 10);
    const sortOrder = [[sort_by, sort_level.toUpperCase()]];

    const queryOptions = {
      attributes: ["id", "full_name"],
      include: [
        {
          model: db.officeType,
          as: "office_type_name",
          attributes: ["office_type_name"],
          where: officeWhere,
          required: true,
        },
        {
          model: db.leadSource,
          as: "source_name",
          attributes: ["source_name"],
          where: sourceWhere,
          required: true,
        },
        {
          model: db.country,
          as: "preferredCountries",
          attributes: [["id", "country_id"], "country_name"],
          where: countryWhere,
          through: {
            model: db.userContries,
            attributes: [],
          },
          required: true,
        },
      ],
      order: sortOrder,
      offset,
      limit: parsedLimit,
      order: sortOrder,
    };

    // Add search conditions only if keyword exists
    if (keyword) {
      queryOptions.where = {
        [db.Op.or]: [{ full_name: { [db.Op.iLike]: dynamicIlike } }],
      };
    }

    const leads = await db.userPrimaryInfo.findAndCountAll(queryOptions);

    console.log(leads.rows.length);

    res.status(200).json({
      success: true,
      data: "Success",
      leads: leads.rows,
      total: leads.count,
      page,
      limit: parsedLimit,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: "Something went wrong!",
    });
  }
};
