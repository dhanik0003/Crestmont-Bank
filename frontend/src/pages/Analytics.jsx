import { useEffect, useState } from 'react';
import { DonutBreakdownChart, MonthlyFlowBarChart, NetCashFlowLineChart } from '../components/AnalyticsCharts';
import { Amount, Empty, SectionHeader, SkeletonRows, Toast } from '../components/ui';
import { transactionAPI } from '../services/api';

const MONTH_OPTIONS = [3, 6, 9, 12];

const deltaLabel = (current, previous) => {
  if (!previous || previous === 0) {
    return current > 0 ? '+100%' : '0%';
  }

  const delta = ((current - previous) / previous) * 100;
  return `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
};

export default function Analytics() {
  const [months, setMonths] = useState(6);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let active = true;

    const loadAnalytics = async () => {
      setLoading(true);

      try {
        const response = await transactionAPI.getAnalytics(months);
        if (active) {
          setAnalytics(response.data);
        }
      } catch {
        if (active) {
          showToast('Unable to load analytics right now.', 'error');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadAnalytics();
    return () => {
      active = false;
    };
  }, [months]);

  const currentMonth = analytics?.monthOverMonth?.currentMonth || null;
  const previousMonth = analytics?.monthOverMonth?.previousMonth || null;

  return (
    <div>
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      <SectionHeader
        title="Analytics"
        subtitle="Track your category mix, monthly spend pattern, and net cash flow."
        action={
          <select className="input min-w-[150px]" value={months} onChange={(event) => setMonths(Number(event.target.value))}>
            {MONTH_OPTIONS.map((option) => (
              <option key={option} value={option}>
                Last {option} months
              </option>
            ))}
          </select>
        }
      />

      {loading ? (
        <SkeletonRows rows={8} />
      ) : !analytics ? (
        <div className="glass p-6">
          <Empty message="Analytics are unavailable right now." />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="glass p-5">
              <p className="label mb-2">Incoming</p>
              <Amount value={analytics.summary.incomingTotal} className="text-2xl font-semibold" style={{ color: '#c9ffec' }} />
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Across the last {months} months
              </p>
            </div>

            <div className="glass p-5">
              <p className="label mb-2">Outgoing</p>
              <Amount value={analytics.summary.outgoingTotal} className="text-2xl font-semibold" style={{ color: '#ffd1d1' }} />
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Internal transfers are excluded
              </p>
            </div>

            <div className="glass p-5">
              <p className="label mb-2">Net Cash Flow</p>
              <p className="text-2xl font-semibold" style={{ color: analytics.summary.netCashFlow >= 0 ? '#c9ffec' : '#ffd1d1' }}>
                {analytics.summary.netCashFlow >= 0 ? '' : '-'}
                <Amount value={Math.abs(analytics.summary.netCashFlow)} />
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                {analytics.summary.netCashFlow >= 0 ? 'Positive' : 'Negative'} cash position
              </p>
            </div>

            <div className="glass p-5">
              <p className="label mb-2">Month Over Month</p>
              <p
                className="text-2xl font-semibold"
                style={{
                  color: currentMonth && previousMonth && currentMonth.outgoing <= previousMonth.outgoing ? '#c9ffec' : '#ffe3a3',
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
              >
                {currentMonth ? deltaLabel(currentMonth.outgoing, previousMonth?.outgoing || 0) : '0%'}
              </p>
              <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                Outgoing vs previous month
              </p>
            </div>
          </div>

          {analytics.spendByCategory.length === 0 ? (
            <div className="glass p-5 md:p-6">
              <Empty message="Start tagging transfers with categories to unlock category analytics." />
            </div>
          ) : (
            <DonutBreakdownChart data={analytics.spendByCategory} total={analytics.summary.categorizedOutgoingTotal} />
          )}

          <div className="grid gap-6 xl:grid-cols-2">
            <MonthlyFlowBarChart data={analytics.monthlyCashFlow} />
            <div className="glass p-6">
              <div className="mb-5">
                <p className="label mb-3">Month Comparison</p>
                <h2 className="text-xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Current vs previous month
                </h2>
              </div>

              {currentMonth ? (
                <div className="space-y-4">
                  {[
                    { label: currentMonth.label, value: currentMonth.outgoing, tone: '#ffd1d1' },
                    { label: previousMonth?.label || 'Previous month', value: previousMonth?.outgoing || 0, tone: '#d8deff' },
                  ].map((entry) => (
                    <div key={entry.label} className="glass-sm px-4 py-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {entry.label}
                          </p>
                          <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>
                            Outgoing spend
                          </p>
                        </div>
                        <Amount value={entry.value} className="text-lg font-semibold sm:text-right" style={{ color: entry.tone }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty message="Not enough monthly history yet." />
              )}
            </div>
          </div>

          <NetCashFlowLineChart data={analytics.monthlyCashFlow} />
        </div>
      )}
    </div>
  );
}
