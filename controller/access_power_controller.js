const db = require("../models");
const AccessPowers = db.accessPowers;

// Get all access powers
exports.getAllAccessPowers = (req, res) => {
  AccessPowers.findAll()
    .then((powers) => {
      res.status(200).json({
        status: true,
        data: powers,
      });
    })
    .catch((error) => {
      console.error(`Error retrieving access powers: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Get access power by ID
exports.getAccessPowerById = (req, res) => {
  const id = parseInt(req.params.id);
  AccessPowers.findByPk(id)
    .then((power) => {
      if (!power) {
        return res.status(404).json({ message: "Access power not found" });
      }
      res.status(200).json({
        status: true,
        data: power,
      });
    })
    .catch((error) => {
      console.error(`Error retrieving access power: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Add a new access power
exports.addAccessPower = (req, res) => {
  const { power_name, updated_by, status } = req.body;

  AccessPowers.create({
    power_name,
    updated_by,
    status: status !== undefined ? status : true,
  })
    .then((newPower) => {
      res.status(201).json({
        status: true,
        message: "Access power created successfully",
        data: newPower,
      });
    })
    .catch((error) => {
      console.error(`Error creating access power: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Update an access power
exports.updateAccessPower = (req, res) => {
  const id = parseInt(req.params.id);
  const { power_name, updated_by, status } = req.body;

  AccessPowers.findByPk(id)
    .then((power) => {
      if (!power) {
        return res.status(404).json({ message: "Access power not found" });
      }

      power.update({
        power_name,
        updated_by,
        status,
      })
        .then((updatedPower) => {
          res.status(200).json({
            message: "Access power updated successfully",
            data: updatedPower,
          });
        })
        .catch((error) => {
          console.error(`Error updating access power: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving access power: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Delete an access power
exports.deleteAccessPower = (req, res) => {
  const id = parseInt(req.params.id);

  AccessPowers.findByPk(id)
    .then((power) => {
      if (!power) {
        return res.status(404).json({ message: "Access power not found" });
      }

      power.destroy()
        .then(() => {
          res.status(200).json({ message: "Access power deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting access power: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving access power: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Delete all access powers
// exports.deleteAllAccessPowers = (req, res) => {
//   AccessPowers.destroy({
//     where: {},
//     truncate: false,
//   })
//     .then((deleted) => {
//       res.status(200).json({ message: `${deleted} access powers deleted successfully` });
//     })
//     .catch((error) => {
//       console.error(`Error deleting access powers: ${error}`);
//       res.status(500).json({ message: "Internal server error" });
//     });
// };
