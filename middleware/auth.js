const jwt = require("jsonwebtoken");

exports.checkUserAuth = (req, res, next) => {
  let token = req.header("X-Access-Token");
  const secret = process.env.SECRET;

  if (!token) {
    return res.status(401).send({
      authentication: false,
      message: "No token provided!",
    });
  }

  jwt.verify(token, secret, (err, decoded) => {
    if (err) {
      console.error(`error in verifying ${err.toString()}`);
      return res.status(401).send({
        authentication: false,
        message: err.toString(),
      });
    }


    console.log(decoded);
    

    if (!decoded) {
      return res.status(401).send({
        authentication: false,
        message: "Unauthorized!",
      });
    }

    req.userDecodeId = decoded.userId;
    req.role_name = decoded.role_name;
    req.role_id = decoded.role_id;
    req.token = token;
    next();
  });
};
