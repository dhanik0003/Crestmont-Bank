import { useState, useEffect } from 'react';
import { alertAPI } from '../services/api';
import { SectionHeader, Amount, Empty, SkeletonRows } from '../components/ui';
import CountUp from '../components/CountUp';

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    alertAPI.getAll()
      .then(res => setAlerts(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <SectionHeader title="Fraud Alerts" subtitle="Transactions flagged by the rule-based detection engine" />

      {/* Stats strip */}
      {!loading && alerts.length > 0 && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-slide-up">
          {[
            { label:'Total Alerts', value: alerts.length, color:'#f87171' },
            { label:'High-Value Flags', value: alerts.filter(a => a.reason.toLowerCase().includes('high')).length, color:'#fbbf24' },
            { label:'Rapid Tx Flags',  value: alerts.filter(a => a.reason.toLowerCase().includes('rapid')).length, color:'#a78bfa' },
          ].map(({ label, value, color }) => (
            <div key={label} className="glass p-4">
              <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color:'var(--text-muted)' }}>{label}</p>
              <p className="text-2xl font-bold font-mono tabular-nums" style={{ color, fontFamily:"'IBM Plex Mono',monospace" }}>
                <CountUp to={value} duration={1.05} />
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="glass p-5 md:p-6">
        {loading ? <SkeletonRows rows={5} /> :
         alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-1"
              style={{ background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.2)' }}>✓</div>
            <p className="font-semibold" style={{ color:'#34d399' }}>All Clear</p>
            <p className="text-sm" style={{ color:'var(--text-muted)' }}>No fraud alerts detected</p>
          </div>
         ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div key={alert.id} className="p-4 rounded-xl animate-fade-in"
                style={{ background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.25)' }}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 text-sm"
                      style={{ background:'rgba(239,68,68,0.15)', color:'#f87171' }}>⚑</div>
                    <div>
                      <p className="text-sm font-medium" style={{ color:'#fca5a5' }}>{alert.reason}</p>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-xs" style={{ color:'var(--text-muted)' }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace" }}>Alert #{alert.id}</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace" }}>Txn #{alert.transactionId}</span>
                        {alert.transaction && (
                          <>
                            <span>Amount: <Amount value={alert.transaction.amount} /></span>
                            <span>{alert.transaction.senderAccount?.user?.name || '?'} → {alert.transaction.receiverAccount?.user?.name || '?'}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color:'var(--text-muted)' }}>
                    {new Date(alert.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Rules */}
      <div className="glass p-5 mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color:'var(--text-muted)' }}>Active Detection Rules</p>
        <div className="grid sm:grid-cols-2 gap-3">
          {[
            { icon:'₹', title:'High-Value Threshold', desc:'Flags any single transfer above ₹50,000', color:'#fbbf24' },
            { icon:'⚡', title:'Rapid Transactions', desc:'Flags ≥5 transfers from one account within 10 minutes', color:'#a78bfa' },
          ].map(({ icon, title, desc, color }) => (
            <div key={title} className="flex items-start gap-3 p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.04)', border:'1px solid var(--glass-border)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm" style={{ background:`${color}20`, color }}>{icon}</div>
              <div>
                <p className="text-xs font-semibold" style={{ color:'var(--text-primary)' }}>{title}</p>
                <p className="text-xs mt-0.5" style={{ color:'var(--text-muted)' }}>{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
