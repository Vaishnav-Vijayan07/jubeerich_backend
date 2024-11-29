const db = require("../models");
const stages = db.stages;

// Get all stages
exports.getAllStages = async (req, res) => {
  try {
    const allStages = await stages.findAll();
    res.status(200).json({ data: allStages });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stages", error });
  }
};

// Get a specific stage by ID
exports.getStageById = async (req, res) => {
  try {
    const stage = await stages.findByPk(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }

    res.status(200).json({ data: stage });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stage", error });
  }
};

// Add a new stage
exports.addStage = async (req, res) => {
  try {
    const { stage_name } = req.body; // Extract data from request body

    const newStage = await stages.create({ stage_name });
    res.status(201).json({ message: "Stage created successfully", data: newStage });
  } catch (error) {
    res.status(500).json({ message: "Error creating stage", error });
  }
};

// Update an existing stage
exports.updateStage = async (req, res) => {
  try {
    const { stage_name } = req.body;

    const stage = await stages.findByPk(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }

    const isUpdatedNeeded = stage.stage_name !== stage_name;

    // Update stage fields only if the stage name has changed
    if (isUpdatedNeeded) {
      await stage.update({ stage_name });
      res.status(200).json({ message: "Stage updated successfully", data: stage });
    } else {
      return res.status(400).json({ message: "No changes detected" });
    }
  } catch (error) {
    res.status(500).json({ message: "Error updating stage", error });
  }
};

// Delete a stage
exports.deleteStage = async (req, res) => {
  try {
    const stage = await stages.findByPk(req.params.id);

    if (!stage) {
      return res.status(404).json({ message: "Stage not found" });
    }

    await stage.destroy();
    res.status(200).json({ message: "Stage deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting stage", error });
  }
};
