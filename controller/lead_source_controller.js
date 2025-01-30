const db = require("../models");
const Source = db.leadSource;

// Function to generate a unique slug
async function generateUniqueSlug(name) {
  // Create a base slug with underscores and capitalize it
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_") // Replace non-alphanumeric characters with underscores
    .replace(/(^_+|_+$)/g, "") // Remove leading and trailing underscores
    .toUpperCase(); // Capitalize the slug

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await Source.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}_${counter}`; // Use underscore instead of hyphen for uniqueness
    counter++;
  }

  return uniqueSlug;
}

// Get all sources
exports.getAllSources = async (req, res) => {
  try {
    // Fetch all sources with associated lead type name
    const sources = await Source.findAll({
      include: [
        {
          model: db.leadType,
          as: "leadType",
          attributes: ["name"], // Include only the lead type name
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Transform the sources to include leadType name directly
    const transformedSources = sources.map((source) => {
      const sourceData = source.get({ plain: true });
      return {
        ...sourceData,
        leadType: sourceData.leadType ? sourceData.leadType.name : null,
      };
    });

    res.status(200).json({
      status: true,
      data: transformedSources,
    });
  } catch (error) {
    console.error(`Error retrieving sources: ${error}`);
    res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
};

// Get source by ID
exports.getSourceById = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Fetch the source by ID with associated lead type name
    const source = await Source.findByPk(id, {
      include: [
        {
          model: db.leadType,
          as: "leadType",
          attributes: ["name"], // Include only the lead type name
        },
      ],
    });

    if (!source) {
      return res.status(404).json({ message: "Source not found" });
    }

    // Transform the source to include leadType name directly
    const sourceData = source.get({ plain: true });
    const result = {
      ...sourceData,
      lead_type_name: sourceData.leadType ? sourceData.leadType.name : null, // Extract lead type name
      leadType: undefined, // Remove the nested leadType object
    };

    res.status(200).json({
      status: true,
      data: result,
    });
  } catch (error) {
    console.error(`Error retrieving source: ${error}`);
    res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
};

// Add a new source
exports.addSource = async (req, res) => {
  const { source_name, source_description, lead_type_id } = req.body;
  const userId = req.userDecodeId; // Assuming userDecodeId is available in req

  try {
    // Generate the slug
    const slug = await generateUniqueSlug(source_name);

    // Create the source
    const newSource = await Source.create(
      {
        source_name,
        source_description,
        updated_by: userId, // Use userId as the updated_by value
        slug, // Add slug here
        lead_type_id, // Reference the lead type ID
      },
      { userId }
    );

    res.status(201).json({
      status: true,
      message: "Source created successfully",
      data: newSource,
    });
  } catch (error) {
    console.error(`Error creating source: ${error}`);
    res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
};

// Update a source
exports.updateSource = async (req, res) => {
  const id = parseInt(req.params.id);
  const { source_name, source_description, lead_type_id } = req.body;
  const userId = req.userDecodeId; // Assuming userDecodeId is available in req

  try {
    const source = await Source.findByPk(id);

    if (!source) {
      return res.status(404).json({ message: "Source not found" });
    }

    // Prepare updated data
    const updatedData = {
      source_description,
      updated_by: userId, // Update with the current user's ID
      lead_type_id, // Update the lead type ID
    };

    // Only update the slug if the source name has changed
    if (source_name && source_name !== source.source_name) {
      updatedData.source_name = source_name;
      updatedData.slug = await generateUniqueSlug(source_name);
    } else {
      updatedData.source_name = source_name || source.source_name;
    }

    const updatedSource = await source.update(updatedData, { userId });

    res.status(200).json({
      message: "Source updated successfully",
      data: updatedSource,
    });
  } catch (error) {
    console.error(`Error updating source: ${error}`);
    res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
};

// Delete a source
exports.deleteSource = (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;

  Source.findByPk(id)
    .then((source) => {
      if (!source) {
        return res.status(404).json({ message: "Source not found" });
      }

      source
        .destroy({ userId })
        .then(() => {
          res.status(200).json({ message: "Source deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting source: ${error}`);
          res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving source: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};
