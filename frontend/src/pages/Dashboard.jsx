import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { accountAPI, loanAPI, transactionAPI } from '../services/api';
import {
  AccountIDChip,
  AccountTypeBadge,
  Amount,
  SkeletonRows,
  StatusBadge,
  TransactionCategoryBadge,
} from '../components/ui';
import CountUp from '../components/CountUp';

const StatCard = ({ label, value, sub, color = '#60a5fa', delay = 0 }) => (
  <div className="glass p-4 sm:p-5 animate-slide-up" style={{ animationDelay: `${delay}ms` }}>
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
      {label}
    </p>
    <p
      className="text-2xl font-bold tabular-nums"
      style={{ color, fontFamily: "'IBM Plex Mono', monospace", fontVariantNumeric: 'tabular-nums slashed-zero' }}
    >
      {value}
    </p>
    {sub ? (
      <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
        {sub}
      </p>
    ) : null}
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [accountResponse, loanResponse] = await Promise.all([accountAPI.getMyAccounts(), loanAPI.getMyLoans()]);
        setAccounts(accountResponse.data);
        setLoans(loanResponse.data);

        if (accountResponse.data.length > 0) {
          const transactionResponse = await transactionAPI.getByAccount(accountResponse.data[0].id);
          setTransactions(transactionResponse.data.slice(0, 5));
        }
      } catch {
        setTransactions([]);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const totalBalance = useMemo(
    () => Number(accounts.reduce((sum, account) => sum + Number(account.balance), 0).toFixed(2)),
    [accounts]
  );
  const activeLoans = loans.filter((loan) => loan.status === 'APPROVED').length;
  const overdueLoans = loans.filter((loan) => loan.overdueCount > 0).length;

  return (
    <div>
      <div className="mb-8 animate-slide-up">
        <p className="mb-1 text-sm" style={{ color: 'var(--text-muted)' }}>
          Good day,
        </p>
        <h1 className="page-title">{user?.name}</h1>
        <p className="mt-1.5 text-xs" style={{ color: 'var(--text-muted)', fontFamily: "'IBM Plex Mono', monospace" }}>
          {user?.email}
        </p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Balance"
          value={
            <>
              <span>Rs </span>
              <CountUp to={totalBalance} separator="," duration={1.5} />
            </>
          }
          sub={`${accounts.length} account${accounts.length !== 1 ? 's' : ''}`}
          color="#34d399"
          delay={0}
        />
        <StatCard label="Accounts" value={<CountUp to={accounts.length} duration={1.1} />} sub="active" color="#60a5fa" delay={60} />
        <StatCard
          label="Active Loans"
          value={<CountUp to={activeLoans} duration={1.1} />}
          sub={`${overdueLoans} overdue`}
          color="#fbbf24"
          delay={120}
        />
        <StatCard
          label="Transactions"
          value={<CountUp to={transactions.length} duration={1.1} />}
          sub="recently viewed"
          color="#a78bfa"
          delay={180}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass p-5 md:p-6 animate-slide-up" style={{ animationDelay: '240ms' }}>
          <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Your Accounts
            </h2>
            <Link to="/accounts" className="text-xs font-medium hover:underline" style={{ color: '#60a5fa' }}>
              View all
            </Link>
          </div>

          {loading ? (
            <SkeletonRows rows={3} />
          ) : accounts.length === 0 ? (
            <div className="py-8 text-center">
              <p className="mb-3 text-sm" style={{ color: 'var(--text-muted)' }}>
                No accounts yet
              </p>
              <Link to="/accounts" className="btn btn-primary w-full px-4 py-2 text-xs sm:w-auto">
                Open an account
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex flex-col items-start gap-3 rounded-xl p-3 sm:flex-row sm:items-center sm:justify-between"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
                >
                  <div className="flex flex-wrap items-center gap-2.5">
                    <AccountIDChip id={account.id} />
                    <AccountTypeBadge type={account.type} />
                    {account.type === 'FD' && account.fdStatus ? <StatusBadge status={account.fdStatus} /> : null}
                  </div>
                  <Amount value={account.balance} className="self-start text-sm font-semibold sm:self-auto" style={{ color: 'var(--text-primary)' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="glass p-5 md:p-6 animate-slide-up" style={{ animationDelay: '300ms' }}>
          <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent Transactions
            </h2>
            <Link to="/analytics" className="text-xs font-medium hover:underline" style={{ color: '#60a5fa' }}>
              Analytics
            </Link>
          </div>

          {loading ? (
            <SkeletonRows rows={3} />
          ) : transactions.length === 0 ? (
            <div className="py-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
              No transactions yet
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => {
                const referenceAccount = accounts[0]?.id;
                const isSender = transaction.senderAccountId === referenceAccount;

                return (
                <div
                  key={transaction.id}
                  className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
                >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
                          {isSender ? `To #${transaction.receiverAccountId}` : `From #${transaction.senderAccountId}`}
                        </p>
                        <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                          {new Date(transaction.createdAt).toLocaleDateString()}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <TransactionCategoryBadge category={transaction.category} />
                          {transaction.note ? (
                            <span className="break-words text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {transaction.note}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="text-left sm:text-right">
                        <p
                          className="text-sm font-semibold"
                          style={{
                            color: isSender ? '#f87171' : '#34d399',
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          {isSender ? '-' : '+'}<Amount value={transaction.amount} />
                        </p>
                        <div className="mt-2">
                          <StatusBadge status={transaction.status} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 animate-slide-up" style={{ animationDelay: '360ms' }}>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Quick Actions
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Open Account', to: '/accounts', icon: '[]', color: '#60a5fa' },
            { label: 'Transfer', to: '/transfer', icon: '<>', color: '#34d399' },
            { label: 'Analytics', to: '/analytics', icon: '::', color: '#fbbf24' },
            ...(user?.role !== 'CUSTOMER'
              ? [{ label: 'Alerts', to: '/alerts', icon: '!!', color: '#f87171' }]
              : [{ label: 'Loans', to: '/loans', icon: 'oo', color: '#a78bfa' }]),
          ].map((entry) => (
            <Link
              key={`${entry.to}-${entry.label}`}
              to={entry.to}
              className="glass-sm flex items-center justify-between gap-3 p-4 transition-all duration-200 hover:scale-[1.02]"
              style={{ textDecoration: 'none' }}
            >
              <span className="flex items-center gap-3">
                <span className="text-xl" style={{ color: entry.color }}>
                  {entry.icon}
                </span>
                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  {entry.label}
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
