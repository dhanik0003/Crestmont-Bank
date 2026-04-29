// src/routes/admin.routes.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getAllUsers, updateUserRole } = require('../controllers/admin.controller');

router.use(authenticate, authorize('ADMIN'));

router.get('/users', getAllUsers);
router.put('/users/:userId/role', updateUserRole);

module.exports = router;
