-- prisma/triggers.sql
-- Run ONCE after `prisma migrate dev` to add DB-level constraints.
--
-- ⚠️  IMPORTANT — NO balance-updating trigger here.
--     Balance updates are handled entirely by the Prisma ACID transaction
--     in transaction.controller.js (SELECT FOR UPDATE row-level locking).
--     A DB trigger that also updates balances would DOUBLE every transfer.

-- Drop old triggers/functions if they exist (safe to re-run)
DROP TRIGGER IF EXISTS trg_update_balances ON transactions;
DROP TRIGGER IF EXISTS trg_check_balance   ON transactions;
DROP FUNCTION IF EXISTS update_balances_after_transaction();
DROP FUNCTION IF EXISTS check_balance_before_debit();

-- Constraint: balance must never go negative
ALTER TABLE accounts
  DROP CONSTRAINT IF EXISTS chk_balance_non_negative,
  ADD  CONSTRAINT chk_balance_non_negative CHECK (balance >= 0);

-- Constraint: transaction amount must be positive
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS chk_amount_positive,
  ADD  CONSTRAINT chk_amount_positive CHECK (amount > 0);

-- Constraint: no self-transfer at DB level
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS chk_no_self_transfer,
  ADD  CONSTRAINT chk_no_self_transfer
    CHECK (sender_account_id <> receiver_account_id);

-- Constraint: transaction note length stays bounded
ALTER TABLE transactions
  DROP CONSTRAINT IF EXISTS chk_transaction_note_length,
  ADD  CONSTRAINT chk_transaction_note_length
    CHECK (note IS NULL OR char_length(note) <= 240);

-- Constraint: repayment rows must hold positive money values
ALTER TABLE loan_repayments
  DROP CONSTRAINT IF EXISTS chk_repayment_amount_positive,
  ADD  CONSTRAINT chk_repayment_amount_positive CHECK (amount_due > 0);

ALTER TABLE loan_repayments
  DROP CONSTRAINT IF EXISTS chk_repayment_principal_non_negative,
  ADD  CONSTRAINT chk_repayment_principal_non_negative CHECK (principal_component >= 0);

ALTER TABLE loan_repayments
  DROP CONSTRAINT IF EXISTS chk_repayment_interest_non_negative,
  ADD  CONSTRAINT chk_repayment_interest_non_negative CHECK (interest_component >= 0);
