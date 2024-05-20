const express = require("express");

const admnController = require("../controller/admin");
const authMiddleware = require("../middleware/auth");

const router = express.Router();

router.post("/signup", admnController.signup);
// router.post("/auth/verify", admnController.verifyAccFun);
router.post("/login", admnController.login);
// router.post("/auth/resendverify", admnController.resendVerification);

router.get("/user", [authMiddleware.checkUserAuth], admnController.getUserDetails);
router.post("/user", [authMiddleware.checkUserAuth], admnController.updateUserDetails);
router.post("/update_password", [authMiddleware.checkUserAuth], admnController.resetPassWebsite);

router.post("/forgot_password", admnController.forgotPass);
// router.post("/reset_password_email", admnController.resetPassEmail);

module.exports = router;
