const express = require("express");
const path = require("path");
const cors = require('cors');

const app = express();

const routes = require("./routes");

const db = require("./models");

const port = process.env.PORT || 3000;

// Allow all origins (you can restrict this to specific origins if needed)
app.use(cors());

// Parse JSON and URL-encoded request bodies
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

// Serve static files
// app.use(express.static(path.join(__dirname, "uploads")));

// Serve static files from the 'uploads' directory
app.use('/uploads', express.static(path.join('uploads')));


// CORS headers are already handled by the cors() middleware

// Routes
app.use("/api", routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send("Something went wrong!");
});

db.sequelize
  .sync({ alter: true })
  .then(async (result) => {
    app.listen(port, () => {
      console.log(`Backend listens to ${port}`);
    });
  })
  .catch((err) => {
    console.log(err.toString());
  });
