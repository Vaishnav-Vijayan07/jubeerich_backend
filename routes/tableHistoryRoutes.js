const express = require("express");
const authMiddleware = require("../middleware/auth");
const { getCountryHistory } = require("../controller/country_controller");

const router = express.Router();

// routes
router.get("/country", [authMiddleware.checkUserAuth], getCountryHistory);

module.exports = router;
