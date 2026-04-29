DO $$
BEGIN
  CREATE TYPE "TransactionCategory" AS ENUM (
    'FOOD',
    'RENT',
    'UTILITIES',
    'GROCERIES',
    'ENTERTAINMENT',
    'SHOPPING',
    'TRAVEL',
    'HEALTHCARE',
    'EDUCATION',
    'SAVINGS',
    'INVESTMENT',
    'TRANSFER',
    'OTHER',
    'LOAN_REPAYMENT',
    'LOAN_DISBURSEMENT',
    'FD_INTEREST'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "FixedDepositStatus" AS ENUM ('ACTIVE', 'MATURED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE TYPE "LoanRepaymentStatus" AS ENUM ('PENDING', 'PAID', 'OVERDUE');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TYPE "LoanStatus" ADD VALUE 'CLOSED';
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "accounts"
  ADD COLUMN "interest_rate" DECIMAL(5,2),
  ADD COLUMN "maturity_date" TIMESTAMP(3),
  ADD COLUMN "fd_principal_amount" DECIMAL(18,2),
  ADD COLUMN "fd_status" "FixedDepositStatus",
  ADD COLUMN "fd_interest_credited_at" TIMESTAMP(3);

ALTER TABLE "transactions"
  ADD COLUMN "category" "TransactionCategory",
  ADD COLUMN "note" VARCHAR(240);

ALTER TABLE "loans"
  ADD COLUMN "emi_amount" DECIMAL(18,2),
  ADD COLUMN "outstanding_balance" DECIMAL(18,2),
  ADD COLUMN "approved_at" TIMESTAMP(3),
  ADD COLUMN "completed_at" TIMESTAMP(3),
  ADD COLUMN "disbursement_account_id" INTEGER;

CREATE TABLE "loan_repayments" (
  "id" SERIAL NOT NULL,
  "loan_id" INTEGER NOT NULL,
  "installment_number" INTEGER NOT NULL,
  "due_date" TIMESTAMP(3) NOT NULL,
  "amount_due" DECIMAL(18,2) NOT NULL,
  "principal_component" DECIMAL(18,2) NOT NULL,
  "interest_component" DECIMAL(18,2) NOT NULL,
  "balance_after" DECIMAL(18,2) NOT NULL,
  "status" "LoanRepaymentStatus" NOT NULL DEFAULT 'PENDING',
  "paid_at" TIMESTAMP(3),
  "payer_account_id" INTEGER,
  "transaction_id" INTEGER,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "loan_repayments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "accounts_user_id_created_at_idx" ON "accounts"("user_id", "created_at");
CREATE INDEX "accounts_type_fd_status_maturity_date_idx" ON "accounts"("type", "fd_status", "maturity_date");
CREATE INDEX "transactions_sender_account_id_created_at_idx" ON "transactions"("sender_account_id", "created_at");
CREATE INDEX "transactions_receiver_account_id_created_at_idx" ON "transactions"("receiver_account_id", "created_at");
CREATE INDEX "transactions_category_created_at_idx" ON "transactions"("category", "created_at");
CREATE INDEX "loans_user_id_status_created_at_idx" ON "loans"("user_id", "status", "created_at");
CREATE UNIQUE INDEX "loan_repayments_loan_id_installment_number_key" ON "loan_repayments"("loan_id", "installment_number");
CREATE UNIQUE INDEX "loan_repayments_transaction_id_key" ON "loan_repayments"("transaction_id");
CREATE INDEX "loan_repayments_loan_id_status_due_date_idx" ON "loan_repayments"("loan_id", "status", "due_date");

ALTER TABLE "loans"
  ADD CONSTRAINT "loans_disbursement_account_id_fkey"
  FOREIGN KEY ("disbursement_account_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_loan_id_fkey"
  FOREIGN KEY ("loan_id") REFERENCES "loans"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_payer_account_id_fkey"
  FOREIGN KEY ("payer_account_id") REFERENCES "accounts"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "loan_repayments"
  ADD CONSTRAINT "loan_repayments_transaction_id_fkey"
  FOREIGN KEY ("transaction_id") REFERENCES "transactions"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
