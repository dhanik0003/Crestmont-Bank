import { useEffect, useMemo, useState } from 'react';
import { accountAPI, transactionAPI } from '../services/api';
import { USER_TRANSACTION_CATEGORIES } from '../lib/transactionCategories';
import {
  AccountIDChip,
  Amount,
  Empty,
  SectionHeader,
  SkeletonRows,
  Spinner,
  StatusBadge,
  Toast,
  TransactionCategoryBadge,
} from '../components/ui';

const DECIMAL_AMOUNT_PATTERN = /^\d*(?:\.\d{0,2})?$/;
const EMPTY_RECIPIENT = { loading: false, error: '', account: null };

export default function Transfer() {
  const [accounts, setAccounts] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);
  const [result, setResult] = useState(null);
  const [recipient, setRecipient] = useState(EMPTY_RECIPIENT);
  const [form, setForm] = useState({
    senderAccountId: '',
    receiverAccountId: '',
    amount: '',
    category: '',
    note: '',
  });

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4500);
  };

  const loadTransactions = async (accountId) => {
    if (!accountId) {
      setRecentTransactions([]);
      return;
    }

    setLoadingTransactions(true);

    try {
      const response = await transactionAPI.getByAccount(accountId);
      setRecentTransactions(response.data.slice(0, 12));
    } catch {
      setRecentTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const loadAccounts = async () => {
    const response = await accountAPI.getMyAccounts();
    setAccounts(response.data);
    return response.data;
  };

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const myAccounts = await loadAccounts();
        if (!active) {
          return;
        }

        if (myAccounts.length > 0) {
          const firstAccountId = String(myAccounts[0].id);
          setForm((current) => ({ ...current, senderAccountId: firstAccountId }));
          await loadTransactions(firstAccountId);
        }
      } catch {
        if (active) {
          showToast('Unable to load your accounts right now.', 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const receiverAccountId = form.receiverAccountId.trim();

    if (!receiverAccountId) {
      setRecipient(EMPTY_RECIPIENT);
      return undefined;
    }

    if (!/^\d+$/.test(receiverAccountId)) {
      setRecipient({ loading: false, error: 'Enter a valid numeric account ID.', account: null });
      return undefined;
    }

    if (receiverAccountId === form.senderAccountId) {
      setRecipient({ loading: false, error: 'Choose a different receiver account.', account: null });
      return undefined;
    }

    setRecipient((current) => ({ ...current, loading: true, error: '', account: null }));

    const timer = window.setTimeout(async () => {
      try {
        const response = await accountAPI.lookupById(receiverAccountId);
        if (!cancelled) {
          setRecipient({ loading: false, error: '', account: response.data });
        }
      } catch (err) {
        if (!cancelled) {
          setRecipient({
            loading: false,
            error: err.response?.data?.error || 'Recipient account not found.',
            account: null,
          });
        }
      }
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [form.receiverAccountId, form.senderAccountId]);

  const selectedAccount = useMemo(
    () => accounts.find((account) => String(account.id) === form.senderAccountId),
    [accounts, form.senderAccountId]
  );

  const parsedAmount = Number.parseFloat(form.amount || '0');
  const normalizedAmount = Number.isFinite(parsedAmount) ? parsedAmount : 0;
  const isSelfTransfer = form.senderAccountId && form.receiverAccountId && form.senderAccountId === form.receiverAccountId;
  const canSubmit =
    !!form.senderAccountId &&
    !!form.receiverAccountId &&
    !!form.amount &&
    normalizedAmount > 0 &&
    !submitting &&
    !recipient.loading &&
    !!recipient.account &&
    !isSelfTransfer;

  const handleSenderChange = async (accountId) => {
    setForm((current) => ({ ...current, senderAccountId: accountId }));
    setResult(null);
    await loadTransactions(accountId);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!canSubmit) {
      showToast('Finish the recipient verification and amount details first.', 'warn');
      return;
    }

    setSubmitting(true);
    setResult(null);

    try {
      const response = await transactionAPI.transfer({
        senderAccountId: Number.parseInt(form.senderAccountId, 10),
        receiverAccountId: Number.parseInt(form.receiverAccountId, 10),
        amount: normalizedAmount,
        category: form.category || null,
        note: form.note.trim() || null,
      });

      setResult({
        success: true,
        transaction: response.data.transaction,
        recipientName: recipient.account?.holderName,
      });
      showToast('Transfer completed successfully.', 'success');

      const refreshedAccounts = await loadAccounts();
      const nextSenderAccount =
        refreshedAccounts.find((account) => String(account.id) === form.senderAccountId) || refreshedAccounts[0];

      setForm({
        senderAccountId: nextSenderAccount ? String(nextSenderAccount.id) : '',
        receiverAccountId: '',
        amount: '',
        category: '',
        note: '',
      });
      setRecipient(EMPTY_RECIPIENT);

      await loadTransactions(nextSenderAccount ? String(nextSenderAccount.id) : '');
    } catch (err) {
      const message = err.response?.data?.error || 'Transfer failed';
      setResult({ success: false, message });
      showToast(message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      <SectionHeader
        title="Transfers"
        subtitle="Move funds with recipient verification, optional notes, and category tagging for analytics."
      />

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="space-y-6">
          <div className="glass p-5 md:p-7">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="label mb-3">Transfer Composer</p>
                <h2 className="text-2xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Add context to every transfer
                </h2>
                <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Verify the receiver account, then add a category and note so future analytics and statements stay useful.
                </p>
              </div>

              <div className="glass-sm w-full px-4 py-4 md:w-auto md:min-w-[220px]">
                <p className="label mb-2">Source Account</p>
                {selectedAccount ? (
                  <>
                    <AccountIDChip id={selectedAccount.id} />
                    <p className="mt-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      Available balance
                    </p>
                    <p className="mt-1 text-lg font-semibold" style={{ color: '#c9ffec' }}>
                      <Amount value={selectedAccount.balance} />
                    </p>
                  </>
                ) : (
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    Select an account to start.
                  </p>
                )}
              </div>
            </div>

            {loading ? (
              <SkeletonRows rows={4} />
            ) : accounts.length === 0 ? (
              <Empty message="No accounts available. Open an account before creating a transfer." />
            ) : (
              <form onSubmit={submit} className="space-y-5">
                <div>
                  <label className="label">From Account</label>
                  <select
                    className="input"
                    value={form.senderAccountId}
                    onChange={(event) => handleSenderChange(event.target.value)}
                    required
                  >
                    <option value="">Select an account</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        #{String(account.id).padStart(4, '0')} - {account.type} ({Number(account.balance).toLocaleString('en-IN')})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                  <div>
                    <label className="label">Receiver Account ID</label>
                    <input
                      className="input"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Enter receiver account number"
                      value={form.receiverAccountId}
                      onChange={(event) => {
                        setForm((current) => ({ ...current, receiverAccountId: event.target.value }));
                        setResult(null);
                      }}
                      required
                    />
                    <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                      The holder name appears below before anything is sent.
                    </p>
                  </div>

                  <div className="glass-sm min-h-[132px] px-4 py-4">
                    <p className="label mb-3">Recipient Verification</p>

                    {recipient.loading ? (
                      <div className="flex items-center gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        <Spinner size="sm" />
                        Verifying recipient...
                      </div>
                    ) : recipient.account ? (
                      <div>
                        <p className="text-xs uppercase tracking-[0.18em]" style={{ color: 'var(--text-muted)' }}>
                          Account Holder
                        </p>
                        <p className="mt-2 text-lg font-semibold" style={{ color: '#ffffff' }}>
                          {recipient.account.holderName}
                        </p>
                        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                          #{String(recipient.account.id).padStart(4, '0')} - {recipient.account.type}
                        </p>
                      </div>
                    ) : recipient.error ? (
                      <div
                        className="rounded-2xl px-3 py-3 text-sm"
                        style={{
                          background: 'rgba(255,133,133,0.12)',
                          border: '1px solid rgba(255,133,133,0.2)',
                          color: '#ffb0b0',
                        }}
                      >
                        {recipient.error}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                        Enter an account number to confirm the recipient name before sending funds.
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label className="label">Amount</label>
                    <input
                      className="input"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={(event) => {
                        if (!DECIMAL_AMOUNT_PATTERN.test(event.target.value)) {
                          return;
                        }

                        setForm((current) => ({ ...current, amount: event.target.value }));
                        setResult(null);
                      }}
                      onWheel={(event) => event.currentTarget.blur()}
                      required
                    />
                    {normalizedAmount > 50000 ? (
                      <p className="mt-2 text-xs" style={{ color: '#ffe3a3' }}>
                        This transfer will be monitored because it exceeds Rs 50,000.
                      </p>
                    ) : null}
                  </div>

                  <div>
                    <label className="label">Category (optional)</label>
                    <select
                      className="input"
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    >
                      <option value="">No category</option>
                      {USER_TRANSACTION_CATEGORIES.map((entry) => (
                        <option key={entry.value} value={entry.value}>
                          {entry.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="label">Note (optional)</label>
                  <textarea
                    className="input min-h-[110px]"
                    maxLength={240}
                    placeholder="Add a memo for statements and analytics context"
                    value={form.note}
                    onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                  />
                  <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {form.note.length}/240 characters
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="glass-sm px-4 py-4">
                    <p className="label mb-2">From</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedAccount ? `#${String(selectedAccount.id).padStart(4, '0')}` : 'Not selected'}
                    </p>
                  </div>

                  <div className="glass-sm px-4 py-4">
                    <p className="label mb-2">Category</p>
                    {form.category ? (
                      <TransactionCategoryBadge category={form.category} />
                    ) : (
                      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                        Optional
                      </p>
                    )}
                  </div>

                  <div className="glass-sm px-4 py-4">
                    <p className="label mb-2">Amount</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {form.amount ? <Amount value={normalizedAmount} /> : 'Enter amount'}
                    </p>
                  </div>
                </div>

                {isSelfTransfer ? (
                  <div
                    className="rounded-2xl px-4 py-3 text-sm"
                    style={{
                      background: 'rgba(255,211,122,0.12)',
                      border: '1px solid rgba(255,211,122,0.2)',
                      color: '#ffe3a3',
                    }}
                  >
                    Sender and receiver accounts must be different.
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn w-full"
                  style={{
                    color: '#ffffff',
                    background: '#2f43ff',
                    boxShadow: '0 14px 34px rgba(47, 67, 255, 0.22)',
                  }}
                >
                  {submitting ? (
                    <>
                      <Spinner size="sm" />
                      Processing transfer...
                    </>
                  ) : (
                    'Send Verified Transfer'
                  )}
                </button>
              </form>
            )}

            {result ? (
              <div
                className="mt-5 rounded-[24px] px-4 py-4 text-sm"
                style={{
                  background: result.success ? 'rgba(96,232,188,0.12)' : 'rgba(255,133,133,0.12)',
                  border: result.success ? '1px solid rgba(96,232,188,0.24)' : '1px solid rgba(255,133,133,0.24)',
                  color: result.success ? '#c9ffec' : '#ffb0b0',
                }}
              >
                {result.success ? (
                  <>
                    <p className="font-semibold">Transfer complete</p>
                    <p className="mt-1">
                      Transaction #{result.transaction?.id} sent to {result.recipientName || 'verified recipient'}.
                    </p>
                  </>
                ) : (
                  <p>{result.message}</p>
                )}
              </div>
            ) : null}
          </div>
        </div>

        <div className="glass p-5 md:p-7">
          <div className="mb-6">
            <p className="label mb-3">Activity Feed</p>
            <h2 className="text-2xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
              Recent transactions
            </h2>
            <p className="mt-3 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              The selected account now keeps category and note context alongside every movement.
            </p>
          </div>

          {loading || loadingTransactions ? (
            <SkeletonRows rows={7} />
          ) : recentTransactions.length === 0 ? (
            <Empty message="No recent transactions for the selected account." />
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => {
                const sentBySelectedAccount = String(transaction.senderAccountId) === form.senderAccountId;
                const counterpartyName = sentBySelectedAccount
                  ? transaction.receiverAccount?.user?.name
                  : transaction.senderAccount?.user?.name;
                const counterpartyId = sentBySelectedAccount ? transaction.receiverAccountId : transaction.senderAccountId;

                return (
                  <div key={transaction.id} className="glass-sm px-4 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex min-w-0 items-start gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-2xl text-xs font-semibold"
                          style={{
                            background: sentBySelectedAccount ? 'rgba(255,133,133,0.12)' : 'rgba(96,232,188,0.12)',
                            color: sentBySelectedAccount ? '#ffb0b0' : '#c9ffec',
                          }}
                        >
                          {sentBySelectedAccount ? 'OUT' : 'IN'}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {counterpartyName || `Account #${String(counterpartyId).padStart(4, '0')}`}
                          </p>
                          <p className="truncate text-xs" style={{ color: 'var(--text-muted)' }}>
                            {sentBySelectedAccount ? 'To' : 'From'} #{String(counterpartyId).padStart(4, '0')} on{' '}
                            {new Date(transaction.createdAt).toLocaleString()}
                          </p>

                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <TransactionCategoryBadge category={transaction.category} />
                            {transaction.note ? (
                              <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {transaction.note}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      <div className="w-full text-left sm:w-auto sm:text-right">
                        <div
                          className="font-semibold"
                          style={{
                            color: sentBySelectedAccount ? '#ffb0b0' : '#c9ffec',
                            fontFamily: "'IBM Plex Mono', monospace",
                          }}
                        >
                          {sentBySelectedAccount ? '-' : '+'}
                          <Amount value={transaction.amount} />
                        </div>
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
    </div>
  );
}
