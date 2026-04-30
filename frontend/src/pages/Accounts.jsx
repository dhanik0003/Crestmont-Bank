import { useEffect, useMemo, useState } from 'react';
import { accountAPI, transactionAPI } from '../services/api';
import {
  AccountIDChip,
  AccountTypeBadge,
  Amount,
  Empty,
  SectionHeader,
  SkeletonRows,
  StatusBadge,
  Toast,
  TransactionCategoryBadge,
} from '../components/ui';

const ACCOUNT_TYPES = ['SAVINGS', 'CURRENT', 'FD'];

const formatDateInput = (date) => date.toISOString().slice(0, 10);

const getBinaryErrorMessage = async (error, fallback) => {
  const data = error?.response?.data;

  if (data && typeof data === 'object' && 'error' in data && typeof data.error === 'string') {
    return data.error;
  }

  if (data instanceof ArrayBuffer) {
    try {
      const parsed = JSON.parse(new TextDecoder().decode(data));
      if (typeof parsed?.error === 'string') {
        return parsed.error;
      }
    } catch {
      return fallback;
    }
  }

  if (typeof Blob !== 'undefined' && data instanceof Blob) {
    try {
      const parsed = JSON.parse(await data.text());
      if (typeof parsed?.error === 'string') {
        return parsed.error;
      }
    } catch {
      return fallback;
    }
  }

  return fallback;
};

