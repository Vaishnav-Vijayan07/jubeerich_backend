const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const db = require("../models");

exports.getAllAdminUsers = (req, res, next) => {
  db.adminUsers
    .findAll()
    // .findAll({
    //   attributes: {
    //     include: [
    //       [
    //         db.sequelize.fn(
    //           "json_agg",
    //           db.sequelize.fn("json_build_object", [
    //             "id",
    //             db.sequelize.col("branches.id"),
    //             "branch_name",
    //             db.sequelize.col("branches.branch_name"),
    //             "branch_address",
    //             db.sequelize.col("branches.branch_address"),
    //             "branch_city",
    //             db.sequelize.col("branches.branch_city"),
    //             "branch_country",
    //             db.sequelize.col("branches.branch_country"),
    //             "currency",
    //             db.sequelize.col("branches.currency"),
    //           ])
    //         ),
    //         "branches",
    //       ],
    //     ],
    //   },
    //   include: [
    //     {
    //       model: db.branches,
    //       as: "branches",
    //       attributes: [],
    //       through: { attributes: [] },
    //     },
    //     {
    //       model: db.access_roles,
    //       attributes: ["role_name"],
    //     },
    //   ],
    // })
    .then((userDB) => {
      if (userDB == null) throw new Error("user not found");
      res.status(200).send(userDB);
    })
    .catch((error) => {
      console.log(`error in getting user ${error.toString()}`);
      res.status(200).send({ message: error.toString() });
    });
};

exports.getAdminUsersById = (req, res, next) => {
  const id = parseInt(req.params.id);
  db.adminUsers
    .findByPk(id)
    .then((userDB) => {
      if (userDB == null) throw new Error("user not found");
      res.status(200).send(userDB);
    })
    .catch((error) => {
      console.log(`error in getting user ${error.toString()}`);
      res.status(200).send({ message: error.toString() });
    });
};

exports.addAdminUsers = async (req, res) => {
  const { employee_id, name, email, phone, address, username, updated_by, role_id, branch_ids } = req.body;
  //   const profileImage = req.file;

  try {
    const password = bcrypt.hashSync(req.body.password + process.env.SECRET);

    // Check if employee_id, email, phone, or username already exist
    const conflicts = await db.adminUsers.findAll({
      where: {
        [Op.or]: [{ employee_id }, { email }, { phone }, { username }],
      },
    });

    if (conflicts.length > 0) {
      const conflictFields = [];
      if (conflicts.some((user) => user.employee_id === employee_id)) conflictFields.push("Employee ID");
      if (conflicts.some((user) => user.email === email)) conflictFields.push("Email");
      if (conflicts.some((user) => user.phone === phone)) conflictFields.push("Phone");
      if (conflicts.some((user) => user.username === username)) conflictFields.push("Username");

      return res.status(409).json({
        status: false,
        message: `${conflictFields.join(", ")} already exists`,
      });
    }

    // Insert the new admin user
    const newUser = await db.adminUsers.create({
      employee_id,
      name,
      email,
      phone,
      address,
      username,
      password,
      updated_by,
      role_id,
      //   profile_image_path: profileImage ? profileImage.path : null,
      branch_ids,
    });

    res.json({
      status: true,
      data: newUser,
      message: "Admin user added successfully",
    });
  } catch (error) {
    console.error("Error creating admin user:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.updateAdminUsers = async (req, res) => {
  const id = parseInt(req.params.id);
  const { employee_id, name, email, phone, address, username, updated_by, branch_ids, role_id } = req.body;
  const profileImage = req.file; // New profile image (if uploaded)

  try {
    const password = bcrypt.hashSync(req.body.password + process.env.SECRET);

    // Fetch the old image path
    const user = await db.adminUsers.findByPk(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }
    // const oldImagePath = user.profile_image_path;

    // // Delete the old image if it exists
    // const deleteOldImage = (oldImagePath) => {
    //   if (oldImagePath) {
    //     fs.unlink(oldImagePath, (err) => {
    //       if (err) {
    //         console.error("Error deleting old image:", err);
    //       }
    //     });
    //   }
    // };
    // deleteOldImage(oldImagePath);

    // Update the user with the new image path
    const updatedUser = await user.update({
      employee_id,
      name,
      email,
      phone,
      address,
      username,
      password,
      updated_by,
      profile_image_path: profileImage ? profileImage.path : null,
      branch_ids,
      role_id,
    });

    res.json({
      status: true,
      message: "Admin user updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.deletAdminUsers = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    // Find the admin user by ID
    const user = await db.adminUsers.findByPk(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    // Delete the admin user
    await user.destroy();

    res.json({
      status: true,
      message: "Admin user deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
