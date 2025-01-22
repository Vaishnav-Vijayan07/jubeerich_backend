const db = require("../models");
const AccessRoles = db.accessRoles;
const AccessPowers = db.accessPowers;
const AdminUsers = db.adminUsers;

// Get all access roles
exports.getAllAccessRoles = async (req, res) => {
  try {
    const roles = await AccessRoles.findAll({
      include: [
        {
          model: AdminUsers,
          as: "updatedByUser",
          attributes: ["name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Extract and flatten all power_ids from roles
    const powerIds = roles.map((role) => (role.power_ids ? role.power_ids.split(",").map(Number) : [])).flat();

    // Remove duplicates and invalid ids
    const uniquePowerIds = [...new Set(powerIds)].filter((id) => !isNaN(id));

    const powers = await AccessPowers.findAll({
      where: { id: uniquePowerIds },
      attributes: ["id", "power_name"],
    });

    const powerNamesMap = powers.reduce((acc, power) => {
      acc[power.id] = power.power_name;
      return acc;
    }, {});

    const rolesWithPowerNames = roles.map((role) => ({
      ...role.toJSON(),
      updated_by: role.updatedByUser ? role.updatedByUser.name : null,
      power_names: role.power_ids
        ? role.power_ids
            .split(",")
            .map(Number)
            .map((id) => powerNamesMap[id])
        : [],
    }));

    res.json({
      status: true,
      data: rolesWithPowerNames,
    });
  } catch (error) {
    console.error("Error fetching access roles:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Get access role by ID
exports.getAccessRoleById = async (req, res) => {
  const id = parseInt(req.params.id);
  try {
    const role = await AccessRoles.findByPk(id, {
      include: [
        {
          model: AdminUsers,
          as: "updatedByUser",
          attributes: ["name"],
        },
        {
          model: AccessPowers,
          as: "powers",
          attributes: ["power_name"],
          through: { attributes: [] },
        },
      ],
    });

    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Access role not found",
      });
    }

    const roleWithPowerNames = {
      ...role.toJSON(),
      power_names: role.powers.map((power) => power.power_name),
      updated_by: role.updatedByUser ? role.updatedByUser.name : null,
    };

    res.json({
      status: true,
      data: roleWithPowerNames,
    });
  } catch (error) {
    console.error("Error fetching access role:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Add a new access role
// exports.createAccessRole = async (req, res) => {
//   const { role_name, power_ids, updated_by } = req.body;

//   try {
//     const newRole = await AccessRoles.create({
//       role_name,
//       power_ids: power_ids.join(','),  // Join array to string if stored as CSV
//       updated_by,
//     });

//     res.json({
//       status: true,
//       data: newRole,
//     });
//   } catch (error) {
//     console.error("Error creating access role:", error);
//     res.status(500).json({
//       status: false,
//       message: "Internal server error",
//     });
//   }
// };

exports.createAccessRole = async (req, res) => {
  const { role_name, power_ids, updated_by } = req.body;

  try {
    // Ensure power_ids is an array and join it into a string
    const powerIdsString = Array.isArray(power_ids) ? power_ids.join(",") : "";

    const newRole = await AccessRoles.create({
      role_name,
      power_ids: powerIdsString,
      updated_by,
    });

    res.json({
      status: true,
      data: newRole,
      message: "User role added successfully",
    });
  } catch (error) {
    console.error("Error creating access role:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Update an access role
exports.updateAccessRole = async (req, res) => {
  const id = parseInt(req.params.id);
  const { role_name, power_ids, updated_by } = req.body;

  try {
    const role = await AccessRoles.findByPk(id);

    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Access role not found",
      });
    }

    const updatedRole = await role.update({
      role_name,
      power_ids: power_ids.join(","), // Join array to string if stored as CSV
      updated_by,
    });

    res.json({
      status: true,
      message: "Access role updated successfully",
      data: updatedRole,
    });
  } catch (error) {
    console.error("Error updating access role:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Delete an access role
exports.deleteAccessRole = async (req, res) => {
  const id = parseInt(req.params.id);

  try {
    const role = await AccessRoles.findByPk(id);

    if (!role) {
      return res.status(404).json({
        status: false,
        message: "Access role not found",
      });
    }

    await role.destroy();

    res.json({
      status: true,
      message: "Access role deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting access role:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};

// Delete all access roles
exports.deleteAllAccessRoles = async (req, res) => {
  try {
    const deleted = await AccessRoles.destroy({
      where: {},
      truncate: false,
    });

    res.json({
      status: true,
      message: `${deleted} access roles deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting access roles:", error);
    res.status(500).json({
      status: false,
      message: "Internal server error",
    });
  }
};
