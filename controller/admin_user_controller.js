const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const db = require("../models");

exports.getAllAdminUsers = async (req, res, next) => {
  try {
    const users = await db.adminUsers.findAll({
      include: [
        {
          model: db.accessRoles,
          as: "access_role",
          attributes: ["role_name"],
        },
        {
          model: db.country,
          as: "country", // Ensure this alias matches your association setup
          attributes: ["country_name"],
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Admin users not found",
      });
    }

    console.log("userJson ==>", users);

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        country_name: userJson.country ? userJson.country.country_name : null, // Include country name
        access_role: undefined, // Remove the access_role object
        country: undefined, // Remove the country object
      };
    });

    res.status(200).json({
      status: true,
      data: usersWithRoleAndCountry,
    });
  } catch (error) {
    console.error(`Error in getting admin users: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getAllCounsellors = async (req, res, next) => {
  try {
    const users = await db.adminUsers.findAll({
      where: {
        role_id: process.env.COUNSELLOR_ROLE_ID,
      },
      include: [
        {
          model: db.accessRoles,
          as: "access_role",
          attributes: ["role_name"],
        },
        {
          model: db.country,
          as: "country", // Ensure this alias matches your association setup
          attributes: ["country_name"],
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Admin users not found",
      });
    }

    console.log("userJson ==>", users);

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        country_name: userJson.country ? userJson.country.country_name : null, // Include country name
        access_role: undefined, // Remove the access_role object
        country: undefined, // Remove the country object
      };
    });

    res.status(200).json({
      status: true,
      data: usersWithRoleAndCountry,
    });
  } catch (error) {
    console.error(`Error in getting admin users: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

exports.getFranchiseCounsellors = async (req, res, next) => {
  try {
    const users = await db.adminUsers.findAll({
      where: {
        role_id: process.env.FRANCHISE_COUNSELLOR_ID,
      },
      include: [
        {
          model: db.accessRoles,
          as: "access_role",
          attributes: ["role_name"],
        },
        {
          model: db.country,
          as: "country", // Ensure this alias matches your association setup
          attributes: ["country_name"],
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(404).json({
        status: false,
        message: "Admin users not found",
      });
    }

    console.log("userJson ==>", users);

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        country_name: userJson.country ? userJson.country.country_name : null, // Include country name
        access_role: undefined, // Remove the access_role object
        country: undefined, // Remove the country object
      };
    });

    res.status(200).json({
      status: true,
      data: usersWithRoleAndCountry,
    });
  } catch (error) {
    console.error(`Error in getting admin users: ${error}`);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
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
  const {
    employee_id,
    name,
    email,
    phone,
    address,
    username,
    updated_by,
    role_id,
    branch_id,
    region_id,
    country_id,
    franchise_id,
    country_ids
  } = req.body;
  //   const profileImage = req.file;
  console.log("req.body==============>", req.body);

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
      if (conflicts.some((user) => user.employee_id === employee_id))
        conflictFields.push("Employee ID");
      if (conflicts.some((user) => user.email === email))
        conflictFields.push("Email");
      if (conflicts.some((user) => user.phone === phone))
        conflictFields.push("Phone");
      if (conflicts.some((user) => user.username === username))
        conflictFields.push("Username");

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
      branch_id,
      region_id,
      country_id,
      franchise_id,
    });

    if (branch_id && Array.isArray(country_ids) && country_ids.length > 0) {
      await newUser.setCountries(country_ids); // Use Sequelize's utility method for many-to-many relationships
    }

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
  const {
    employee_id,
    name,
    email,
    phone,
    address,
    username,
    updated_by,
    branch_id,
    role_id,
    region_id,
    country_id,
    franchise_id,
    country_ids,
  } = req.body;

  try {
    // Check if the email already exists for another user
    const userWithEmail = await db.adminUsers.findAll({
      where: {
        email,
        id: { [Op.ne]: id },
      },
    });

    if (userWithEmail.length > 0) {
      return res.status(409).json({
        status: false,
        message: "Email already exists",
      });
    }

    // Find the admin user by ID
    const user = await db.adminUsers.findByPk(id);
    if (!user) {
      return res.status(404).json({
        status: false,
        message: "Admin user not found",
      });
    }

    // Update the admin user
    await user.update({
      employee_id,
      name,
      email,
      phone,
      address,
      username,
      updated_by,
      // profile_image_path: profileImage ? profileImage.path : user.profile_image_path,
      branch_id,
      role_id,
      region_id,
      country_id,
      franchise_id,
    });

    // If role_id is 5, handle updating associated countries
    if (branch_id && Array.isArray(country_ids)) {
      // Update the associated countries using the setCountries method for many-to-many relationships
      await user.setCountries(country_ids);
    }

    res.json({
      status: true,
      message: "Admin user updated successfully",
      data: user,
    });
  } catch (error) {
    console.error("Error updating admin user:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};


// exports.updateAdminUsers = async (req, res) => {
//   const id = parseInt(req.params.id);
//   const {
//     employee_id,
//     name,
//     email,
//     phone,
//     address,
//     username,
//     updated_by,
//     branch_id,
//     role_id,
//     region_id,
//     country_id,
//   } = req.body;
//   const profileImage = req.file; // New profile image (if uploaded)

//   try {
//     const userWithEmail = await db.adminUsers.findAll({
//       where: {
//         email,
//         id: { [Op.ne]: id },
//       },
//     });

//     if (userWithEmail.length > 0) {
//       return res.status(409).json({
//         status: false,
//         message: "Email already exists",
//       });
//     }

//     const user = await db.adminUsers.findByPk(id);
//     if (!user) {
//       return res.status(404).json({
//         status: false,
//         message: "Admin user not found",
//       });
//     }
//     // const oldImagePath = user.profile_image_path;

//     // // Delete the old image if it exists
//     // const deleteOldImage = (oldImagePath) => {
//     //   if (oldImagePath) {
//     //     fs.unlink(oldImagePath, (err) => {
//     //       if (err) {
//     //         console.error("Error deleting old image:", err);
//     //       }
//     //     });
//     //   }
//     // };
//     // deleteOldImage(oldImagePath);

//     // Update the user with the new image path
//     const updatedUser = await user.update({
//       employee_id,
//       name,
//       email,
//       phone,
//       address,
//       username,
//       // password,
//       updated_by,
//       // profile_image_path: profileImage ? profileImage.path : null,
//       branch_id,
//       role_id,
//       region_id,
//       country_id,
//     });

//     res.json({
//       status: true,
//       message: "Admin user updated successfully",
//       data: updatedUser,
//     });
//   } catch (error) {
//     console.error("Error updating admin user:", error);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.deleteAdminUsers = async (req, res) => {
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

    // Update the access_roles table to set updated_by to null where it references the admin user to be deleted
    await db.accessRoles.update(
      { updated_by: null },
      { where: { updated_by: id } }
    );

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
