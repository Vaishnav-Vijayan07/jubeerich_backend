const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");
const db = require("../models");

const checkExistingField = async (field, value, excludeId = null) => {
  const condition = { [field]: value };
  if (excludeId) condition.id = { [Op.ne]: excludeId }; // Exclude current user during updates
  return await db.adminUsers.findAll({ where: condition });
};

const handleConflict = (conflicts) => {
  const conflictFields = [];

  // Check each field individually
  if (conflicts.employee_id) conflictFields.push("Employee ID");
  if (conflicts.email) conflictFields.push("Email");
  if (conflicts.phone) conflictFields.push("Phone");
  if (conflicts.username) conflictFields.push("Username");

  if (conflictFields.length > 0) {
    return `The following already exist: ${conflictFields.join(", ")}`;
  }
  return null;
};

exports.addAdminUsers = async (req, res) => {
  const userId = req.userDecodeId;

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
    country_ids,
    franchise_id,
    status,
  } = req.body;

  const transaction = await db.sequelize.transaction();

  try {
    const password = bcrypt.hashSync(req.body.password + process.env.SECRET);
    const conflicts = {};

    // Check for each field individually
    const existingEmployee = await db.adminUsers.findOne({
      where: { employee_id },
      transaction,
    });
    if (existingEmployee) conflicts.employee_id = true;

    const existingEmail = await db.adminUsers.findOne({
      where: { email },
      transaction,
    });
    if (existingEmail) conflicts.email = true;

    const existingPhone = await db.adminUsers.findOne({
      where: { phone },
      transaction,
    });
    if (existingPhone) conflicts.phone = true;

    const existingUsername = await db.adminUsers.findOne({
      where: { username },
      transaction,
    });
    if (existingUsername) conflicts.username = true;

    // Handle the conflict and generate the error message
    const conflictMessage = handleConflict(conflicts);
    if (conflictMessage) {
      await transaction.rollback();
      return res.status(409).json({ status: false, message: conflictMessage });
    }

    // Role-specific checks (as before)

    // Create the new admin user (within the transaction)
    const newUser = await db.adminUsers.create(
      {
        employee_id,
        name,
        email,
        phone,
        address,
        username,
        password,
        updated_by,
        role_id,
        branch_id,
        region_id,
        // country_id,
        franchise_id,
        status,
      },
      { transaction, userId }
    );

    if (country_ids && Array.isArray(country_ids)) {
      await newUser.addCountries(country_ids, { transaction });
    }

    // Commit the transaction if everything succeeds
    await transaction.commit();
    return res.json({ status: true, message: "Admin user added successfully", data: newUser });
  } catch (error) {
    // Rollback the transaction on any error
    await transaction.rollback();

    // Handle unique constraint errors specifically
    if (error.name === "SequelizeUniqueConstraintError" && error.fields) {
      const conflictField = Object.keys(error.fields)[0];
      return res.status(409).json({ status: false, message: `${conflictField} already exists.` });
    }

    console.error("Error creating admin user:", error);
    return res
      .status(500)
      .json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

exports.updateAdminUsers = async (req, res) => {
  const userId = req.userDecodeId;

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
    country_ids,
    franchise_id,
    password,
    status,
  } = req.body;

  const transaction = await db.sequelize.transaction();

  try {
    const conflicts = {};

    // Check if the email already exists for another user
    if (email) {
      const userWithEmail = await checkExistingField("email", email, id);
      if (userWithEmail.length > 0) conflicts.email = true;
    }

    // Check if the phone already exists for another user
    if (phone) {
      const userWithPhone = await checkExistingField("phone", phone, id);
      if (userWithPhone.length > 0) conflicts.phone = true;
    }

    // Check if the employee_id already exists for another user
    if (employee_id) {
      const userWithEmployeeId = await checkExistingField("employee_id", employee_id, id);
      if (userWithEmployeeId.length > 0) conflicts.employee_id = true;
    }

    // Check if the username already exists for another user
    if (username) {
      const userWithUsername = await checkExistingField("username", username, id);
      if (userWithUsername.length > 0) conflicts.username = true;
    }

    // If there are conflicts, generate the conflict message
    if (Object.keys(conflicts).length > 0) {
      const conflictFields = [];
      if (conflicts.email) conflictFields.push("Email");
      if (conflicts.phone) conflictFields.push("Phone");
      if (conflicts.employee_id) conflictFields.push("Employee ID");
      if (conflicts.username) conflictFields.push("Username");

      await transaction.rollback();
      return res.status(409).json({ status: false, message: `The following already exist: ${conflictFields.join(", ")}` });
    }

    // Find the user and update
    const user = await db.adminUsers.findByPk(id, { transaction });
    if (!user) {
      await transaction.rollback(); // Rollback if user not found
      return res.status(204).json({ status: false, message: "Admin user not found" });
    }

    // Prepare update data
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
      franchise_id: franchise_id ?? user.franchise_id,
      status: status ?? user.status,
      password: password ? bcrypt.hashSync(password + process.env.SECRET) : user.password,
    };

    // Update the admin user
    await user.update(updateData, { transaction, userId });

    if (country_ids && Array.isArray(country_ids)) {
      // First, remove existing countries (this will clear the current relationship)
      await user.setCountries([], { transaction }); // Assuming the user model has the 'setCountries' method for many-to-many relationship

      // Now, add the new countries
      await user.addCountries(country_ids, { transaction }); // This will add the countries in the join table
    }

    await transaction.commit();

    return res.json({ status: true, message: "Admin user updated successfully", data: user });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating admin user:", error);
    return res
      .status(500)
      .json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

exports.deleteAdminUsers = async (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;


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
    await db.accessRoles.update({ updated_by: null }, { where: { updated_by: id } });

    // Delete the admin user
    await user.destroy({ userId });

    res.json({
      status: true,
      message: "Admin user deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting admin user:", error);
    res.status(500).json({
      status: false,
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};
exports.getAllAdminUsers = async (req, res, next) => {
  const { role_id } = req;

  let users = [];

  try {
    if (role_id == process.env.APPLICATION_MANAGER_ID) {
      const { id } = await db.accessRoles.findOne({
        where: { id: process.env.APPLICATION_TEAM_ID },
      });

      users = await db.adminUsers.findAll({
        where: {
          role_id: {
            [Op.in]: [id, process.env.APPLICATION_MANAGER_ID],
          },
        },
        include: [
          {
            model: db.accessRoles,
            as: "access_role",
            attributes: ["role_name"],
          },
        ],
        attributes: ["id", "name"],
      });
    } else {
      users = await db.adminUsers.findAll({
        include: [
          {
            model: db.accessRoles,
            as: "access_role",
            attributes: ["role_name"],
          },
          {
            model: db.country,
            attributes: ["country_name", "id"],
            through: { attributes: [] },
            required: false,
          },
        ],
        order: [["createdAt", "DESC"]],
      });
    }

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
                label: country?.country_name,
              };
            })
          : [],
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
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getAllCounsellors = async (req, res, next) => {
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
          attributes: ["country_name", "id"],
          through: { attributes: [] },
          required: false,
        },
      ],
      where: {
        role_id: process.env.COUNSELLOR_ROLE_ID,
        status: true,
      },
      order: [["createdAt", "DESC"]],
    });

    if (!users || users.length === 0) {
      return res.status(204).json({
        status: false,
        message: "Admin users not found",
        data: [],
      });
    }

    // console.log("userJson ==>", users);

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        // country_name: userJson.country ? userJson.country.country_name : null, // Include country name
        countries: userJson.countries
          ? userJson.countries.map((country) => {
              return {
                value: country?.id,
                label: country?.country_name,
              };
            })
          : [],
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
      message: "An error occurred while processing your request. Please try again later.",
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
        status: true,
      },
      include: [
        {
          model: db.accessRoles,
          as: "access_role",
          attributes: ["role_name"],
        },
        {
          model: db.country,
          attributes: ["country_name", "id"],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    if (!users || users.length === 0) {
      return res.status(204).json({
        status: false,
        message: "Admin users not found !",
        data: [],
      });
    }

    // console.log("userJson ==>", users);

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        countries: userJson.countries
          ? userJson.countries.map((country) => {
              return {
                value: country?.id,
                label: country?.country_name,
              };
            })
          : [],
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
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getAllCounsellorsTLByBranch = async (req, res, next) => {
  try {
    const { id } = req.params;
    const users = await db.adminUsers.findAll({
      where: {
        role_id: process.env.COUNSELLOR_TL_ID,
        branch_id: id,
        status: true,
      },
      include: [
        {
          model: db.accessRoles,
          as: "access_role",
          attributes: ["role_name"],
        },
        {
          model: db.country,
          attributes: ["country_name", "id"],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(204).json({
        status: false,
        message: "Admin users not found !",
        data: [],
      });
    }

    // console.log("userJson ==>", users);

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        countries: userJson.countries
          ? userJson.countries.map((country) => {
              return {
                value: country?.id,
                label: country?.country_name,
              };
            })
          : [],
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
      message: "An error occurred while processing your request. Please try again later.",
    });
  }
};

exports.getFranchiseCounsellors = async (req, res, next) => {
  try {
    const users = await db.adminUsers.findAll({
      where: {
        role_id: process.env.FRANCHISE_COUNSELLOR_ID,
        status: true,
      },
      include: [
        {
          model: db.accessRoles,
          as: "access_role",
          attributes: ["role_name"],
        },
        {
          model: db.country,
          attributes: ["country_name", "id"],
          through: { attributes: [] },
          required: false,
        },
      ],
    });

    if (!users || users.length === 0) {
      return res.status(204).json({
        status: false,
        message: "Admin users not found",
        data: [],
      });
    }

    const usersWithRoleAndCountry = users.map((user) => {
      const userJson = user.toJSON();
      return {
        ...userJson,
        role: userJson.access_role ? userJson.access_role.role_name : null,
        countries: userJson.countries
          ? userJson.countries.map((country) => {
              return {
                value: country?.id,
                label: country?.country_name,
              };
            })
          : [],
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
      message: "An error occurred while processing your request. Please try again later.",
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
