const db = require("../models");
const Source = db.leadSource;

// Function to generate a unique slug
async function generateUniqueSlug(name) {
  // Create a base slug with underscores and capitalize it
  const baseSlug = name.toLowerCase()
    .replace(/[^a-z0-9]+/g, '_') // Replace non-alphanumeric characters with underscores
    .replace(/(^_+|_+$)/g, '')   // Remove leading and trailing underscores
    .toUpperCase();              // Capitalize the slug

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await Source.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}_${counter}`; // Use underscore instead of hyphen for uniqueness
    counter++;
  }

  return uniqueSlug;
}

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
exports.addSource = async (req, res) => {
  const { source_name, source_description, updated_by } = req.body;

  try {
    // Generate the slug
    const slug = await generateUniqueSlug(source_name);

    // Create the source
    const newSource = await Source.create({
      source_name,
      source_description,
      updated_by,
      slug, // Add slug here
    });

    res.status(201).json({
      status: true,
      message: "Source created successfully",
      data: newSource,
    });
  } catch (error) {
    console.error(`Error creating source: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Update a source
exports.updateSource = async (req, res) => {
  const id = parseInt(req.params.id);
  const { source_name, source_description, updated_by } = req.body;

  try {
    const source = await Source.findByPk(id);

    if (!source) {
      return res.status(404).json({ message: "Source not found" });
    }

    // Prepare updated data
    const updatedData = {
      source_description,
      updated_by,
    };

    // Only update the slug if the source name has changed
    if (source_name && source_name !== source.source_name) {
      updatedData.source_name = source_name;
      updatedData.slug = await generateUniqueSlug(source_name);
    } else {
      updatedData.source_name = source_name || source.source_name;
    }

    const updatedSource = await source.update(updatedData);

    res.status(200).json({
      message: "Source updated successfully",
      data: updatedSource,
    });
  } catch (error) {
    console.error(`Error updating source: ${error}`);
    res.status(500).json({ message: "Internal server error" });
  }
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
