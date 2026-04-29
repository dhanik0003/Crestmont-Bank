import { useId } from 'react';

export function CrestmontLogo({ size = 44, className = '' }) {
  const gradientId = useId();
  const glowId = useId();

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id={gradientId} x1="8" y1="5" x2="42" y2="43" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="38%" stopColor="#d7ddff" />
          <stop offset="100%" stopColor="#3952ff" />
        </linearGradient>
        <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0.09  0 0 1 0 0.55  0 0 0 0.7 0"
          />
        </filter>
      </defs>

      <rect x="6" y="6" width="36" height="36" rx="14" fill="#0B0E14" />
      <rect x="6" y="6" width="36" height="36" rx="14" fill={`url(#${gradientId})`} opacity="0.14" />
      <rect x="6.75" y="6.75" width="34.5" height="34.5" rx="13.25" stroke="rgba(255,255,255,0.28)" />
      <rect x="6" y="6" width="36" height="36" rx="14" fill={`url(#${gradientId})`} filter={`url(#${glowId})`} opacity="0.3" />

      <path
        d="M17 15.5C17 13.567 18.567 12 20.5 12H29C30.933 12 32.5 13.567 32.5 15.5V16.5H20.5C18.567 16.5 17 18.067 17 20V15.5Z"
        fill="white"
        fillOpacity="0.92"
      />
      <path
        d="M15.5 22C15.5 19.515 17.515 17.5 20 17.5H32.5V22C32.5 24.485 30.485 26.5 28 26.5H15.5V22Z"
        fill="white"
        fillOpacity="0.72"
      />
      <path
        d="M15.5 29C15.5 27.895 16.395 27 17.5 27H29.5C30.605 27 31.5 27.895 31.5 29V29.2C31.5 31.851 29.351 34 26.7 34H20.3C17.649 34 15.5 31.851 15.5 29.2V29Z"
        fill="white"
        fillOpacity="0.96"
      />
    </svg>
  );
}

export function BrandLockup({
  className = '',
  subtitle = 'Secure. Verified. Instant.',
  compact = false,
}) {
  return (
    <div className={`flex items-center gap-3 ${className}`.trim()}>
      <CrestmontLogo size={compact ? 40 : 46} />
      <div>
        <p
          className="font-display leading-none tracking-[0.14em] uppercase"
          style={{
            color: 'var(--text-primary)',
            fontSize: compact ? '0.92rem' : '1.02rem',
            fontWeight: 700,
          }}
        >
          Crestmont
        </p>
        <p
          className="font-display leading-none tracking-[0.38em] uppercase"
          style={{
            color: 'var(--text-secondary)',
            fontSize: compact ? '0.48rem' : '0.56rem',
            marginTop: compact ? '0.32rem' : '0.38rem',
            fontWeight: 600,
          }}
        >
          BANK
        </p>
        {subtitle ? (
          <p className="mt-2 text-xs" style={{ color: 'var(--text-muted)' }}>
            {subtitle}
          </p>
        ) : null}
      </div>
    </div>
  );
}
