const db = require("../models");
const StatusAccessRoles = db.statusAccessRoles;
const Status = db.status;
const AccessRoles = db.accessRoles;

// Create or Update StatusAccessRoles entries
exports.statusConfig = async (req, res) => {
    const { access_role_id, status_ids } = req.body;

    // Validate request
    if (!access_role_id || !status_ids || !Array.isArray(status_ids)) {
        return res.status(400).send({
            message: "Invalid input data. 'access_role_id' and 'status_ids' are required and 'status_ids' should be an array."
        });
    }

    try {
        // Ensure the access role exists
        const accessRole = await AccessRoles.findByPk(access_role_id);
        if (!accessRole) {
            return res.status(404).send({
                message: `AccessRole with id ${access_role_id} not found.`
            });
        }

        // Ensure the statuses exist
        const statuses = await Status.findAll({
            where: {
                id: status_ids
            }
        });

        if (statuses.length !== status_ids.length) {
            return res.status(404).send({
                message: "Some statuses were not found."
            });
        }

        // Delete existing entries for this access_role_id
        await StatusAccessRoles.destroy({
            where: { access_role_id }
        });

        // Create new entries in the join table
        const statusAccessRolesEntries = status_ids.map(status_id => ({
            status_id,
            access_role_id
        }));

        await StatusAccessRoles.bulkCreate(statusAccessRolesEntries);

        res.send({
            message: "StatusAccessRoles entries were updated successfully."
        });
    } catch (error) {
        res.status(500).send({
            message: error.message || "Some error occurred while updating the StatusAccessRoles entries."
        });
    }
};

exports.listAllAccessRolesWithStatuses = async (req, res) => {
    try {
        // Retrieve all access roles with their associated statuses
        const accessRoles = await AccessRoles.findAll({
            include: [
                {
                    model: Status,
                    through: {
                        attributes: [] // Exclude join table attributes
                    },
                    attributes: ['id', 'status_name', 'color'] // Adjust attributes as needed
                }
            ]
        });

        res.send({
            message: "AccessRoles with associated Statuses retrieved successfully.",
            data: accessRoles
        });
    } catch (error) {
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving the AccessRoles with Statuses."
        });
    }
};
