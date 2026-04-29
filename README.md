# Crestmont Bank

A full-stack digital banking platform built with React, Express, Prisma, and PostgreSQL. Designed with production-grade patterns: ACID transactions, role-based access control, fraud detection, audit logging, and a polished glass-morphism UI.

---

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
- [Environment Variables](#environment-variables)
- [Default Credentials](#default-credentials)
- [Role-Based Access Control](#role-based-access-control)
- [API Reference](#api-reference)
- [Database Schema](#database-schema)
- [Business Rules](#business-rules)
- [Security](#security)
- [Scripts](#scripts)
- [Troubleshooting](#troubleshooting)

---

## Features

| Area | Details |
|---|---|
| **Authentication** | JWT-based login and registration, bcrypt password hashing, auto-logout on 401 |
| **Accounts** | Create SAVINGS, CURRENT, and FD accounts with optional initial deposits |
| **Transfers** | ACID-compliant fund transfers with row-level locking and recipient pre-verification |
| **Loans** | Full loan lifecycle — apply, EMI preview, approve/reject, treasury disbursement |
| **Fraud Detection** | Async rule engine — high-value threshold and rapid-transfer velocity checks |
| **Audit Logging** | Immutable log of every significant action, searchable and paginated |
| **Admin Panel** | System-wide user, account, transaction, and alert management |
| **Analytics** | Spending breakdown by category with charts and net cash flow |
| **Profile** | User profile management with KYC status |
| **Security** | Helmet headers, gzip compression, per-IP rate limiting, CORS allowlist |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite 5, Tailwind CSS 3 |
| Backend | Node.js 18+, Express 4 |
| ORM | Prisma 5 |
| Database | PostgreSQL 14+ |
| Auth | JWT (`jsonwebtoken`), `bcryptjs` |
| HTTP Client | Axios |
| Security | `helmet`, `express-rate-limit`, `compression` |

---

## Architecture

```
Browser (React + Vite)
  │
  │  /api/*  (Vite dev proxy → Express)
  ▼
Express API Server
  ├── helmet (security headers)
  ├── compression (gzip)
  ├── rate-limiter (global + auth-specific)
  ├── CORS allowlist
  ├── auth middleware (JWT verify + in-memory user cache)
  ├── validation middleware (express-validator)
  ├── route handlers → controllers
  │     ├── audit.service      (write audit logs)
  │     ├── fraud.service      (async post-transfer checks)
  │     └── loan.service       (EMI calculation)
  └── Prisma ORM → PostgreSQL
```

---

## Project Structure

```
crestmont-bank/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   ├── schema.prisma
│   │   ├── seed.js
│   │   └── triggers.sql
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── account.controller.js
│   │   │   ├── admin.controller.js
│   │   │   ├── alert.controller.js
│   │   │   ├── audit.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── loan.controller.js
│   │   │   └── transaction.controller.js
│   │   ├── lib/
│   │   │   └── prisma.js
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── routes/
│   │   ├── services/
│   │   │   ├── audit.service.js
│   │   │   ├── fixedDeposit.service.js
│   │   │   ├── fraud.service.js
│   │   │   └── loan.service.js
│   │   └── index.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Brand.jsx
    │   │   ├── CountUp.jsx
    │   │   ├── Layout.jsx
    │   │   ├── SidebarDock.jsx
    │   │   ├── SoftAurora.jsx
    │   │   └── ui.jsx
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── ThemeContext.jsx
    │   ├── pages/
    │   │   ├── Accounts.jsx
    │   │   ├── AdminPanel.jsx
    │   │   ├── Alerts.jsx
    │   │   ├── Analytics.jsx
    │   │   ├── AuditLogs.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Landing.jsx
    │   │   ├── Loans.jsx
    │   │   ├── Login.jsx
    │   │   ├── Profile.jsx
    │   │   ├── Register.jsx
    │   │   └── Transfer.jsx
    │   ├── services/
    │   │   └── api.js
    │   ├── App.jsx
    │   ├── index.css
    │   └── main.jsx
    ├── package.json
    └── vite.config.js
```

---

## Prerequisites

- **Node.js** 18 or newer
- **PostgreSQL** 14 or newer
- **npm** 9 or newer
- **psql** CLI (for applying `triggers.sql`) — or use pgAdmin

---

## Getting Started

### Backend Setup

**1. Install dependencies**

```bash
cd backend
npm install
```

**2. Configure environment variables**

```bash
# Windows (PowerShell)
Copy-Item .env.example .env

# macOS / Linux
cp .env.example .env
```

Edit `.env` and set `DATABASE_URL` to point at your PostgreSQL instance.

**3. Run database migrations**

```bash
npx prisma migrate dev --name init
```

This creates all tables, enums, and generates the Prisma client.

**4. Apply database constraints**

```bash
psql -U postgres -d banking_db -f prisma/triggers.sql
```

This adds non-negative balance checks, positive amount constraints, and a no-self-transfer constraint at the database level.

> **Note:** `triggers.sql` intentionally does **not** add a balance-update trigger. Balances are managed in application code inside Prisma transactions to avoid double-application.

**5. Seed roles and default users**

```bash
npm run prisma:seed
```

Seeds the four roles (`CUSTOMER`, `EMPLOYEE`, `MANAGER`, `ADMIN`) and creates default admin and manager accounts.

**6. Start the server**

```bash
npm run dev
```

The API will be available at `http://localhost:5000`.

---

### Frontend Setup

**1. Install dependencies**

```bash
cd frontend
npm install
```

**2. Start the dev server**

```bash
npm run dev
```

The app will be available at `http://localhost:3000`. Vite proxies all `/api/*` requests to the backend automatically — no frontend `.env` file is needed for local development.

---

## Environment Variables

All variables live in `backend/.env`. See `backend/.env.example` for a full annotated template.

| Variable | Default | Purpose |
|---|---|---|
| `DATABASE_URL` | — | Prisma PostgreSQL connection string |
| `JWT_SECRET` | — | Secret used to sign and verify tokens |
| `JWT_EXPIRES_IN` | `24h` | Token lifetime |
| `PORT` | `5000` | Backend server port |
| `NODE_ENV` | `development` | Controls logging verbosity and error detail |
| `ALLOWED_ORIGINS` | `localhost:3000,localhost:5173` | Comma-separated CORS allowlist |
| `FRAUD_AMOUNT_THRESHOLD` | `50000` | High-value transfer alert threshold (₹) |
| `FRAUD_RAPID_TRANSACTION_LIMIT` | `5` | Max transfers before rapid-tx alert fires |
| `FRAUD_RAPID_TRANSACTION_WINDOW_MINUTES` | `10` | Lookback window for rapid-tx rule |
| `FD_MATURITY_SCAN_INTERVAL_MS` | `60000` | How often the FD maturity scheduler runs |

---

## Default Credentials

| Role | Email | Password |
|---|---|---|
| ADMIN | `admin@bank.com` | `admin123` |
| MANAGER | `manager@bank.com` | `manager123` |

Customer accounts are created through the `/register` page.

---

## Role-Based Access Control

| Feature | CUSTOMER | EMPLOYEE | MANAGER | ADMIN |
|---|:---:|:---:|:---:|:---:|
| Register / Login | ✓ | ✓ | ✓ | ✓ |
| Dashboard | ✓ | ✓ | ✓ | ✓ |
| Create / manage own accounts | ✓ | ✓ | ✓ | ✓ |
| Transfer funds | ✓ | ✓ | ✓ | ✓ |
| Apply for loans | ✓ | ✓ | ✓ | ✓ |
| View all loans | — | ✓ | ✓ | ✓ |
| Approve / reject loans | — | — | ✓ | ✓ |
| View fraud alerts | — | ✓ | ✓ | ✓ |
| View audit logs | — | — | ✓ | ✓ |
| Admin panel | — | — | — | ✓ |
| Change user roles | — | — | — | ✓ |

New self-registered users are always assigned the `CUSTOMER` role. Roles can be promoted from the Admin Panel.

---

## API Reference

### Auth
```
POST /auth/register
POST /auth/login
GET  /auth/me
```

### Accounts
```
POST   /accounts
GET    /accounts/me
GET    /accounts/all          (EMPLOYEE+)
GET    /accounts/lookup/:id
GET    /accounts/:userId
DELETE /accounts/:id
```

### Transactions
```
POST /transactions/transfer
GET  /transactions/:accountId
GET  /transactions/all        (EMPLOYEE+)
```

### Loans
```
POST /loans/apply
GET  /loans/me
GET  /loans/all               (EMPLOYEE+)
GET  /loans/:userId
PUT  /loans/:id/approve       (MANAGER+)
PUT  /loans/:id/reject        (MANAGER+)
```

### Alerts
```
GET /alerts                   (EMPLOYEE+)
```

### Audit
```
GET /audit                    (MANAGER+)
GET /audit?userId=:id         (MANAGER+)
```

### Admin
```
GET /admin/users              (ADMIN)
PUT /admin/users/:id/role     (ADMIN)
```

### Health
```
GET /health
```

---

## Database Schema

| Model | Key Fields |
|---|---|
| `Role` | `id`, `name` |
| `User` | `id`, `name`, `email`, `passwordHash`, `roleId`, `createdAt` |
| `Account` | `id`, `userId`, `type` (SAVINGS/CURRENT/FD), `balance`, `createdAt` |
| `Transaction` | `id`, `senderAccountId`, `receiverAccountId`, `amount`, `status`, `category`, `note`, `createdAt` |
| `Loan` | `id`, `userId`, `amount`, `interestRate`, `tenureMonths`, `status`, `createdAt` |
| `Alert` | `id`, `transactionId`, `reason`, `createdAt` |
| `AuditLog` | `id`, `userId`, `action`, `timestamp` |

**Enums:**
- `AccountType`: `SAVINGS`, `CURRENT`, `FD`
- `TransactionStatus`: `PENDING`, `SUCCESS`, `FAILED`
- `LoanStatus`: `PENDING`, `APPROVED`, `REJECTED`

---

## Business Rules

### Transfers
- Amount must be greater than zero
- Sender and receiver accounts must be different
- Customers can only transfer from their own accounts
- Balance is checked before and inside the transaction (with `SELECT ... FOR UPDATE` row lock)
- Failed transfers are recorded with `FAILED` status for auditability

### Loan Approval
- Only `PENDING` loans can be approved or rejected
- Only `MANAGER` and `ADMIN` roles can approve or reject
- Borrower must have at least one account to receive funds
- Disbursement account preference: `SAVINGS` → `CURRENT` → oldest account
- Approval creates a real transaction from the treasury account, visible in transaction history

### Fraud Detection
Fraud checks run **asynchronously** after a successful transfer and never block the response:

1. **High-value threshold** — flags any single transfer above `FRAUD_AMOUNT_THRESHOLD`
2. **Rapid transactions** — flags when a sender account exceeds `FRAUD_RAPID_TRANSACTION_LIMIT` successful transfers within `FRAUD_RAPID_TRANSACTION_WINDOW_MINUTES`

---

## Security

| Measure | Implementation |
|---|---|
| Security headers | `helmet` (XSS, clickjacking, MIME sniffing protection) |
| Response compression | `compression` (gzip) |
| Rate limiting | 200 req / 15 min globally; 20 req / 15 min on auth endpoints |
| CORS | Explicit origin allowlist via `ALLOWED_ORIGINS` env var |
| Auth caching | In-memory user cache (5 min TTL) reduces DB load on every request |
| Cache invalidation | Role changes immediately bust the user cache |
| Password hashing | `bcryptjs` with cost factor 12 |
| Token expiry | Configurable via `JWT_EXPIRES_IN` |
| Input validation | `express-validator` on all mutation endpoints |
| DB constraints | Non-negative balances, positive amounts, no self-transfers enforced at DB level |
| Body size limit | `express.json({ limit: '50kb' })` |

---

## Scripts

### Backend

```bash
npm run dev            # Start with nodemon (hot reload)
npm start              # Start without hot reload
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Run pending migrations
npm run prisma:seed      # Seed roles and default users
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Production build
npm run preview  # Preview production build locally
```

---

## Troubleshooting

**"Roles not seeded" error on register**
```bash
cd backend && npm run prisma:seed
```

**Loan approval fails — "no account available"**

The borrower must have at least one bank account before a loan can be approved. Create an account for that user first.

**Fraud rules not triggering at expected thresholds**

Check `FRAUD_AMOUNT_THRESHOLD`, `FRAUD_RAPID_TRANSACTION_LIMIT`, and `FRAUD_RAPID_TRANSACTION_WINDOW_MINUTES` in your `.env`.

**Frontend cannot reach the backend**

- Confirm the backend is running on port `5000`
- Confirm the frontend is running on port `3000`
- Check the Vite proxy config in `frontend/vite.config.js`

**`psql` command not found**

Run the contents of `backend/prisma/triggers.sql` manually using pgAdmin or any other PostgreSQL client.

**CORS errors in production**

Set `ALLOWED_ORIGINS` in your backend `.env` to the exact origin of your deployed frontend (e.g. `https://app.crestmont.bank`).
