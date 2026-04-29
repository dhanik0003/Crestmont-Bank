import { useState, useEffect } from 'react';
import { adminAPI, transactionAPI, alertAPI, accountAPI } from '../services/api';
import { SectionHeader, Empty, SkeletonRows, Toast, StatusBadge, Amount, AccountIDChip, AccountTypeBadge } from '../components/ui';
import CountUp from '../components/CountUp';

const ROLES = ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'];
const ROLE_COLORS = { CUSTOMER:'#38bdf8', EMPLOYEE:'#a78bfa', MANAGER:'#fbbf24', ADMIN:'#7eb3ff' };

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [txns, setTxns] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [allAccounts, setAllAccounts] = useState([]);
  const [tab, setTab] = useState('users');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const showToast = (message, type='info') => { setToast({ message, type }); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    const load = async () => {
      try {
        const [uRes, tRes, aRes, acRes] = await Promise.all([
          adminAPI.getAllUsers(),
          transactionAPI.getAll(),
          alertAPI.getAll(),
          accountAPI.getAllAccounts(),
        ]);
        setUsers(uRes.data);
        setTxns(tRes.data);
        setAlerts(aRes.data);
        setAllAccounts(acRes.data);
      } catch { showToast('Failed to load admin data', 'error'); }
      finally { setLoading(false); }
    };
    load();
  }, []);

  const changeRole = async (userId, roleName) => {
    try {
      await adminAPI.updateRole(userId, roleName);
      setUsers(u => u.map(x => x.id === userId ? { ...x, role:{ name:roleName } } : x));
      showToast('Role updated', 'success');
    } catch (err) { showToast(err.response?.data?.error || 'Failed to update role', 'error'); }
  };

  const deleteAccount = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await accountAPI.deleteAccount(confirmDelete.id);
      setAllAccounts(a => a.filter(x => x.id !== confirmDelete.id));
      showToast('Account deleted', 'success');
      setConfirmDelete(null);
    } catch (err) { showToast(err.response?.data?.error || 'Cannot delete account', 'error'); setConfirmDelete(null); }
    finally { setDeleting(false); }
  };

  const TABS = [
    { id:'users',    label:`Users`, count: users.length },
    { id:'accounts', label:`Accounts`, count: allAccounts.length },
    { id:'txns',     label:`Transactions`, count: txns.length },
    { id:'alerts',   label:`Alerts`, count: alerts.length, warn: alerts.length > 0 },
  ];

  return (
    <div>
      {toast && <Toast {...toast} onClose={() => setToast(null)} />}

      {/* Delete confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background:'rgba(0,0,0,0.6)', backdropFilter:'blur(4px)' }}>
          <div className="glass p-6 w-full max-w-sm animate-slide-up">
            <h3 className="font-semibold text-base mb-2" style={{ color:'var(--text-primary)' }}>Delete Account?</h3>
            <p className="text-sm mb-1" style={{ color:'var(--text-secondary)' }}>
              Delete account <AccountIDChip id={confirmDelete.id} /> belonging to <strong>{confirmDelete.user?.name}</strong>?
            </p>
            <p className="text-xs mb-5" style={{ color:'var(--text-muted)' }}>Account must have zero balance. This cannot be undone.</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setConfirmDelete(null)} className="btn btn-ghost flex-1">Cancel</button>
              <button onClick={deleteAccount} disabled={deleting} className="btn btn-danger flex-1">
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <SectionHeader title="Admin Panel" subtitle="System-wide oversight and management" />

      {/* Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label:'Users', value:users.length, color:'#60a5fa' },
          { label:'Accounts', value:allAccounts.length, color:'#34d399' },
          { label:'Transactions', value:txns.length, color:'#a78bfa' },
          { label:'Fraud Alerts', value:alerts.length, color: alerts.length > 0 ? '#f87171' : '#34d399' },
        ].map(({ label, value, color }, i) => (
          <div key={label} className="glass p-4 text-center animate-slide-up" style={{ animationDelay:`${i*60}ms` }}>
            <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:'var(--text-muted)' }}>{label}</p>
            <p className="text-3xl font-bold font-mono tabular-nums" style={{ color, fontFamily:"'IBM Plex Mono',monospace" }}>
              <CountUp to={value} duration={1.1} />
            </p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mb-4 -mx-1 overflow-x-auto px-1">
        <div className="flex w-max min-w-full gap-1 rounded-2xl p-1" style={{ background:'var(--glass-bg)', border:'1px solid var(--glass-border)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm transition-all"
              style={{
                background: tab === t.id ? 'rgba(52,120,246,0.25)' : 'transparent',
                border: tab === t.id ? '1px solid rgba(52,120,246,0.4)' : '1px solid transparent',
                color: tab === t.id ? '#7eb3ff' : 'var(--text-secondary)',
                fontWeight: tab === t.id ? '600' : '400',
              }}>
              {t.label}
              <span className="rounded-full px-1.5 py-0.5 font-mono text-xs" style={{ background: t.warn?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.08)', color: t.warn?'#f87171':'var(--text-muted)' }}>
                {t.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="glass p-4 md:p-5">
        {loading ? <SkeletonRows rows={6} /> : (
          <>
            {/* ── Users ── */}
            {tab === 'users' && (
              users.length === 0 ? <Empty message="No users found" /> : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[640px]">
                    <thead>
                      <tr style={{ borderBottom:'1px solid var(--glass-border)' }}>
                        {['ID','Name','Email','Role','Accounts','Loans','Joined','Change Role'].map(h => (
                          <th key={h} className="pb-3 pr-4 text-left text-xs font-semibold uppercase tracking-wider" style={{ color:'var(--text-muted)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {users.map(u => (
                        <tr key={u.id} className="transition-colors hover:bg-white/[0.02]" style={{ borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                          <td className="py-3 pr-4 font-mono text-xs" style={{ color:'var(--text-muted)', fontFamily:"'IBM Plex Mono',monospace" }}>#{u.id}</td>
                          <td className="py-3 pr-4 font-medium text-sm" style={{ color:'var(--text-primary)' }}>{u.name}</td>
                          <td className="py-3 pr-4 text-xs font-mono" style={{ color:'var(--text-secondary)', fontFamily:"'IBM Plex Mono',monospace" }}>{u.email}</td>
                          <td className="py-3 pr-4">
                            <span className="text-xs font-bold" style={{ color: ROLE_COLORS[u.role?.name] || 'var(--text-muted)' }}>{u.role?.name}</span>
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-center" style={{ color:'var(--text-secondary)', fontFamily:"'IBM Plex Mono',monospace" }}>{u._count?.accounts ?? 0}</td>
                          <td className="py-3 pr-4 font-mono text-xs text-center" style={{ color:'var(--text-secondary)', fontFamily:"'IBM Plex Mono',monospace" }}>{u._count?.loans ?? 0}</td>
                          <td className="py-3 pr-4 text-xs" style={{ color:'var(--text-muted)' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                          <td className="py-3">
                            <select
                              className="text-xs px-2 py-1.5 rounded-lg outline-none transition-colors cursor-pointer"
                              style={{ background:'rgba(52,120,246,0.12)', border:'1px solid rgba(52,120,246,0.25)', color:'#7eb3ff', fontFamily:"'IBM Plex Mono',monospace" }}
                              value={u.role?.name || ''}
                              onChange={e => changeRole(u.id, e.target.value)}>
                              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}

            {/* ── Accounts ── */}
            {tab === 'accounts' && (
              allAccounts.length === 0 ? <Empty message="No accounts found" /> : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {allAccounts.map(acc => (
                    <div key={acc.id} className="flex flex-col gap-3 rounded-xl p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)' }}>
                      <div className="flex items-center gap-4">
                        <AccountIDChip id={acc.id} />
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <AccountTypeBadge type={acc.type} />
                            {acc.user && <span className="text-xs" style={{ color:'var(--text-secondary)' }}>{acc.user.name}</span>}
                          </div>
                          <p className="text-xs" style={{ color:'var(--text-muted)' }}>{new Date(acc.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                        <Amount value={acc.balance} className="font-bold text-sm" />
                        <button onClick={() => setConfirmDelete(acc)}
                          className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                          style={{ background:'rgba(239,68,68,0.1)', color:'#f87171', border:'1px solid rgba(239,68,68,0.2)' }}>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Transactions ── */}
            {tab === 'txns' && (
              txns.length === 0 ? <Empty message="No transactions yet" /> : (
                <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                  {txns.map(tx => (
                    <div key={tx.id} className="flex flex-col gap-3 rounded-xl p-3.5 sm:flex-row sm:items-center sm:justify-between"
                      style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)' }}>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs" style={{ color:'var(--text-muted)', fontFamily:"'IBM Plex Mono',monospace" }}>#{tx.id}</span>
                        <div>
                          <p className="text-sm" style={{ color:'var(--text-primary)' }}>
                            {tx.senderAccount?.user?.name || '?'} → {tx.receiverAccount?.user?.name || '?'}
                          </p>
                          <p className="text-xs" style={{ color:'var(--text-muted)', fontFamily:"'IBM Plex Mono',monospace" }}>
                            Acc #{String(tx.senderAccountId).padStart(4,'0')} → #{String(tx.receiverAccountId).padStart(4,'0')} · {new Date(tx.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:self-start">
                        <Amount value={tx.amount} className="font-bold text-sm" />
                        <StatusBadge status={tx.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ── Alerts ── */}
            {tab === 'alerts' && (
              alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="text-4xl" style={{ color:'#34d399' }}>✓</div>
                  <p className="text-sm font-medium" style={{ color:'#34d399' }}>No fraud alerts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(alert => (
                    <div key={alert.id} className="p-4 rounded-xl" style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.2)' }}>
                      <div className="flex items-start gap-3">
                        <span style={{ color:'#f87171', marginTop:'2px' }}>⚑</span>
                        <div>
                          <p className="text-sm" style={{ color:'#fca5a5' }}>{alert.reason}</p>
                          <p className="text-xs mt-0.5 font-mono" style={{ color:'var(--text-muted)', fontFamily:"'IBM Plex Mono',monospace" }}>
                            Txn #{alert.transactionId} · {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
