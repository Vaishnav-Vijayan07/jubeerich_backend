const csvParser = require("csv-parser"); // to parse CSV files
const fs = require("fs");
const stream = require("stream");
const db = require("../models");
const bcrypt = require("bcryptjs");

// Set up multer for file upload

exports.importAdminUsers = (req, res) => {
  // Check if a file is uploaded
  if (!req.file) {
    return res.status(400).json({ status: false, message: "No file uploaded" });
  }

  const users = [];

  try {
    // Create a readable stream from the buffer
    const bufferStream = new stream.PassThrough();
    bufferStream.end(req.file.buffer);

    // Pipe the buffer stream to the CSV parser
    bufferStream
      .pipe(csvParser())
      .on("data", (row) => {
        users.push(row);
      })
      .on("end", async () => {
        try {
          // Process the users data after CSV parsing
          await processAdminUsers(users, res);
        } catch (error) {
          console.error("Error processing admin users:", error);
          return res.status(500).json({ status: false, message: "Error processing data" });
        }
      })
      .on("error", (error) => {
        console.error("Error reading the CSV file:", error);
        return res.status(500).json({ status: false, message: "Error reading the CSV file" });
      });
  } catch (error) {
    console.error("File processing error:", error);
    return res.status(500).json({ status: false, message: "Error processing file" });
  }
};

async function processAdminUsers(users, res) {
  const transaction = await db.sequelize.transaction();

  try {
    const conflicts = [];

    for (const user of users) {
      const { "Employee ID": employee_id, Name: name, Email: email, Phone: phone, Username: username, Password: password, "Role Id": role_id } = user;

      // Check for conflicts (existing records)
      const existingEmployee = await db.adminUsers.findOne({ where: { employee_id }, transaction });
      if (existingEmployee) conflicts.push(`Employee ID ${employee_id} already exists`);

      const existingEmail = await db.adminUsers.findOne({ where: { email }, transaction });
      if (existingEmail) conflicts.push(`Email ${email} already exists`);

      const existingPhone = await db.adminUsers.findOne({ where: { phone }, transaction });
      if (existingPhone) conflicts.push(`Phone ${phone} already exists`);

      const existingUsername = await db.adminUsers.findOne({ where: { username }, transaction });
      if (existingUsername) conflicts.push(`Username ${username} already exists`);

      if (conflicts.length > 0) {
        await transaction.rollback();
        return res.status(409).json({ status: false, message: conflicts.join(", ") });
      }

      // Hash password and create user record
      const hashedPassword = bcrypt.hashSync(password + process.env.SECRET);

      const newUser = await db.adminUsers.create(
        {
          employee_id,
          name,
          email,
          phone,
          username,
          password: hashedPassword,
          role_id,
        },
        { transaction }
      );

      // Handle additional associations (if needed, like countries or franchises)
      // Example: await newUser.addCountries(user.country_ids, { transaction });
    }

    // Commit the transaction if no errors
    await transaction.commit();
    return res.json({ status: true, message: "Admin users imported successfully" });
  } catch (error) {
    await transaction.rollback();
    console.error("Error importing admin users:", error);
    return res.status(500).json({ status: false, message: "Internal server error" });
  }
}
