const db = require("../models");
const Stream = db.stream;
const { validationResult, check } = require("express-validator");

// Validation rules for Stream
const streamValidationRules = [
  check("stream_name").not().isEmpty().withMessage("Stream name is required"),
  check("stream_description")
    .optional()
    .isString()
    .withMessage("Stream description must be a string"),
  check("updated_by")
    .optional()
    .isInt()
    .withMessage("Updated by must be an integer"),
];

// Get all streams
exports.getAllStreams = async (req, res) => {
  try {
    const streams = await Stream.findAll({
      order: [["created_at", "DESC"]],
    });
    const formattedStreams = streams.map((stream) => ({
      value: stream.id, // Set value to stream's id
      label: stream.stream_name, // Set label to stream's name
    }));

    res.status(200).json({ status: true, data: streams, formattedStreams });
  } catch (error) {
    console.error(`Error retrieving streams: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Get stream by ID
exports.getStreamById = async (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const stream = await Stream.findByPk(id);
    if (!stream) {
      return res
        .status(404)
        .json({ status: false, message: "Stream not found" });
    }
    res.status(200).json({ status: true, data: stream });
  } catch (error) {
    console.error(`Error retrieving stream: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};

// Add a new stream
exports.addStream = [
  // Validation middleware
  ...streamValidationRules,
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    const { stream_name, stream_description, updated_by } = req.body;

    try {
      const newStream = await Stream.create({
        stream_name,
        stream_description,
        updated_by,
      });
      res.status(201).json({
        status: true,
        message: "Stream created successfully",
        data: newStream,
      });
    } catch (error) {
      console.error(`Error creating stream: ${error}`);
      res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
    }
  },
];

// Update a stream
exports.updateStream = [
  // Validation middleware
  ...streamValidationRules,
  async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        status: false,
        message: "Validation failed",
        errors: errors.array(),
      });
    }

    try {
      const stream = await Stream.findByPk(id);
      if (!stream) {
        return res
          .status(404)
          .json({ status: false, message: "Stream not found" });
      }

      // Update only the fields that are provided in the request body
      const updatedStream = await stream.update({
        stream_name: req.body.stream_name ?? stream.stream_name,
        stream_description:
          req.body.stream_description ?? stream.stream_description,
        updated_by: req.body.updated_by ?? stream.updated_by,
      });

      res.status(200).json({
        status: true,
        message: "Stream updated successfully",
        data: updatedStream,
      });
    } catch (error) {
      console.error(`Error updating stream: ${error}`);
      res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
    }
  },
];

// Delete a stream
exports.deleteStream = async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    const stream = await Stream.findByPk(id);
    if (!stream) {
      return res
        .status(404)
        .json({ status: false, message: "Stream not found" });
    }

    await stream.destroy();
    res
      .status(200)
      .json({ status: true, message: "Stream deleted successfully" });
  } catch (error) {
    console.error(`Error deleting stream: ${error}`);
    res.status(500).json({ status: false, message: "An error occurred while processing your request. Please try again later." });
  }
};
