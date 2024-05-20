const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const db = require("../models");
const { error } = require("console");

exports.signup = async (req, res, next) => {
  try {
    const userEmail = req.body.email;
    const username = req.body.username;
    const mobile = req.body.mobile;
    const password = bcrypt.hashSync(req.body.password + process.env.SECRET);

    const [user, created] = await db.user.findOrCreate({
      where: { email: userEmail },
      defaults: { username: username, email: userEmail, password: password, mobile: mobile },
    });

    if (!created) {
      console.log("User found:", user.username);
      res.status(409).send({
        message: "user already exist",
      });
    }
  } catch (error) {
    console.error(`error in adding new user ${error.toString()}`);
    res.status(500).send({ message: error.toString() });
  }
};

exports.login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const secret = process.env.SECRET;

    const userDB = await db.user.findOne({
      where: {
        email: email,
      },
    });

    if (!userDB) {
      let err = new Error("User Not found. ");
      err.code = 500;
      throw err;
    }

    console.log(secret);
    const passwordIsValid = await bcrypt.compareSync(password + secret, userDB.password);

    const timestamp = Date.now();
    const date = new Date(timestamp);

    if (!passwordIsValid) {
      console.error(`user ${userDB.username} loged in faild at ${date}`);
      let err = new Error("Invalid Password!");
      err.code = 401;
      throw err;
    }

    const token = jwt.sign({ id: userDB.id }, secret, { expiresIn: "90d" });

    console.log(`user ${userDB.username} loged in successfully at ${date}`);
    res.status(200).send({
      accessToken: token,
      message: "login successfully",
    });
  } catch (error) {
    if (error.code == undefined) error.code = 500;
    if (error.code == 402) {
      res.status(error.code).send({ message: error.toString(), verified: false });
    } else {
      console.error(`error in login ${error.toString()}`);
      res.status(error.code).send({ message: error.toString() });
    }
  }
};

exports.getUserDetails = (req, res, next) => {
  db.user
    .findByPk(req.userDecodeId, {
      attributes: ["id", "username", "email", "mobile", "bio"],
    })
    .then((userDB) => {
      if (userDB == null) throw new Error("user not found");
      res.status(200).send(userDB);
    })
    .catch((error) => {
      console.log(`error in getting user ${error.toString()}`);
      res.status(200).send({ message: error.toString() });
    });
};

exports.updateUserDetails = async (req, res, next) => {
  const mobile = req.body.mobile;
  const bio = req.body.bio;
  const username = req.body.username;

  const userDB = await db.user.findByPk(req.userDecodeId, {
    attributes: ["id", "username", "email", "mobile", "bio"],
  });

  if (userDB !== null) {
    userDB.username = username;
    userDB.bio = bio;
    userDB.mobile = mobile;
    await userDB.save();
    res.status(200).send({ message: "user updated successfully" });
  } else {
    console.log(`error in getting user ${error.toString()}`);
    res.status(200).send({ message: error.toString() });
  }
};

exports.resetPassWebsite = async (req, res, next) => {
  try {
    const oldPassword = req.body.oldpassword;
    const newPasswordReq = req.body.newpassword;
    const secret = process.env.SECRET;
    const userId = req.userDecodeId;

    const userDB = await db.user.findByPk(userId);

    if (!userDB) {
      let err = new Error("User Not found. ");
      err.code = 404;
      throw err;
    }

    const passwordIsValid = await bcrypt.compareSync(oldPassword + secret, userDB.password);

    const timestamp = Date.now();
    const date = new Date(timestamp);

    if (!passwordIsValid) {
      console.error(`user ${userDB.username} update password faild at ${date}`);
      let err = new Error("Invalid Password!");
      err.code = 401;
      throw err;
    }

    const new_password = bcrypt.hashSync(newPasswordReq + secret);
    userDB.password = new_password;
    await userDB.save();
    res.status(200).send({ message: "password updated successfully" });
  } catch (error) {
    if (error.code == undefined) error.code = 500;
    console.error(`error in login ${error.toString()}`);
    res.status(error.code).send({ message: error.toString() });
  }
};