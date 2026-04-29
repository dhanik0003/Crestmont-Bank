const TRANSACTION_CATEGORY_STYLE = {
  FOOD: { bg: 'rgba(96, 232, 188, 0.14)', border: 'rgba(96, 232, 188, 0.22)', color: '#c9ffec' },
  RENT: { bg: 'rgba(255, 211, 122, 0.14)', border: 'rgba(255, 211, 122, 0.22)', color: '#ffe3a3' },
  UTILITIES: { bg: 'rgba(122, 144, 255, 0.14)', border: 'rgba(122, 144, 255, 0.22)', color: '#d8deff' },
  GROCERIES: { bg: 'rgba(129, 230, 217, 0.14)', border: 'rgba(129, 230, 217, 0.22)', color: '#d8fffb' },
  ENTERTAINMENT: { bg: 'rgba(217, 119, 255, 0.14)', border: 'rgba(217, 119, 255, 0.22)', color: '#f2d7ff' },
  SHOPPING: { bg: 'rgba(251, 113, 133, 0.14)', border: 'rgba(251, 113, 133, 0.22)', color: '#ffd4dc' },
  TRAVEL: { bg: 'rgba(56, 189, 248, 0.14)', border: 'rgba(56, 189, 248, 0.22)', color: '#d8f3ff' },
  HEALTHCARE: { bg: 'rgba(248, 113, 113, 0.14)', border: 'rgba(248, 113, 113, 0.22)', color: '#ffd7d7' },
  EDUCATION: { bg: 'rgba(250, 204, 21, 0.14)', border: 'rgba(250, 204, 21, 0.22)', color: '#fff0b2' },
  SAVINGS: { bg: 'rgba(74, 222, 128, 0.14)', border: 'rgba(74, 222, 128, 0.22)', color: '#d9ffe6' },
  INVESTMENT: { bg: 'rgba(45, 212, 191, 0.14)', border: 'rgba(45, 212, 191, 0.22)', color: '#cbfff8' },
  TRANSFER: { bg: 'rgba(255,255,255,0.1)', border: 'rgba(255,255,255,0.14)', color: '#ffffff' },
  OTHER: { bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.22)', color: '#dde5f2' },
  LOAN_REPAYMENT: { bg: 'rgba(245, 158, 11, 0.14)', border: 'rgba(245, 158, 11, 0.22)', color: '#ffe3a3' },
  LOAN_DISBURSEMENT: { bg: 'rgba(52, 211, 153, 0.14)', border: 'rgba(52, 211, 153, 0.22)', color: '#c9ffec' },
  FD_INTEREST: { bg: 'rgba(99, 102, 241, 0.14)', border: 'rgba(99, 102, 241, 0.22)', color: '#dce0ff' },
  UNCATEGORIZED: { bg: 'rgba(148, 163, 184, 0.14)', border: 'rgba(148, 163, 184, 0.22)', color: '#dde5f2' },
};

export const Spinner = ({ size = 'md' }) => {
  const dimension = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-10 h-10' : 'w-6 h-6';
  return <div className={`${dimension} rounded-full border-2 border-current border-t-transparent animate-spin opacity-70`} />;
};

export const Toast = ({ message, type = 'info', onClose }) => {
  const icons = { success: 'OK', error: '!', warn: '!', info: 'i' };
  const colors = {
    success: { color: '#34d399', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
    error: { color: '#f87171', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' },
    warn: { color: '#fbbf24', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
    info: { color: '#60a5fa', bg: 'rgba(52,120,246,0.12)', border: 'rgba(52,120,246,0.3)' },
  };
  const accent = colors[type] || colors.info;

  return (
    <div
      className="fixed inset-x-4 top-4 z-[100] flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-xl animate-slide-up sm:inset-x-auto sm:right-4"
      style={{
        background: accent.bg,
        border: `1px solid ${accent.border}`,
        backdropFilter: 'blur(20px)',
        maxWidth: '360px',
        color: 'var(--text-primary)',
      }}
    >
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full text-[0.72rem] font-semibold"
        style={{ color: accent.color, background: 'rgba(255,255,255,0.08)' }}
      >
        {icons[type]}
      </span>
      <span className="flex-1 leading-relaxed">{message}</span>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 text-base leading-none opacity-40 transition-opacity hover:opacity-80"
        style={{ color: 'var(--text-primary)' }}
      >
        x
      </button>
    </div>
  );
};

export const Empty = ({ message = 'No data found', icon = 'o' }) => (
  <div className="flex flex-col items-center justify-center gap-3 py-14">
    <div className="text-4xl opacity-20">{icon}</div>
    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
      {message}
    </p>
  </div>
);

export const StatusBadge = ({ status }) => {
  const map = {
    SUCCESS: 'badge-success',
    APPROVED: 'badge-success',
    CLOSED: 'badge-success',
    PENDING: 'badge-pending',
    FAILED: 'badge-danger',
    REJECTED: 'badge-danger',
    OVERDUE: 'badge-danger',
    PAID: 'badge-success',
  };

  return <span className={`badge ${map[status] || 'badge-info'}`}>{status}</span>;
};

export const AccountTypeBadge = ({ type }) => {
  const map = { SAVINGS: 'badge-savings', CURRENT: 'badge-current', FD: 'badge-fd' };
  return <span className={`badge ${map[type] || 'badge-info'}`}>{type}</span>;
};

export const TransactionCategoryBadge = ({ category }) => {
  const normalized = category || 'UNCATEGORIZED';
  const style = TRANSACTION_CATEGORY_STYLE[normalized] || TRANSACTION_CATEGORY_STYLE.UNCATEGORIZED;
  const label = normalized.replace(/_/g, ' ');

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-[0.62rem] font-semibold uppercase tracking-[0.14em]"
      style={{
        background: style.bg,
        border: `1px solid ${style.border}`,
        color: style.color,
      }}
    >
      {label}
    </span>
  );
};

export const Amount = ({ value, className = '', style = {} }) => (
  <span
    className={`tabular-nums ${className}`}
    style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontVariantNumeric: 'tabular-nums slashed-zero',
      ...style,
    }}
  >
    Rs {Number(value).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
  </span>
);

export const AccountIDChip = ({ id }) => <span className="account-id">#{String(id).padStart(4, '0')}</span>;

export const SkeletonRows = ({ rows = 4 }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="skeleton" style={{ height: '3rem' }} />
    ))}
  </div>
);

export const SectionHeader = ({ title, subtitle, action }) => (
  <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
    <div>
      <h1 className="page-title">{title}</h1>
      {subtitle ? (
        <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {subtitle}
        </p>
      ) : null}
    </div>
    {action ? <div className="w-full sm:w-auto sm:flex-shrink-0 [&>*]:w-full sm:[&>*]:w-auto">{action}</div> : null}
  </div>
);

export const ErrorMsg = ({ message }) =>
  message ? (
    <p className="mt-1.5 text-xs" style={{ color: 'var(--danger)' }}>
      {message}
    </p>
  ) : null;
