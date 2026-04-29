import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { accountAPI, loanAPI } from '../services/api';
import {
  AccountIDChip,
  Amount,
  Empty,
  SectionHeader,
  SkeletonRows,
  Spinner,
  StatusBadge,
  Toast,
} from '../components/ui';

const calcEMI = (principal, annualRate, tenureMonths) => {
  if (!principal || !annualRate || !tenureMonths) {
    return 0;
  }

  const monthlyRate = annualRate / 12 / 100;
  if (monthlyRate === 0) {
    return principal / tenureMonths;
  }

  return (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1);
};

export default function Loans() {
  const { user } = useAuth();
  const isStaff = ['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(user?.role);
  const canApprove = ['ADMIN', 'MANAGER'].includes(user?.role);

  const [loans, setLoans] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [expandedLoanId, setExpandedLoanId] = useState(null);
  const [repaymentSchedules, setRepaymentSchedules] = useState({});
  const [loadingScheduleId, setLoadingScheduleId] = useState(null);
  const [payingInstallmentKey, setPayingInstallmentKey] = useState('');
  const [paymentAccountByLoan, setPaymentAccountByLoan] = useState({});
  const [form, setForm] = useState({ amount: '', interestRate: '10', tenureMonths: '12' });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const loadLoans = async () => {
    setLoading(true);

    try {
      const response = isStaff ? await loanAPI.getAllLoans() : await loanAPI.getMyLoans();
      setLoans(response.data);
    } catch {
      showToast('Failed to load loans', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadAccounts = async () => {
    if (isStaff) {
      return;
    }

    try {
      const response = await accountAPI.getMyAccounts();
      setAccounts(response.data);
      setPaymentAccountByLoan((current) => {
        if (Object.keys(current).length > 0 || response.data.length === 0) {
          return current;
        }

        return {};
      });
    } catch {
      showToast('Unable to load payment accounts.', 'error');
    }
  };

  useEffect(() => {
    void loadLoans();
    void loadAccounts();
  }, []);

  const applyLoan = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      await loanAPI.apply({
        amount: form.amount,
        interestRate: form.interestRate,
        tenureMonths: form.tenureMonths,
      });
      showToast('Loan application submitted.', 'success');
      setShowForm(false);
      setForm({ amount: '', interestRate: '10', tenureMonths: '12' });
      await loadLoans();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to apply for a loan', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAction = async (id, action) => {
    try {
      const response = action === 'approve' ? await loanAPI.approve(id) : await loanAPI.reject(id);
      showToast(response.data?.message || `Loan ${action}d`, 'success');
      await loadLoans();
    } catch (err) {
      showToast(err.response?.data?.error || `Failed to ${action} loan`, 'error');
    }
  };

  const loadRepaymentSchedule = async (loanId) => {
    setLoadingScheduleId(loanId);

    try {
      const response = await loanAPI.getRepayments(loanId);
      setRepaymentSchedules((current) => ({
        ...current,
        [loanId]: response.data,
      }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to load repayment schedule', 'error');
    } finally {
      setLoadingScheduleId(null);
    }
  };

  const toggleExpand = async (loanId) => {
    const nextValue = expandedLoanId === loanId ? null : loanId;
    setExpandedLoanId(nextValue);

    if (nextValue && !repaymentSchedules[loanId]) {
      await loadRepaymentSchedule(loanId);
    }
  };

  const payInstallment = async (loanId, repaymentId) => {
    const selectedPayerAccount = paymentAccountByLoan[loanId] || accounts[0]?.id;

    if (!selectedPayerAccount) {
      showToast('Select a payment account first.', 'warn');
      return;
    }

    const key = `${loanId}:${repaymentId}`;
    setPayingInstallmentKey(key);

    try {
      const response = await loanAPI.payRepayment(loanId, repaymentId, selectedPayerAccount);
      showToast(response.data?.message || 'Installment paid successfully.', 'success');
      await Promise.all([loadLoans(), loadRepaymentSchedule(loanId), loadAccounts()]);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to pay installment', 'error');
    } finally {
      setPayingInstallmentKey('');
    }
  };

  const emiPreview = calcEMI(
    Number.parseFloat(form.amount || '0'),
    Number.parseFloat(form.interestRate || '0'),
    Number.parseInt(form.tenureMonths || '0', 10)
  );
  const totalPayment = emiPreview * Number.parseInt(form.tenureMonths || '0', 10);
  const loanStats = useMemo(
    () => ({
      pending: loans.filter((loan) => loan.status === 'PENDING').length,
      active: loans.filter((loan) => loan.status === 'APPROVED').length,
      overdue: loans.filter((loan) => loan.overdueCount > 0).length,
      closed: loans.filter((loan) => loan.status === 'CLOSED').length,
    }),
    [loans]
  );

  return (
    <div>
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      <SectionHeader
        title="Loans"
        subtitle={isStaff ? 'Review applications, monitor overdue accounts, and inspect repayment schedules.' : 'Apply for loans and manage every EMI from your own accounts.'}
        action={
          !isStaff ? (
            <button type="button" onClick={() => setShowForm((current) => !current)} className="btn btn-primary text-sm">
              {showForm ? 'Cancel' : '+ Apply for Loan'}
            </button>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Pending', value: loanStats.pending, tone: '#ffe3a3' },
          { label: 'Active', value: loanStats.active, tone: '#c9ffec' },
          { label: 'Overdue', value: loanStats.overdue, tone: '#ffd1d1' },
          { label: 'Closed', value: loanStats.closed, tone: '#d8deff' },
        ].map((entry) => (
          <div key={entry.label} className="glass p-5">
            <p className="label mb-2">{entry.label}</p>
            <p className="text-2xl font-semibold" style={{ color: entry.tone, fontFamily: "'IBM Plex Mono', monospace" }}>
              {entry.value}
            </p>
          </div>
        ))}
      </div>

      {showForm ? (
        <div className="glass mb-6 p-5 md:p-6 animate-slide-up">
          <h3 className="mb-5 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Loan Application
          </h3>

          <div className="grid gap-6 lg:grid-cols-2">
            <form onSubmit={applyLoan} className="space-y-4">
              <div>
                <label className="label">Loan Amount (Rs)</label>
                <input
                  type="number"
                  min="1000"
                  step="0.01"
                  className="input"
                  placeholder="e.g. 100000"
                  value={form.amount}
                  onChange={(event) => setForm((current) => ({ ...current, amount: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Annual Interest Rate (%)</label>
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.01"
                  className="input"
                  placeholder="e.g. 10"
                  value={form.interestRate}
                  onChange={(event) => setForm((current) => ({ ...current, interestRate: event.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="label">Tenure (months)</label>
                <input
                  type="number"
                  min="1"
                  max="360"
                  className="input"
                  placeholder="e.g. 12"
                  value={form.tenureMonths}
                  onChange={(event) => setForm((current) => ({ ...current, tenureMonths: event.target.value }))}
                  required
                />
              </div>

              <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                {submitting ? (
                  <>
                    <Spinner size="sm" />
                    Submitting...
                  </>
                ) : (
                  'Submit Application'
                )}
              </button>
            </form>

            <div
              className="rounded-2xl p-5"
              style={{ background: 'rgba(52,120,246,0.06)', border: '1px solid rgba(52,120,246,0.2)' }}
            >
              <p className="mb-4 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                EMI Preview
              </p>
              <div className="space-y-3">
                {[
                  ['Principal', form.amount ? `Rs ${Number(form.amount).toLocaleString('en-IN')}` : '-'],
                  ['Interest Rate', form.interestRate ? `${form.interestRate}% p.a.` : '-'],
                  ['Tenure', form.tenureMonths ? `${form.tenureMonths} months` : '-'],
                ].map(([label, value]) => (
                  <div key={label} className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono', monospace" }}>{value}</span>
                  </div>
                ))}
                <div className="mt-1 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <div className="mb-2 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      Monthly EMI
                    </span>
                    <span className="text-2xl font-bold" style={{ color: '#34d399', fontFamily: "'IBM Plex Mono', monospace" }}>
                      {emiPreview > 0 ? `Rs ${emiPreview.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                    </span>
                  </div>
                  {emiPreview > 0 ? (
                    <>
                      <div className="flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Total payment</span>
                        <span style={{ color: 'var(--text-secondary)', fontFamily: "'IBM Plex Mono', monospace" }}>
                          Rs {totalPayment.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between">
                        <span style={{ color: 'var(--text-muted)' }}>Total interest</span>
                        <span style={{ color: '#fbbf24', fontFamily: "'IBM Plex Mono', monospace" }}>
                          Rs {(totalPayment - Number.parseFloat(form.amount || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="glass p-5 md:p-6">
        {loading ? (
          <SkeletonRows rows={6} />
        ) : loans.length === 0 ? (
          <Empty message="No loan applications yet." icon="o" />
        ) : (
          <div className="space-y-4">
            {loans.map((loan) => {
              const isExpanded = expandedLoanId === loan.id;
              const scheduleData = repaymentSchedules[loan.id];
              const isPayableLoan = !isStaff && ['APPROVED', 'CLOSED'].includes(loan.status);
              const selectedPaymentAccount = paymentAccountByLoan[loan.id] || accounts[0]?.id || '';

              return (
                <div
                  key={loan.id}
                  className="rounded-2xl p-5"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-3">
                        <AccountIDChip id={loan.id} />
                        <StatusBadge status={loan.status} />
                        {loan.overdueCount > 0 ? <StatusBadge status="OVERDUE" /> : null}
                      </div>

                      {isStaff && loan.user ? (
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {loan.user.name} - {loan.user.email}
                        </p>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-3">
                        <Amount value={loan.amount} className="text-base font-semibold" />
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          @{loan.interestRate}% for {loan.tenureMonths} months
                        </span>
                      </div>

                      <div className="mt-3 grid gap-3 sm:grid-cols-3">
                        <div className="glass-sm px-3 py-3">
                          <p className="label mb-1">EMI</p>
                          <Amount value={loan.emi || 0} className="text-sm font-semibold" style={{ color: '#c9ffec' }} />
                        </div>
                        <div className="glass-sm px-3 py-3">
                          <p className="label mb-1">Outstanding</p>
                          <Amount value={loan.outstandingBalance || 0} className="text-sm font-semibold" style={{ color: '#ffe3a3' }} />
                        </div>
                        <div className="glass-sm px-3 py-3">
                          <p className="label mb-1">Next Due</p>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {loan.nextDueDate ? new Date(loan.nextDueDate).toLocaleDateString() : 'No due amount'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-3 xl:w-auto xl:items-end">
                      <button type="button" onClick={() => toggleExpand(loan.id)} className="btn btn-ghost w-full sm:w-auto">
                        {isExpanded ? 'Hide Schedule' : 'View Schedule'}
                      </button>

                      {canApprove && loan.status === 'PENDING' ? (
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <button type="button" onClick={() => handleAction(loan.id, 'approve')} className="btn btn-success" style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}>
                            Approve
                          </button>
                          <button type="button" onClick={() => handleAction(loan.id, 'reject')} className="btn btn-danger" style={{ padding: '0.55rem 1rem', fontSize: '0.8rem' }}>
                            Reject
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isExpanded ? (
                    <div className="mt-5 border-t pt-5" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
                      {loadingScheduleId === loan.id ? (
                        <SkeletonRows rows={4} />
                      ) : scheduleData?.repayments?.length ? (
                        <div className="space-y-4">
                          {isPayableLoan ? (
                            <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
                              <div>
                                <label className="label">Repayment Account</label>
                                <select
                                  className="input"
                                  value={selectedPaymentAccount}
                                  onChange={(event) =>
                                    setPaymentAccountByLoan((current) => ({
                                      ...current,
                                      [loan.id]: Number(event.target.value),
                                    }))
                                  }
                                >
                                  {accounts.map((account) => (
                                    <option key={account.id} value={account.id}>
                                      #{String(account.id).padStart(4, '0')} - {account.type}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="flex items-end">
                                <div className="glass-sm w-full px-4 py-3 lg:w-auto">
                                  <p className="label mb-1">Paid / Total</p>
                                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                    {loan.paidInstallments} / {loan.totalInstallments}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ) : null}

                          <div className="space-y-3">
                            {scheduleData.repayments.map((repayment) => {
                              const paymentKey = `${loan.id}:${repayment.id}`;
                              const canPay = isPayableLoan && ['PENDING', 'OVERDUE'].includes(repayment.status);

                              return (
                                <div key={repayment.id} className="glass-sm px-4 py-4">
                                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                    <div className="min-w-0">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                          Installment {repayment.installmentNumber}
                                        </p>
                                        <StatusBadge status={repayment.status} />
                                      </div>
                                      <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                                        Due on {new Date(repayment.dueDate).toLocaleDateString()}
                                      </p>
                                      <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2 xl:grid-cols-4" style={{ color: 'var(--text-secondary)' }}>
                                        <span>Due <Amount value={repayment.amountDue} /></span>
                                        <span>Principal <Amount value={repayment.principalComponent} /></span>
                                        <span>Interest <Amount value={repayment.interestComponent} /></span>
                                        <span>Balance After <Amount value={repayment.balanceAfter} /></span>
                                      </div>
                                    </div>

                                    {canPay ? (
                                      <button
                                        type="button"
                                        onClick={() => payInstallment(loan.id, repayment.id)}
                                        disabled={payingInstallmentKey === paymentKey}
                                        className="btn btn-success"
                                        style={{ padding: '0.6rem 1rem', fontSize: '0.8rem' }}
                                      >
                                        {payingInstallmentKey === paymentKey ? (
                                          <>
                                            <Spinner size="sm" />
                                            Paying...
                                          </>
                                        ) : (
                                          'Pay EMI'
                                        )}
                                      </button>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ) : (
                        <Empty message="No repayment schedule is available for this loan yet." />
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
