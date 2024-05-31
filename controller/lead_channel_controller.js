const db = require("../models");
const Channel = db.leadChannel;

// Get all channels
exports.getAllChannels = (req, res) => {
  Channel.findAll({
    include: [
      {
        model: db.leadSource,
        as: "source",
        attributes: ["source_name"],
      },
    ],
  })
    .then((channels) => {
      const transformedChannels = channels.map((channel) => {
        const channelData = channel.get({ plain: true });
        return {
          ...channelData,
          source_name: channelData.source ? channelData.source.source_name : null,
          source: undefined, // Remove the nested source object
        };
      });
      res.status(200).json(transformedChannels);
    })
    .catch((error) => {
      console.error(`Error retrieving channels: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Get channel by ID
exports.getChannelById = (req, res) => {
  const id = parseInt(req.params.id);
  Channel.findByPk(id, {
    include: [
      {
        model: db.leadSource,
        as: "source",
        attributes: ["source_name"],
      },
    ],
  })
    .then((channel) => {
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }
      const channelData = channel.get({ plain: true });
      const result = {
        ...channelData,
        source_name: channelData.source ? channelData.source.source_name : null,
        source: undefined, // Remove the nested source object
      };
      res.status(200).json(result);
    })
    .catch((error) => {
      console.error(`Error retrieving channel: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Add a new channel
exports.addChannel = (req, res) => {
  const { source_id, channel_name, channel_description, updated_by } = req.body;

  Channel.create({
    source_id,
    channel_name,
    channel_description,
    updated_by,
  })
    .then((newChannel) => {
      res.status(201).json({
        status: true,
        message: "Channel created successfully",
        data: newChannel,
      });
    })
    .catch((error) => {
      console.error(`Error creating channel: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Update a channel
exports.updateChannel = (req, res) => {
  const id = parseInt(req.params.id);
  const { source_id, channel_name, channel_description, updated_by } = req.body;

  Channel.findByPk(id)
    .then((channel) => {
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      channel
        .update({
          source_id,
          channel_name,
          channel_description,
          updated_by,
        })
        .then((updatedChannel) => {
          res.status(200).json({
            message: "Channel updated successfully",
            data: updatedChannel,
          });
        })
        .catch((error) => {
          console.error(`Error updating channel: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving channel: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};

// Delete a channel
exports.deleteChannel = (req, res) => {
  const id = parseInt(req.params.id);

  Channel.findByPk(id)
    .then((channel) => {
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      channel
        .destroy()
        .then(() => {
          res.status(200).json({ message: "Channel deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting channel: ${error}`);
          res.status(500).json({ message: "Internal server error" });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving channel: ${error}`);
      res.status(500).json({ message: "Internal server error" });
    });
};
