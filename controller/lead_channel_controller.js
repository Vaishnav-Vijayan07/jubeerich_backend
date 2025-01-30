const db = require("../models");
const Channel = db.leadChannel;

async function generateUniqueSlug(name) {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_+|_+$)/g, "")
    .toUpperCase();

  let uniqueSlug = baseSlug;
  let counter = 1;

  while (await Channel.findOne({ where: { slug: uniqueSlug } })) {
    uniqueSlug = `${baseSlug}_${counter}`;
    counter++;
  }

  return uniqueSlug;
}

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
    order: [["createdAt", "DESC"]],
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
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
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
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};

// Add a new channel
exports.addChannel = async (req, res) => {
  const { source_id, channel_name, channel_description, updated_by } = req.body;
  const userId = req.userDecodeId;

  try {
    // Generate the slug
    const slug = await generateUniqueSlug(channel_name);

    // Create the channel
    const newChannel = await Channel.create(
      {
        source_id,
        channel_name,
        channel_description,
        updated_by,
        slug, // Add slug here
      },
      { userId }
    );

    res.status(201).json({
      status: true,
      message: "Channel created successfully",
      data: newChannel,
    });
  } catch (error) {
    console.error(`Error creating channel: ${error}`);
    res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
  }
};

// Update a channel
exports.updateChannel = (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;
  const { source_id, channel_name, channel_description, updated_by } = req.body;

  Channel.findByPk(id)
    .then(async (channel) => {
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Update fields
      const updatedData = {
        source_id,
        channel_description,
        updated_by,
      };

      // Only update the slug if the channel name has changed
      if (channel_name && channel_name !== channel.channel_name) {
        updatedData.channel_name = channel_name;
        updatedData.slug = await generateUniqueSlug(channel_name);
      } else {
        updatedData.channel_name = channel_name || channel.channel_name;
      }

      channel
        .update(updatedData, { userId })
        .then((updatedChannel) => {
          res.status(200).json({
            message: "Channel updated successfully",
            data: updatedChannel,
          });
        })
        .catch((error) => {
          console.error(`Error updating channel: ${error}`);
          res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving channel: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};

// Delete a channel
exports.deleteChannel = (req, res) => {
  const id = parseInt(req.params.id);
  const userId = req.userDecodeId;

  Channel.findByPk(id)
    .then((channel) => {
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      channel
        .destroy({ userId })
        .then(() => {
          res.status(200).json({ message: "Channel deleted successfully" });
        })
        .catch((error) => {
          console.error(`Error deleting channel: ${error}`);
          res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
        });
    })
    .catch((error) => {
      console.error(`Error retrieving channel: ${error}`);
      res.status(500).json({ message: "An error occurred while processing your request. Please try again later." });
    });
};
