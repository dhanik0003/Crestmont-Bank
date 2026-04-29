// src/routes/alert.routes.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getAlerts } = require('../controllers/alert.controller');

router.get('/', authenticate, authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getAlerts);

module.exports = router;
