const db = require("../models");
const StatusAccessRoles = db.statusAccessRoles;
const Status = db.status;
const AccessRoles = db.accessRoles;

// Create or Update StatusAccessRoles entries
exports.statusConfig = async (req, res) => {
    const { status_id, access_role_ids } = req.body;

    // Validate request
    if (!status_id || !access_role_ids || !Array.isArray(access_role_ids)) {
        return res.status(400).send({
            message: "Invalid input data. 'status_id' and 'access_role_ids' are required and 'access_role_ids' should be an array."
        });
    }

    try {
        // Ensure the status exists
        const status = await Status.findByPk(status_id);
        if (!status) {
            return res.status(404).send({
                message: `Status with id ${status_id} not found.`
            });
        }

        // Ensure the access roles exist
        const accessRoles = await AccessRoles.findAll({
            where: {
                id: access_role_ids
            }
        });

        if (accessRoles.length !== access_role_ids.length) {
            return res.status(404).send({
                message: "Some access roles were not found."
            });
        }

        // Delete existing entries for this status_id
        await StatusAccessRoles.destroy({
            where: { status_id }
        });

        // Create new entries in the join table
        const statusAccessRolesEntries = access_role_ids.map(access_role_id => ({
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

exports.listAllStatusesWithAccessRoles = async (req, res) => {
    try {
        // Retrieve all statuses with their associated access roles
        const statuses = await Status.findAll({
            include: [
                {
                    model: AccessRoles,
                    through: {
                        attributes: [] // Exclude join table attributes
                    },
                    attributes: ['id', 'role_name'] // Adjust attributes as needed
                }
            ]
        });

        res.send({
            message: "Statuses with associated AccessRoles retrieved successfully.",
            data: statuses
        });
    } catch (error) {
        res.status(500).send({
            message: error.message || "Some error occurred while retrieving the Statuses with AccessRoles."
        });
    }
};
