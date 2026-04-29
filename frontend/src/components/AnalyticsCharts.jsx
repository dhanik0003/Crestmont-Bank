import { getTransactionCategoryLabel } from '../lib/transactionCategories';

const CATEGORY_COLORS = [
  '#60e8bc',
  '#7b90ff',
  '#ffd37a',
  '#ff8d8d',
  '#8be9ff',
  '#d8a3ff',
  '#91f2c8',
  '#fca5a5',
];

const formatCompactCurrency = (value) =>
  `Rs ${Number(value).toLocaleString('en-IN', {
    notation: 'compact',
    maximumFractionDigits: 1,
  })}`;

const getColor = (index) => CATEGORY_COLORS[index % CATEGORY_COLORS.length];

export const DonutBreakdownChart = ({ data, total }) => {
  const radius = 62;
  const circumference = 2 * Math.PI * radius;
  let offsetAccumulator = 0;

  if (!data.length) {
    return (
      <div className="glass-sm flex min-h-[260px] items-center justify-center p-6 text-sm" style={{ color: 'var(--text-muted)' }}>
        No categorized outgoing spend yet.
      </div>
    );
  }

  return (
    <div className="glass p-5 md:p-6">
      <div className="mb-5">
        <p className="label mb-3">Category Split</p>
        <h2 className="text-xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
          Outgoing spend by category
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="relative mx-auto h-[220px] w-[220px]">
          <svg viewBox="0 0 180 180" className="h-full w-full -rotate-90">
            <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="24" />
            {data.map((entry, index) => {
              const segmentLength = (entry.share / 100) * circumference;
              const circle = (
                <circle
                  key={entry.category}
                  cx="90"
                  cy="90"
                  r={radius}
                  fill="none"
                  stroke={getColor(index)}
                  strokeWidth="24"
                  strokeLinecap="round"
                  strokeDasharray={`${segmentLength} ${circumference}`}
                  strokeDashoffset={-offsetAccumulator}
                />
              );
              offsetAccumulator += segmentLength;
              return circle;
            })}
          </svg>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              Total Outgoing
            </p>
            <p
              className="mt-2 text-2xl font-semibold"
              style={{ color: 'var(--text-primary)', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {formatCompactCurrency(total)}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {data.map((entry, index) => (
            <div key={entry.category} className="glass-sm flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ background: getColor(index) }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {getTransactionCategoryLabel(entry.category)}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {entry.share}% of categorized outgoing spend
                  </p>
                </div>
              </div>

              <p className="text-sm font-semibold sm:text-right" style={{ color: '#ffffff', fontFamily: "'IBM Plex Mono', monospace" }}>
                {formatCompactCurrency(entry.total)}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const MonthlyFlowBarChart = ({ data }) => {
  const maxValue = Math.max(1, ...data.flatMap((entry) => [entry.incoming, entry.outgoing]));

  return (
    <div className="glass p-5 md:p-6">
      <div className="mb-5">
        <p className="label mb-3">Month Over Month</p>
        <h2 className="text-xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
          Incoming vs outgoing
        </h2>
      </div>

      <div className="space-y-4">
        {data.map((entry) => (
          <div key={entry.key} className="space-y-2">
            <div className="flex items-center justify-between text-xs" style={{ color: 'var(--text-secondary)' }}>
              <span>{entry.label}</span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace" }}>
                Net {entry.net >= 0 ? '+' : '-'}Rs {Math.abs(entry.net).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl px-3 py-3" style={{ background: 'rgba(96,232,188,0.08)', border: '1px solid rgba(96,232,188,0.16)' }}>
                <div className="mb-2 text-[0.62rem] uppercase tracking-[0.16em]" style={{ color: '#c9ffec' }}>
                  Incoming
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, (entry.incoming / maxValue) * 100)}%`,
                      background: 'linear-gradient(90deg, rgba(96,232,188,0.45), rgba(96,232,188,0.95))',
                    }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold" style={{ color: '#c9ffec', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatCompactCurrency(entry.incoming)}
                </p>
              </div>

              <div className="rounded-2xl px-3 py-3" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.16)' }}>
                <div className="mb-2 text-[0.62rem] uppercase tracking-[0.16em]" style={{ color: '#ffd1d1' }}>
                  Outgoing
                </div>
                <div className="h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(8, (entry.outgoing / maxValue) * 100)}%`,
                      background: 'linear-gradient(90deg, rgba(248,113,113,0.45), rgba(248,113,113,0.95))',
                    }}
                  />
                </div>
                <p className="mt-2 text-sm font-semibold" style={{ color: '#ffd1d1', fontFamily: "'IBM Plex Mono', monospace" }}>
                  {formatCompactCurrency(entry.outgoing)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const NetCashFlowLineChart = ({ data }) => {
  const width = 560;
  const height = 220;
  const padding = 24;
  const maxAbs = Math.max(1, ...data.map((entry) => Math.abs(entry.net)));
  const stepX = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;
  const zeroY = height / 2;

  const points = data.map((entry, index) => {
    const x = padding + stepX * index;
    const y = zeroY - (entry.net / maxAbs) * ((height - padding * 2) / 2);
    return { ...entry, x, y };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`)
    .join(' ');
  const areaPath = `${linePath} L ${points.at(-1)?.x ?? padding} ${zeroY} L ${points[0]?.x ?? padding} ${zeroY} Z`;

  return (
    <div className="glass p-5 md:p-6">
      <div className="mb-5">
        <p className="label mb-3">Net Cash Flow</p>
        <h2 className="text-xl font-display font-semibold" style={{ color: 'var(--text-primary)' }}>
          Monthly cash flow trend
        </h2>
      </div>

      <div className="-mx-2 overflow-x-auto px-2 sm:mx-0 sm:px-0">
        <svg viewBox={`0 0 ${width} ${height}`} className="min-w-[460px] w-full">
          <line x1={padding} y1={zeroY} x2={width - padding} y2={zeroY} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 6" />
          <path d={areaPath} fill="rgba(123, 144, 255, 0.14)" />
          <path d={linePath} fill="none" stroke="#7b90ff" strokeWidth="3" />
          {points.map((point) => (
            <g key={point.key}>
              <circle cx={point.x} cy={point.y} r="4.5" fill={point.net >= 0 ? '#60e8bc' : '#ff8d8d'} />
              <text x={point.x} y={height - 10} textAnchor="middle" fontSize="10" fill="rgba(235,239,247,0.78)">
                {point.label.split(' ')[0]}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {data.slice(-3).map((entry) => (
          <div key={entry.key} className="glass-sm px-4 py-3">
            <p className="text-xs uppercase tracking-[0.16em]" style={{ color: 'var(--text-muted)' }}>
              {entry.label}
            </p>
            <p
              className="mt-2 text-base font-semibold"
              style={{ color: entry.net >= 0 ? '#c9ffec' : '#ffd1d1', fontFamily: "'IBM Plex Mono', monospace" }}
            >
              {entry.net >= 0 ? '+' : '-'}{formatCompactCurrency(Math.abs(entry.net))}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
