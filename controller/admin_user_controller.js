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
      ],
    });

    if (!users || users.length === 0) {
      return res.status(204).json({
        status: false,
        message: "Admin users not found",
      });
    }

    const usersWithRoleAndCountries = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        // countries: userJson.countries
        //   ? userJson.countries.map((country) => country.country_name)
        // : [], // List of country names
        countries: userJson.countries
          ? userJson.countries.map((country) => {
            return {
              value: country?.id,
              label: country?.country_name
            }
          }) : [],
        access_role: undefined, // Remove the access_role object
      };
    });

    res.status(200).json({
      status: true,
      data: usersWithRoleAndCountries,
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

    console.log('users',users);

    if (!users || users.length === 0) {
      return res.status(204).json({
        status: false,
        message: "Admin users not found",
        data: []
      });
    }

    // console.log("userJson ==>", users);

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

exports.getAllCounsellorsByBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await db.adminUsers.findAll({
      // where: {
      //   role_id: process.env.BRANCH_COUNSELLOR_ROLE_ID,
      //   branch_id: id
      // },
      where: {
        role_id: {
          // [Op.in]: [process.env.BRANCH_COUNSELLOR_ID, process.env.COUNSELLOR_TL_ID],
          [Op.in]: [process.env.BRANCH_COUNSELLOR_ID],
        },
        branch_id: id,
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
      return res.status(204).json({
        status: false,
        message: "Admin users not found !",
        data: []
      });
    }

    // console.log("userJson ==>", users);

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

exports.getAllCounsellorsTLByBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await db.adminUsers.findAll({
      where: {
        role_id: process.env.COUNSELLOR_TL_ID,
        branch_id: id
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
      return res.status(204).json({
        status: false,
        message: "Admin users not found !",
        data: []
      });
    }

    // console.log("userJson ==>", users);

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
      return res.status(204).json({
        status: false,
        message: "Admin users not found",
        data: []
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
    franchise_id
  } = req.body;

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

    let existTL;
    let existFranchiseTL
    if(role_id == process.env.FRANCHISE_MANAGER_ID){
      existFranchiseTL = await db.adminUsers.findOne({
        where: {
          [Op.and]: [{ role_id: process.env.FRANCHISE_MANAGER_ID }, { franchise_id }],
        },
      });

      console.log('existFranchiseTL',existFranchiseTL);
    }

    if(existFranchiseTL){
      return res.status(409).json({
        status: false,
        message: `Franchise Manager already exists in the Franchise`,
      });
    }

    if(role_id == process.env.COUNSELLOR_TL_ID){
      existTL = await db.adminUsers.findOne({
        where: {
          [Op.and]: [{ role_id: process.env.COUNSELLOR_TL_ID }, { branch_id }],
        },
      });

      console.log('existTL',existTL);
    }

    if(existTL){
      return res.status(409).json({
        status: false,
        message: `TL already exists in the branch`,
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
    password // Include the password field in the request body
  } = req.body;

  try {
    // Check if the email already exists for another user
    if (email) {
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
    }

    // Find the admin user by ID
    const user = await db.adminUsers.findByPk(id);
    if (!user) {
      return res.status(204).json({
        status: false,
        message: "Admin user not found",
      });
    }

    // Prepare update data, retaining existing values if new values are not provided
    const updateData = {
      employee_id: employee_id ?? user.employee_id,
      name: name ?? user.name,
      email: email ?? user.email,
      phone: phone ?? user.phone,
      address: address ?? user.address,
      username: username ?? user.username,
      updated_by: updated_by ?? user.updated_by,
      branch_id: branch_id ?? user.branch_id,
      role_id: role_id ?? user.role_id,
      region_id: region_id ?? user.region_id,
      country_id: country_id ?? user.country_id,
      franchise_id: franchise_id ?? user.franchise_id,
    };

    // If password is not null, hash and update it; otherwise, retain the existing password
    if (password !== null && password !== undefined) {
      updateData.password = bcrypt.hashSync(password + process.env.SECRET);
    } else {
      updateData.password = user.password; // Retain existing password
    }

    // Update the admin user
    await user.update(updateData);

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
      return res.status(204).json({
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
