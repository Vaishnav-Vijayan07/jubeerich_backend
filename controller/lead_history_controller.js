const db = require("../models");

exports.getLeadHistory = async (req, res) => {
  try {
    const leadId = req.params.id;

    const lead = await db.userPrimaryInfo.findByPk(leadId); // Note: 'findbyPk' should be 'findByPk'
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found!",
      });
    }

    const leadHistory = await lead.getUserHistories({
      order: [["updated_on", "DESC"]], // Order the results by updated_on in descending order
      include: [
        {
          model: db.country, // Include the associated country model
          as: "country", // Alias used in the association
          attributes: ["country_name"], // Specify the country attributes you want to fetch
          requied : false, // Set to false to perform a LEFT JOIN
        },
      ],
    });

    // Send the response
    res.status(200).json({
      success: true,
      data: leadHistory,
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
