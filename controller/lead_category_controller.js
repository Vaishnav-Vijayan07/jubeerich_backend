const db = require("../models");
const { getUserDetails } = require("../utils/helper");
const Category = db.leadCategory;

// Get all categories
exports.getAllCategories = async (req, res) => {
  Category.findAll({ order: [["createdAt", "DESC"]] })
    .then((categories) => {
      res.status(200).json(categories);
    })
    .catch((error) => {
      console.error(`Error retrieving categories: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Get category by ID
exports.getCategoryById = (req, res) => {
  const id = parseInt(req.params.id);
  Category.findByPk(id)
    .then((category) => {
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.status(200).json(category);
    })
    .catch((error) => {
      console.error(`Error retrieving category: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Add a new category
exports.addCategory = (req, res) => {
  const { category_name, category_description, status, updated_by } = req.body;

  Category.create({
    category_name,
    category_description,
    status,
    updated_by,
  })
    .then((newCategory) => {
      res.status(201).json({
        status: true,
        message: "Category created successfully",
        data: newCategory,
      });
    })
    .catch((error) => {
      console.error(`Error creating category: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Update a category
exports.updateCategory = (req, res) => {
  const id = parseInt(req.params.id);
  const { category_name, category_description, status, updated_by } = req.body;

  Category.findByPk(id)
    .then((category) => {
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      category
        .update({
          category_name,
          category_description,
          status,
          updated_by,
        })
        .then((updatedCategory) => {
          res.status(200).json({
            message: "Category updated successfully",
            data: updatedCategory,
          });
        })
        .catch((error) => {
          console.error(`Error updating category: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving category: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Delete a category
exports.deleteCategory = (req, res) => {
  const id = parseInt(req.params.id);

  Category.findByPk(id)
    .then((category) => {
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      category
        .destroy()
        .then(() => {
          res.status(200).json({ message: "Category deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting category: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving category: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};