export default function Accounts() {
  const [accounts, setAccounts] = useState([]);
  const [selected, setSelected] = useState(null);
  const [txns, setTxns] = useState([]);
  const [loadingTxns, setLoadingTxns] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'SAVINGS',
    initialDeposit: '',
    interestRate: '',
    maturityDate: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
  });
  const [statementRange, setStatementRange] = useState({
    start: formatDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)),
    end: formatDateInput(new Date()),
  });
  const [toast, setToast] = useState(null);
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  const selectedFresh = useMemo(
    () => accounts.find((account) => account.id === selected?.id) || selected,
    [accounts, selected]
  );

  const loadAccounts = async () => {
    try {
      const response = await accountAPI.getMyAccounts();
      setAccounts(response.data);
      if (selected) {
        const nextSelected = response.data.find((account) => account.id === selected.id) || null;
        setSelected(nextSelected);
      }
    } catch {
      showToast('Failed to load accounts', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadAccounts();
  }, []);

  const loadTxns = async (accountId) => {
    setLoadingTxns(true);

    try {
      const response = await transactionAPI.getByAccount(accountId);
      setTxns(response.data);
    } catch {
      setTxns([]);
    } finally {
      setLoadingTxns(false);
    }
  };

  const selectAccount = (account) => {
    setSelected(account);
    void loadTxns(account.id);
  };

  const createAccount = async (event) => {
    event.preventDefault();
    setCreating(true);

    try {
      await accountAPI.create({
        type: form.type,
        initialDeposit: form.initialDeposit || 0,
        interestRate: form.type === 'FD' ? form.interestRate : null,
        maturityDate: form.type === 'FD' ? form.maturityDate : null,
      });
      showToast(`${form.type} account created successfully.`, 'success');
      setShowForm(false);
      setForm({
        type: 'SAVINGS',
        initialDeposit: '',
        interestRate: '',
        maturityDate: formatDateInput(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      });
      await loadAccounts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create account', 'error');
    } finally {
      setCreating(false);
    }
  };

  const deleteAccount = async () => {
    if (!confirmDelete) {
      return;
    }

    setDeleting(true);

    try {
      await accountAPI.deleteAccount(confirmDelete.id);
      showToast('Account deleted.', 'success');

      if (selected?.id === confirmDelete.id) {
        setSelected(null);
        setTxns([]);
      }

      setConfirmDelete(null);
      await loadAccounts();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to delete account', 'error');
      setConfirmDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  const exportStatement = async () => {
    if (!selectedFresh) {
      return;
    }

    setExporting(true);

    try {
      const response = await accountAPI.downloadStatement(selectedFresh.id, statementRange);
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `crestmont-statement-${selectedFresh.id}-${statementRange.start}-to-${statementRange.end}.pdf`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
      showToast('Statement download started.', 'success');
    } catch (err) {
      showToast(await getBinaryErrorMessage(err, 'Failed to export statement'), 'error');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      {confirmDelete ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
        >
          <div className="glass w-full max-w-sm p-6 animate-slide-up">
            <h3 className="mb-2 text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Delete account?
            </h3>
            <p className="mb-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              You are about to delete account <AccountIDChip id={confirmDelete.id} />.
            </p>
            <p className="mb-5 text-xs" style={{ color: 'var(--text-muted)' }}>
              This action is irreversible and only works when the account balance is zero.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button type="button" onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1">
                Cancel
              </button>
              <button type="button" onClick={deleteAccount} disabled={deleting} className="btn btn-danger flex-1">
                {deleting ? 'Deleting...' : 'Delete Account'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <SectionHeader
        title="Accounts"
        subtitle="Open new accounts, manage FD terms, review transaction history, and export statements."
        action={
          <button type="button" onClick={() => setShowForm((current) => !current)} className="btn btn-primary text-sm">
            {showForm ? 'Cancel' : '+ New Account'}
          </button>
        }
      />

      {showForm ? (
        <div className="glass mb-6 p-5 md:p-6 animate-slide-up">
          <h3 className="mb-4 text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Open New Account
          </h3>
          <form onSubmit={createAccount} className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="label">Account Type</label>
              <select
                className="input"
                value={form.type}
                onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))}
              >
                {ACCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Initial Deposit (Rs)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input"
                placeholder="0.00"
                value={form.initialDeposit}
                onChange={(event) => setForm((current) => ({ ...current, initialDeposit: event.target.value }))}
              />
            </div>

            {form.type === 'FD' ? (
              <>
                <div>
                  <label className="label">FD Interest Rate (%)</label>
                  <input
                    type="number"
                    min="0.1"
                    max="100"
                    step="0.01"
                    className="input"
                    placeholder="7.50"
                    value={form.interestRate}
                    onChange={(event) => setForm((current) => ({ ...current, interestRate: event.target.value }))}
                    required
                  />
                </div>

                <div>
                  <label className="label">Maturity Date</label>
                  <input
                    type="date"
                    className="input"
                    value={form.maturityDate}
                    onChange={(event) => setForm((current) => ({ ...current, maturityDate: event.target.value }))}
                    required
                  />
                </div>
              </>
            ) : null}

            <div className="lg:col-span-4">
              <button type="submit" disabled={creating} className="btn btn-success w-full sm:w-auto">
                {creating ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="space-y-2 lg:col-span-2">
          {loading ? (
            <SkeletonRows rows={4} />
          ) : accounts.length === 0 ? (
            <div className="glass p-6">
              <Empty message="No accounts yet. Create one above." />
            </div>
          ) : (
            accounts.map((account) => (
              <div
                key={account.id}
                className="glass-sm cursor-pointer p-4 transition-all duration-150 hover:scale-[1.01]"
                style={{
                  border:
                    selectedFresh?.id === account.id ? '1px solid rgba(52,120,246,0.5)' : '1px solid var(--glass-border)',
                  background: selectedFresh?.id === account.id ? 'rgba(52,120,246,0.1)' : 'var(--glass-bg)',
                }}
                onClick={() => selectAccount(account)}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex flex-col gap-2">
                    <AccountIDChip id={account.id} />
                    <AccountTypeBadge type={account.type} />
                    {account.type === 'FD' && account.fdStatus ? <StatusBadge status={account.fdStatus} /> : null}
                  </div>

                  <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end sm:text-right">
                    <Amount value={account.balance} className="text-sm font-semibold" />
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmDelete(account);
                      }}
                      className="rounded-lg px-2 py-1 text-xs transition-colors"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#f87171',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="glass p-5 md:p-6 lg:col-span-3">
          {!selectedFresh ? (
            <Empty message="Select an account to inspect its activity, FD details, and statement export." icon="[]" />
          ) : (
            <>
              <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <AccountIDChip id={selectedFresh.id} />
                    <AccountTypeBadge type={selectedFresh.type} />
                    {selectedFresh.type === 'FD' && selectedFresh.fdStatus ? <StatusBadge status={selectedFresh.fdStatus} /> : null}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    Balance: <Amount value={selectedFresh.balance} className="font-bold" style={{ color: '#34d399' }} />
                  </p>
                </div>
              </div>

              {selectedFresh.type === 'FD' ? (
                <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="glass-sm px-4 py-4">
                    <p className="label mb-2">Interest Rate</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedFresh.interestRate ? `${selectedFresh.interestRate}%` : 'Not configured'}
                    </p>
                  </div>
                  <div className="glass-sm px-4 py-4">
                    <p className="label mb-2">Maturity Date</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedFresh.maturityDate ? new Date(selectedFresh.maturityDate).toLocaleDateString() : 'Not configured'}
                    </p>
                  </div>
                  <div className="glass-sm px-4 py-4">
                    <p className="label mb-2">Principal</p>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {selectedFresh.fdPrincipalAmount ? <Amount value={selectedFresh.fdPrincipalAmount} /> : 'Not configured'}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="mb-6 rounded-[24px] border px-4 py-4" style={{ borderColor: 'rgba(123, 144, 255, 0.2)', background: 'rgba(123, 144, 255, 0.05)' }}>
                <div className="mb-4">
                  <p className="label mb-2">Statement Export</p>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                    Generate a PDF statement over any date range directly from this account.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_12rem]">
                  <div className="min-w-0">
                    <label className="label">Start Date</label>
                    <input
                      type="date"
                      className="input"
                      value={statementRange.start}
                      onChange={(event) => setStatementRange((current) => ({ ...current, start: event.target.value }))}
                    />
                  </div>

                  <div className="min-w-0">
                    <label className="label">End Date</label>
                    <input
                      type="date"
                      className="input"
                      value={statementRange.end}
                      onChange={(event) => setStatementRange((current) => ({ ...current, end: event.target.value }))}
                    />
                  </div>

                  <div className="flex items-end md:min-w-[12rem]">
                    <button type="button" disabled={exporting} onClick={exportStatement} className="btn btn-primary w-full">
                      {exporting ? 'Generating...' : 'Download PDF'}
                    </button>
                  </div>
                </div>
              </div>

              {loadingTxns ? (
                <SkeletonRows rows={5} />
              ) : txns.length === 0 ? (
                <Empty message="No transactions for this account." />
              ) : (
                <div className="space-y-3">
                  {txns.map((transaction) => {
                    const isSender = transaction.senderAccountId === selectedFresh.id;
                    const counterpartyName = isSender
                      ? transaction.receiverAccount?.user?.name || `Account #${transaction.receiverAccountId}`
                      : transaction.senderAccount?.user?.name || `Account #${transaction.senderAccountId}`;

                    return (
                      <div
                        key={transaction.id}
                        className="rounded-xl p-4"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--glass-border)' }}
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                                {isSender ? 'To' : 'From'} {counterpartyName}
                              </p>
                              <TransactionCategoryBadge category={transaction.category} />
                            </div>
                            <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                              {new Date(transaction.createdAt).toLocaleString()}
                            </p>
                            {transaction.note ? (
                              <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {transaction.note}
                              </p>
                            ) : null}
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
