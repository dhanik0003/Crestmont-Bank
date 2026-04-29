// src/routes/loan.routes.js
const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  applyLoan,
  approveLoan,
  rejectLoan,
  getUserLoans,
  getMyLoans,
  getAllLoans,
  getLoanRepayments,
  payLoanRepayment,
} = require('../controllers/loan.controller');

router.use(authenticate);

router.post('/apply', applyLoan);
router.get('/me', getMyLoans);
router.get('/all', authorize('ADMIN', 'MANAGER', 'EMPLOYEE'), getAllLoans);
router.put('/:id/approve', authorize('ADMIN', 'MANAGER'), approveLoan);
router.put('/:id/reject', authorize('ADMIN', 'MANAGER'), rejectLoan);
router.get('/:id/repayments', getLoanRepayments);
router.post('/:id/repayments/:repaymentId/pay', payLoanRepayment);
router.get('/:userId', getUserLoans);

module.exports = router;
