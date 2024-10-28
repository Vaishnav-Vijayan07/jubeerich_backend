const { where } = require("sequelize");
const db = require("../models");
const { getUniqueCountryData, getUserDataWithCountry } = require("../utils/academic_query_helper");
const Comments = db.comments;

// Get all comments
exports.getAllComments = async (req, res) => {
  try {
    const comments = await Comments.findAll();
    res.json({
      status: true,
      data: comments,
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getCommentsByLeadId = async (req, res) => {
  try {
    const { leadId, countryFilter } = req.params;

    const lead = await db.userPrimaryInfo.findByPk(leadId);
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: "Lead not found!",
      });
    }

    const countriesInComments = await getUserDataWithCountry(leadId, db.comments, "comments");

    console.log(JSON.stringify(countriesInComments, null, 2));
    

    const uniqueCountryData = getUniqueCountryData(countriesInComments);

    let isfilterAvailable = countryFilter !== "all";

    let where = {};
    if (isfilterAvailable) {
      // Check if country is not "all"
      where = { id: Number(countryFilter) }; // Set where condition for country ID
    }

    const comments = await Comments.findAll({
      order: [["createdAt", "DESC"]],
      where: { lead_id: leadId },
      include: [
        {
          model: db.adminUsers,
          as: "user",
          attributes: ["name"],
        },
        {
          model: db.country,
          as: "country",
          attributes: ["country_name","id"],
          where,
          required: false,
        },
      ],
    });

    let finalisedHistory = [];

    if (isfilterAvailable) {
      finalisedHistory = [
        ...comments.filter((history) => history.country?.id === Number(countryFilter)),
        ...comments.filter((history) => !history.country_id && !history.country),
      ];
    }

    console.log(`Finalised history length for lead ${leadId} and country ${countryFilter}:`, finalisedHistory.length);
    console.log(`Total comments length for lead ${leadId}:`, comments.length);
    
    

    res.json({
      status: true,
      data: {
        countries: uniqueCountryData,
        formattedComments: isfilterAvailable ? finalisedHistory : comments,
      },
    });
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Create a new comment
exports.createComment = async (req, res) => {
  const { lead_id, user_id, comment } = req.body;
  const { role_id } = req;

  const [lead, adminUser] = await Promise.all([db.userPrimaryInfo.findByPk(lead_id), db.adminUsers.findByPk(user_id)]);

  // Handle not found cases
  if (!lead) {
    return res.status(404).json({
      status: false,
      message: "Lead not found",
    });
  }

  if (!adminUser) {
    return res.status(404).json({
      status: false,
      message: "Admin user not found",
    });
  }

  const { country_id } = adminUser;

  try {
    let newComment;
    if (role_id == process.env.COUNSELLOR_ROLE_ID) {
      newComment = await Comments.create({
        lead_id,
        user_id,
        comment,
        country_id,
      });
    } else {
      newComment = await Comments.create({
        lead_id,
        user_id,
        comment,
      });
    }

    res.json({
      status: true,
      data: newComment,
      message: "Comment added successfully",
    });
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Update a comment
exports.updateComment = async (req, res) => {
  const id = parseInt(req.params.id);
  const { comment } = req.body;

  try {
    const existingComment = await Comments.findByPk(id);

    if (!existingComment) {
      return res.status(404).json({
        status: false,
        message: "Comment not found",
      });
    }

    const updatedComment = await existingComment.update({
      comment,
      updated_at: new Date(),
    });

    res.json({
      status: true,
      message: "Comment updated successfully",
      data: updatedComment,
    });
  } catch (error) {
    console.error("Error updating comment:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const comment = await Comments.findByPk(id);

    if (!comment) {
      return res.status(404).json({
        status: false,
        message: "Comment not found",
      });
    }

    await comment.destroy();

    res.json({
      status: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
