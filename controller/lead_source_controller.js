const db = require("../models");
const Source = db.leadSource;

// Get all sources
exports.getAllSources = (req, res) => {
  Source.findAll()
    .then((sources) => {
      res.status(200).json(sources);
    })
    .catch((error) => {
      console.error(`Error retrieving sources: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Get source by ID
exports.getSourceById = (req, res) => {
  const id = parseInt(req.params.id);
  Source.findByPk(id)
    .then((source) => {
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }
      res.status(200).json(source);
    })
    .catch((error) => {
      console.error(`Error retrieving source: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Add a new source
exports.addSource = (req, res) => {
  const { source_name, source_description, updated_by } = req.body;

  Source.create({
    source_name,
    source_description,
    updated_by,
  })
    .then((newSource) => {
      res.status(201).json({
        status: true,
        message: "Source created successfully",
        data: newSource,
      });
    })
    .catch((error) => {
      console.error(`Error creating source: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Update a source
exports.updateSource = (req, res) => {
  const id = parseInt(req.params.id);
  const { source_name, source_description, updated_by } = req.body;

  Source.findByPk(id)
    .then((source) => {
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }

      source.update({
        source_name,
        source_description,
        updated_by,
      })
        .then((updatedSource) => {
          res.status(200).json({
            message: "Source updated successfully",
            data: updatedSource,
          });
        })
        .catch((error) => {
          console.error(`Error updating source: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving source: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Delete a source
exports.deleteSource = (req, res) => {
  const id = parseInt(req.params.id);

  Source.findByPk(id)
    .then((source) => {
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }

      source.destroy()
        .then(() => {
          res.status(200).json({ message: "Source deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting source: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving source: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};
