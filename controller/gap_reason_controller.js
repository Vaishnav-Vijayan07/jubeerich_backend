const db = require("../models");
const { addOrUpdateGapReasonData } = require("../utils/academic_query_helper");

exports.getAllGapReasons = async (req, res) => {
  try {
    const { id, type } = req.params;
    const student = await db.userPrimaryInfo.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const gapReasons = await student.getGapReasons({
      where: {
        type,
      },
    });
    if (!gapReasons) {
      return res.status(404).json({ error: "Gap reasons not found" });
    }
    const modifiedData = gapReasons.map((gapReason) => {
      return {
        id: gapReason.id,
        reason: gapReason.reason,
        start_date: gapReason.start_date,
        type: gapReason.type,
        end_date: gapReason.end_date,
        supporting_document: gapReason.supporting_document
          ? gapReason.supporting_document
          : null,
      };
    });

    return res.status(200).json({
      status: true,
      data: modifiedData,
    });
  } catch (error) {
    console.error(`Error retrieving gap reasons: ${error}`);
    res.status(500).json({ error: "An error occurred while processing your request. Please try again later." });
  }
};

exports.saveGapReason = async (req, res) => {
  const { gap, student_id, type, has_gap } = req.body;
  const files = req.files;
  console.log('Entered');
  

  console.log('has_gap', has_gap);
  console.log('type', type);
  
  const transaction = await db.sequelize.transaction();

  const student = await db.userPrimaryInfo.findByPk(student_id, {
    transaction,
  });
  if (!student) {
    await transaction.rollback();
    return res.status(404).json({ error: "Student not found" });
  }

  if(type == "work"){
    student.has_work_gap = has_gap;
    await student.save();
  } else {
    student.has_education_gap = has_gap;
    await student.save();
  }

  const modifiedData = [];

  // Iterate over graduation details
  gap.forEach((item, index) => {
    const field = "supporting_document";
    const isUpdate = item?.id !== "0";
    const itemData = {
      id: item.id,
      reason: item.reason,
      start_date: item.start_date,
      end_date: item.end_date,
      student_id: Number(student_id),
    };
    if (!isUpdate) {
      itemData["type"] = item.type;
    }
    const fieldName = `gap[${index}][${field}]`;
    const file = files.find((file) => file.fieldname === fieldName);
    if (!isUpdate || (isUpdate && file)) {
      itemData[field] = file ? file.filename : null;
    }

    modifiedData.push(itemData);
  });

  try {
    const gapReasonResult = await addOrUpdateGapReasonData(
      modifiedData,
      transaction
    );

    if (gapReasonResult.success) {
      await transaction.commit();
      return res.status(201).json({
        status: true,
        data: gapReasonResult,
      });
    } else {
      throw new Error("Failed to update gap reasons records");
    }
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error(`Error updating gap reasons: ${error}`);
    res.status(500).json({ error: "An error occurred while processing your request. Please try again later." });
  }
};
