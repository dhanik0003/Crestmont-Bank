// src/routes/transaction.routes.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  transfer,
  getTransactionsByAccount,
  getAllTransactions,
  getMyAnalytics,
} = require('../controllers/transaction.controller');

router.use(authenticate);

router.post('/transfer', transfer);
router.get('/analytics', getMyAnalytics);
router.get('/all', authorize('ADMIN', 'EMPLOYEE', 'MANAGER'), getAllTransactions);
router.get('/:accountId', getTransactionsByAccount);

module.exports = router;
