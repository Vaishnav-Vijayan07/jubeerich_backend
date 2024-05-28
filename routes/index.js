const express = require("express");

const admnController = require("../controller/admin");
const authMiddleware = require("../middleware/auth");
const { getAllAdminUsers, getAdminUsersById, addAdminUsers, updateAdminUsers, deleteAdminUsers } = require("../controller/admin_user_controller");
const { getAllAccessPowers, getAccessPowerById, addAccessPower, updateAccessPower, deleteAccessPower } = require("../controller/access_power_controller");
const { getAllAccessRoles, getAccessRoleById, createAccessRole, updateAccessRole, deleteAccessRole } = require("../controller/access_roles_controller");
const { login } = require("../controller/auth_controller");

const router = express.Router();

router.post('/login', login)

router.get('/admin_users', getAllAdminUsers)
router.get('/admin_users/:id', getAdminUsersById)
router.post('/admin_users', addAdminUsers)
router.put('/admin_users/:id', updateAdminUsers)
router.delete('/admin_users/:id', deleteAdminUsers)

router.get('/access_powers', getAllAccessPowers)
router.get('/access_powers/:id', getAccessPowerById)
router.post('/access_powers', addAccessPower)
router.put('/access_powers/:id', updateAccessPower)
router.delete('/access_powers/:id', deleteAccessPower)

router.get('/access_roles', getAllAccessRoles)
router.get('/access_roles/:id', getAccessRoleById)
router.post('/access_roles', createAccessRole)
router.put('/access_roles/:id', updateAccessRole)
router.delete('/access_roles/:id', deleteAccessRole)



module.exports = router;
