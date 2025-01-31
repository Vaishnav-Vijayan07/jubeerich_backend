const db = require("../models");

exports.getTableHistoryByTableName = async (req, res) => {
  try {
    const { tableName } = req.query;

    // Validate table name
    if (!tableName) {
      return res.status(400).json({ status: false, message: "Table name is required" });
    }

    // Fetch all changes for the 'country' table
    const tableChanges = await db.tableHistory.findAll({
      where: { table_name: tableName },
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
      return res.status(200).json({ message: "No changes found for the country table", data: [] });
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
