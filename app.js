const express = require("express");
const path = require("path");

const app = express();

const adminRoute = require("./routes/admin");
const db = require("./models");

const port = process.env.PORT;

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, Content-Type, Authorization, x-access-token, , X-localization"
  );
  next();
});

app.use("/admin", adminRoute);

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
