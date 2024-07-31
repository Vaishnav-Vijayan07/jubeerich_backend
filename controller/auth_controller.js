const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../models");
const AdminUsers = db.adminUsers;
const AccessRoles = db.accessRoles;
const AccessPowers = db.accessPowers;
const Branches = db.branches;

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log("req.body", req.body);
    const secret = process.env.SECRET;

    const user = await AdminUsers.findOne({
      where: { 
        [Op.or]: [
          { username: username },
          { email: username }
        ]
       },
      include: [
        {
          model: AccessRoles,
          as: "access_role",
          include: [
            {
              model: AccessPowers,
              as: "powers",
              through: { attributes: [] },
            },
          ],
        },
        //   {
        //     model: Branches,
        //     as: "branches",
        //     through: { attributes: [] },
        //   },
      ],
    });

    if (!user || !bcrypt.compareSync(password + secret, user.password)) {
      return res.status(401).json({
        status: false,
        message: "Invalid username or password",
      });
    }

    // Ensure power_ids is always an array of numbers
    const powerIds = user?.access_role?.power_ids ? user?.access_role?.power_ids?.split(",").map(Number) : [];

    const powers = await AccessPowers.findAll({
      where: { id: powerIds },
      attributes: ["power_name"],
    });

    const powerNames = powers?.map((power) => power?.power_name);

    const token = jwt.sign({ userId: user.id }, secret || "mysecretkey", { expiresIn: "24h" });
    console.log("token", token);

    res.status(200).json({
      status: true,
      token: token,
      user_id: user?.id,
      user_name: user?.username,
      name: user?.name,
      avatar: user?.profile_image_path,
      role: user?.role_id,
      role_name: user?.access_role?.role_name,
      power_names: powerNames,
      //   branches: user.branches.map((branch) => ({
      //     id: branch.id,
      //     branch_name: branch.branch_name,
      //     branch_address: branch.branch_address,
      //     branch_city: branch.branch_city,
      //     branch_country: branch.branch_country,
      //     currency: branch.currency,
      //   })),
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: false, message: "Internal server error" });
  }
};
