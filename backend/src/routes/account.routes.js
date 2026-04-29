const router = require('express').Router();
const { authenticate, authorize } = require('../middleware/auth.middleware');
const {
  createAccount,
  getUserAccounts,
  getMyAccounts,
  getAllAccounts,
  lookupAccountById,
  deleteAccount,
  downloadStatement,
} = require('../controllers/account.controller');

router.use(authenticate);

router.post('/', createAccount);
router.get('/me', getMyAccounts);
router.get('/all', authorize('ADMIN', 'EMPLOYEE', 'MANAGER'), getAllAccounts);
router.get('/:id/statement', downloadStatement);
router.get('/lookup/:accountId', lookupAccountById);
router.delete('/:id', deleteAccount);
router.get('/:userId', getUserAccounts);

module.exports = router;
