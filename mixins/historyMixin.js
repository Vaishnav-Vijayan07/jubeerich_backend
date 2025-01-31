const addHistoryTracking = (model, tableName) => {
  model.addHook("afterCreate", async (record, options) => {
    const TableHistory = record.sequelize.models.table_history;
    await TableHistory.create({
      table_name: tableName,
      record_id: record.id,
      changed_by: options.userId || null, // Extract userId from options
      change_type: "CREATE",
      new_values: record.toJSON(),
    });
  });

  model.addHook("beforeUpdate", async (record, options) => {
    const originalRecord = await model.findByPk(record.id);
    options.oldValues = originalRecord ? originalRecord.toJSON() : null;
  });

  model.addHook("afterUpdate", async (record, options) => {
    const TableHistory = record.sequelize.models.table_history;
    await TableHistory.create({
      table_name: tableName,
      record_id: record.id,
      changed_by: options.userId || null, // Extract userId from options
      change_type: "UPDATE",
      old_values: options.oldValues,
      new_values: record.toJSON(),
    });
  });

  model.addHook("afterDestroy", async (record, options) => {
    const TableHistory = record.sequelize.models.table_history;
    await TableHistory.create({
      table_name: tableName,
      record_id: record.id,
      changed_by: options.userId || null, // Extract userId from options
      change_type: "DELETE",
      old_values: record.toJSON(),
    });
  });

  // Add method to get history for any record
  model.prototype.getHistory = async function () {
    const TableHistory = this.sequelize.models.table_history;
    return await TableHistory.findAll({
      where: {
        table_name: tableName,
        record_id: this.id,
      },
      order: [["changed_at", "DESC"]],
    });
  };
};

module.exports = addHistoryTracking;
