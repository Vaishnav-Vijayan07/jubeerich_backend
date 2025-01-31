const db = require("../models");
const LeadType = db.leadType;

// Function to generate a unique slug
async function generateUniqueSlug(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_+|_+$)/g, "")
    .toUpperCase();

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await LeadType.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}_${counter}`;
    counter++;
  }

  return uniqueSlug;
}

// Get all lead types
exports.getAllLeadTypes = (req, res) => {
  LeadType.findAll({
    order: [["createdAt", "DESC"]],
  })
    .then((leadTypes) => {
      res.status(200).json(leadTypes);
    })
    .catch((error) => {
      console.error(`Error retrieving lead types: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};

// Get lead type by ID
exports.getLeadTypeById = (req, res) => {
  const id = parseInt(req.params.id);

  LeadType.findByPk(id)
    .then((leadType) => {
      if (!leadType) {
        return res.status(404).json({ message: "Lead type not found" });
      }
      res.status(200).json(leadType);
    })
    .catch((error) => {
      console.error(`Error retrieving lead type: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};

// Add a new lead type
exports.addLeadType = async (req, res) => {
  const { name, description } = req.body;
  const userId = req.userDecodeId;

  try {
    // Generate the slug
    const slug = await generateUniqueSlug(name);

    // Create the lead type
    const newLeadType = await LeadType.create({
      name,
      description,
      updated_by: userId,
      slug, // Add slug here
    }, {userId});

    res.status(201).json({
      status: true,
      message: "Lead type created successfully",
      data: newLeadType,
    });
  } catch (error) {
    console.error(`Error creating lead type: ${error}`);
    res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
};

// Update a lead type
exports.updateLeadType = (req, res) => {
  const id = parseInt(req.params.id);
  const { name, description, updated_by } = req.body;
  const userId = req.userDecodeId;

  LeadType.findByPk(id)
    .then(async (leadType) => {
      if (!leadType) {
        return res.status(404).json({ message: "Lead type not found" });
      }

      // Prepare the updated data
      const updatedData = {
        description,
        updated_by: userId,
      };

      // Update the slug only if the name has changed
      if (name && name !== leadType.name) {
        updatedData.name = name;
        updatedData.slug = await generateUniqueSlug(name);
      } else {
        updatedData.name = name || leadType.name;
      }

      leadType
        .update(updatedData, {userId})
        .then((updatedLeadType) => {
          res.status(200).json({
            message: "Lead type updated successfully",
            data: updatedLeadType,
          });
        })
        .catch((error) => {
          console.error(`Error updating lead type: ${error}`);
          res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving lead type: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};

// Delete a lead type
exports.deleteLeadType = (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;


  LeadType.findByPk(id)
    .then((leadType) => {
      if (!leadType) {
        return res.status(404).json({ message: "Lead type not found" });
      }

      leadType
        .destroy({ userId })
        .then(() => {
          res.status(200).json({ message: "Lead type deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting lead type: ${error}`);
          res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving lead type: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};
