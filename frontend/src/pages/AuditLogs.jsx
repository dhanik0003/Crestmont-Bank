import { useState, useEffect, useMemo } from 'react';
import { auditAPI } from '../services/api';
import { SectionHeader, Empty, SkeletonRows } from '../components/ui';

const ACTION_COLOR = (action) => {
  if (action.includes('Transfer') || action.includes('transfer')) return { dot:'#34d399', bg:'rgba(16,185,129,0.12)' };
  if (action.includes('Loan') || action.includes('loan')) return { dot:'#fbbf24', bg:'rgba(245,158,11,0.12)' };
  if (action.includes('logged in') || action.includes('register')) return { dot:'#60a5fa', bg:'rgba(52,120,246,0.12)' };
  if (action.includes('Deleted') || action.includes('rejected')) return { dot:'#f87171', bg:'rgba(239,68,68,0.12)' };
  if (action.includes('approved') || action.includes('Created')) return { dot:'#a78bfa', bg:'rgba(139,92,246,0.12)' };
  return { dot:'#94a3b8', bg:'rgba(148,163,184,0.08)' };
};

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [debouncedFilter, setDebouncedFilter] = useState('');
  const [page, setPage] = useState(0);
  const PER_PAGE = 20;

  // Debounce the filter so we don't re-slice on every keystroke
  useEffect(() => {
    const id = setTimeout(() => setDebouncedFilter(filter), 200);
    return () => clearTimeout(id);
  }, [filter]);

  useEffect(() => {
    auditAPI.getLogs()
      .then(res => setLogs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Reset to page 0 when filter changes
  useEffect(() => { setPage(0); }, [debouncedFilter]);

  const filtered = useMemo(() => {
    if (!debouncedFilter) return logs;
    const q = debouncedFilter.toLowerCase();
    return logs.filter(l =>
      l.action.toLowerCase().includes(q) ||
      l.user?.name?.toLowerCase().includes(q) ||
      l.user?.email?.toLowerCase().includes(q)
    );
  }, [logs, debouncedFilter]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  return (
    <div>
      <SectionHeader title="Audit Logs" subtitle="Complete history of all system actions" />

      {/* Search + stats */}
      <div className="flex flex-col sm:flex-row gap-4 mb-5">
        <div className="flex-1">
          <input className="input" placeholder="Search by action, user name or email…" value={filter} onChange={e => setFilter(e.target.value)} />
        </div>
        <div className="glass-sm flex w-full items-center justify-center gap-2 px-4 py-3 sm:w-auto sm:flex-shrink-0 sm:justify-start">
          <span className="text-xs" style={{ color:'var(--text-muted)' }}>Showing</span>
          <span className="font-mono font-bold text-sm tabular-nums" style={{ color:'#60a5fa', fontFamily:"'IBM Plex Mono',monospace" }}>{filtered.length}</span>
          <span className="text-xs" style={{ color:'var(--text-muted)' }}>entries</span>
        </div>
      </div>

      <div className="glass p-4 md:p-5">
        {loading ? <SkeletonRows rows={8} /> :
         paginated.length === 0 ? <Empty message="No audit logs found" icon="≡" /> : (
          <>
            <div className="space-y-1 max-h-[560px] overflow-y-auto pr-1">
              {paginated.map((log, idx) => {
                const { dot, bg } = ACTION_COLOR(log.action);
                return (
                  <div key={log.id}
                    className="flex flex-col gap-2.5 rounded-xl p-3 transition-colors hover:bg-white/[0.03] animate-fade-in sm:flex-row sm:items-start"
                    style={{ animationDelay:`${idx * 15}ms` }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background:dot }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-snug" style={{ color:'var(--text-primary)' }}>{log.action}</p>
                      <div className="flex flex-wrap gap-2 mt-0.5">
                        <span className="text-xs" style={{ color:'var(--text-secondary)' }}>{log.user?.name}</span>
                        <span className="text-xs" style={{ color:'var(--text-muted)' }}>{log.user?.email}</span>
                        <span className="text-xs" style={{ color:'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                    <span className="text-xs font-mono sm:flex-shrink-0" style={{ color:'var(--text-muted)', fontFamily:"'IBM Plex Mono',monospace" }}>#{log.id}</span>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-4 flex flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderTop:'1px solid var(--glass-border)' }}>
                <button disabled={page === 0} onClick={() => setPage(p => p-1)} className="btn btn-ghost text-xs px-3 py-1.5">← Prev</button>
                <span className="text-xs" style={{ color:'var(--text-muted)' }}>Page {page+1} of {totalPages}</span>
                <button disabled={page >= totalPages-1} onClick={() => setPage(p => p+1)} className="btn btn-ghost text-xs px-3 py-1.5">Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
