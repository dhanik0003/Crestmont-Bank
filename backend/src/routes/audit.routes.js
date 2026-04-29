// src/routes/audit.routes.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const { getAuditLogs } = require('../controllers/audit.controller');

router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), getAuditLogs);

module.exports = router;
