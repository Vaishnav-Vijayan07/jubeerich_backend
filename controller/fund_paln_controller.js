const db = require("../models");
const { addOrUpdateFundData } = require("../utils/academic_query_helper");

exports.getStudentFundPlanDetails = async (req, res) => {
  try {
    const { id } = req.params;
    console.log("Fetching info for studentId:", id);
    const student = await db.userPrimaryInfo.findByPk(id);

    if (!student) {
      return res.status(404).json({ error: "Student not found" });
    }

    const plans = await student.getFundPlan();
    if (!plans) {
      return res.status(404).json({ error: "Plan not found" });
    }

    const modifiedData = plans.map((plan) => {
      return {
        id: plan.id,
        type: plan.type,
        fund_origin: plan.fund_origin,
        sponsor_name: plan.sponsor_name,
        approx_annual_income: plan.approx_annual_income,
        itr_status: plan.itr_status ? "yes" : "no",
        relation_with_sponsor: plan.relation_with_sponsor,
        sponsorship_amount: plan.sponsorship_amount,
        name_of_bank: plan.name_of_bank,
        supporting_document: plan.supporting_document
          ? plan.supporting_document
          : null,
        has_min_6_months_backup: plan.has_min_6_months_backup ? "yes" : "no",
        source_of_funds: plan.source_of_funds,
      };
    });

    return res.status(200).json({
      status: true,
      data: modifiedData,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

exports.saveStudentPlanDetails = async (req, res) => {
  const { fund_details, student_id } = req.body;
  const files = req.files;
  const transaction = await db.sequelize.transaction();

  const student = await db.userPrimaryInfo.findByPk(student_id);

  if (!student) {
    return res.status(404).json({ error: "Student not found" });
  }

  const modifiedData = [];

  // Iterate over graduation details
  fund_details.forEach((item, index) => {
    const field = "supporting_document";

    const isUpdate = item?.id !== "0";

    const itemData = {
      id: item.id,
      type: item.type,
      fund_origin: item.fund_origin,
      sponsor_name: item.sponsor_name,
      approx_annual_income: Number(item.approx_annual_income),
      itr_status: item.itr_status == "yes" ? true : false,
      sponsorship_amount: Number(item.sponsorship_amount),
      relation_with_sponsor: item.relation_with_sponsor,
      name_of_bank: item.name_of_bank,
      student_id: Number(student_id),
      has_min_6_months_backup:
        item.has_min_6_months_backup == "yes" ? true : false,
      source_of_funds: item.source_of_funds,
    };

    const fieldName = `fund_details[${index}][${field}]`;
    const file = files.find((file) => file.fieldname === fieldName);

    if (!isUpdate || (isUpdate && file)) {
      itemData[field] = file ? file.filename : null;
    }
    modifiedData.push(itemData);
  });

  try {
    const fundPlanResult = await addOrUpdateFundData(modifiedData, transaction);
    if (fundPlanResult.success) {
      await transaction.commit();
      return res.status(201).json({
        status: true,
        message: "Fund plan updated successfully",
      });
    } else {
      throw new Error("Failed to update fund records");
    }
  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
