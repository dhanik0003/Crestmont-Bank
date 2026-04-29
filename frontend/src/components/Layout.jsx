import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BrandLockup, CrestmontLogo } from './Brand';
import SidebarDock from './SidebarDock';
import SoftAurora from './SoftAurora';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: 'dashboard', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/accounts', label: 'Accounts', icon: 'wallet', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/transfer', label: 'Transfers', icon: 'transfer', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/analytics', label: 'Analytics', icon: 'analytics', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/loans', label: 'Loans', icon: 'loan', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/profile', label: 'Profile', icon: 'profile', roles: ['CUSTOMER', 'EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/alerts', label: 'Fraud Alerts', icon: 'shield', roles: ['EMPLOYEE', 'MANAGER', 'ADMIN'] },
  { to: '/audit', label: 'Audit Logs', icon: 'audit', roles: ['MANAGER', 'ADMIN'] },
  { to: '/admin', label: 'Admin Panel', icon: 'admin', roles: ['ADMIN'] },
];

const ROLE_PILL = {
  CUSTOMER: { background: 'rgba(255,255,255,0.1)', color: '#ffffff', border: 'rgba(255,255,255,0.14)' },
  EMPLOYEE: { background: 'rgba(122,144,255,0.14)', color: '#d8deff', border: 'rgba(122,144,255,0.26)' },
  MANAGER: { background: 'rgba(255,211,122,0.14)', color: '#ffe3a3', border: 'rgba(255,211,122,0.24)' },
  ADMIN: { background: 'rgba(96,232,188,0.14)', color: '#c9ffec', border: 'rgba(96,232,188,0.24)' },
};

function AppIcon({ name, className = '' }) {
  const common = {
    className,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.9,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    viewBox: '0 0 24 24',
  };

  switch (name) {
    case 'dashboard':
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="2" />
          <rect x="14" y="3" width="7" height="11" rx="2" />
          <rect x="3" y="14" width="7" height="7" rx="2" />
          <rect x="14" y="18" width="7" height="3" rx="1.5" />
        </svg>
      );
    case 'wallet':
      return (
        <svg {...common}>
          <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6H18a2 2 0 0 1 2 2v8.5A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-8Z" />
          <path d="M15 12h5" />
          <circle cx="15.5" cy="12" r="0.5" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'transfer':
      return (
        <svg {...common}>
          <path d="M5 7h11" />
          <path d="m12 4 4 3-4 3" />
          <path d="M19 17H8" />
          <path d="m12 14-4 3 4 3" />
        </svg>
      );
    case 'analytics':
      return (
        <svg {...common}>
          <path d="M5 19V9" />
          <path d="M12 19V5" />
          <path d="M19 19v-7" />
          <path d="M3 19h18" />
        </svg>
      );
    case 'loan':
      return (
        <svg {...common}>
          <path d="M6 8.5 12 4l6 4.5" />
          <path d="M7 10v7a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1v-7" />
          <path d="M10 13h4" />
          <path d="M12 11v4" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...common}>
          <path d="M12 3 5 6v5c0 4.5 2.8 7.9 7 10 4.2-2.1 7-5.5 7-10V6l-7-3Z" />
          <path d="m9.5 12.5 1.7 1.7 3.6-4" />
        </svg>
      );
    case 'audit':
      return (
        <svg {...common}>
          <path d="M7 4h10" />
          <path d="M7 9h10" />
          <path d="M7 14h6" />
          <path d="M7 19h10" />
        </svg>
      );
    case 'admin':
      return (
        <svg {...common}>
          <path d="M12 3v3" />
          <path d="m18.4 5.6-2.1 2.1" />
          <path d="M21 12h-3" />
          <path d="m18.4 18.4-2.1-2.1" />
          <path d="M12 21v-3" />
          <path d="m7.7 16.3-2.1 2.1" />
          <path d="M6 12H3" />
          <path d="m7.7 7.7-2.1-2.1" />
          <circle cx="12" cy="12" r="3.2" />
        </svg>
      );
    case 'profile':
      return (
        <svg {...common}>
          <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" />
          <path d="M5 20.5a7 7 0 0 1 14 0" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
        </svg>
      );
    case 'logout':
      return (
        <svg {...common}>
          <path d="M15 16.5 20 12l-5-4.5" />
          <path d="M20 12H9" />
          <path d="M10 4H6.5A2.5 2.5 0 0 0 4 6.5v11A2.5 2.5 0 0 0 6.5 20H10" />
        </svg>
      );
    case 'lock':
      return (
        <svg {...common}>
          <rect x="5" y="10" width="14" height="10" rx="3" />
          <path d="M8 10V8a4 4 0 1 1 8 0v2" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  const visibleNav = NAV.filter((item) => item.roles.includes(user?.role));
  const rolePill = ROLE_PILL[user?.role] || ROLE_PILL.CUSTOMER;

  // Pause expensive animations during scroll for better performance
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
      <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-4 pb-1.5 pt-3.5">
          <BrandLockup compact subtitle="Private digital banking workspace" />
        </div>

        <nav className="min-h-0 flex-1 overflow-y-auto px-3.5 py-1 pr-2 scrollable-container" style={{ scrollBehavior: 'smooth' }}>
          <SidebarDock
            items={visibleNav}
            onNavigate={() => setSidebarOpen(false)}
            renderIcon={(icon, className) => <AppIcon name={icon} className={className} />}
          />
        </nav>
      </div>

      <div className="shrink-0 px-4 pb-5 pt-3">
        <div className="glass-sm flex items-center justify-between gap-3 px-3 py-2.5">
          <NavLink
            to="/profile"
            onClick={() => setSidebarOpen(false)}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-opacity hover:opacity-90"
          >
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
              style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(43,0,255,0.28))' }}
            >
              {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
            </div>

            <div className="min-w-0">
              <p className="truncate text-[0.82rem] font-semibold" style={{ color: 'var(--text-primary)' }}>
                {user?.name}
              </p>
              <p className="truncate text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>
                {user?.email}
              </p>
            </div>
          </NavLink>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className="inline-flex rounded-full px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.14em]"
              style={{
                background: rolePill.background,
                color: rolePill.color,
                border: `1px solid ${rolePill.border}`,
              }}
            >
              {user?.role}
            </span>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl p-2 transition-colors"
              style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)' }}
              title="Sign out"
            >
              <AppIcon name="logout" className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <SoftAurora
        className="fixed inset-0"
        speed={isScrolling ? 0.1 : 0.42}
        scale={1.42}
        brightness={0.86}
        color1="#ffffff"
        color2="#2b00ff"
        bandHeight={0.42}
        bandSpread={0.94}
        layerOffset={0.08}
        colorSpeed={isScrolling ? 0.1 : 0.72}
      />
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            'radial-gradient(circle at 22% 18%, rgba(255,255,255,0.04), transparent 16%), radial-gradient(circle at 84% 72%, rgba(43,0,255,0.1), transparent 22%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen">
        <aside className="fixed inset-y-0 left-0 hidden w-[268px] p-3.5 md:flex">
          <div className="glass h-full w-full rounded-[30px]">
            <SidebarContent />
          </div>
        </aside>

        {sidebarOpen ? (
          <div className="fixed inset-0 z-40 md:hidden">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <aside className="absolute inset-y-0 left-0 w-[88vw] max-w-[340px] p-3">
              <div className="glass h-full w-full rounded-[30px]">
                <div className="flex h-full min-h-0 flex-col">
                  <div className="flex min-h-0 flex-1 flex-col">
                    <div className="shrink-0 px-4 pb-1.5 pt-3.5">
                      <BrandLockup compact subtitle="Private digital banking workspace" />
                    </div>

                    <nav className="min-h-0 flex-1 overflow-y-auto px-3.5 py-1 pr-2 scrollable-container" style={{ scrollBehavior: 'smooth' }}>
                      <SidebarDock
                        items={visibleNav}
                        onNavigate={() => setSidebarOpen(false)}
                        renderIcon={(icon, className) => <AppIcon name={icon} className={className} />}
                      />
                    </nav>
                  </div>

                  <div className="shrink-0 px-4 pb-5 pt-3">
                    <div className="glass-sm flex items-center justify-between gap-3 px-3 py-2.5">
                      <NavLink
                        to="/profile"
                        onClick={() => setSidebarOpen(false)}
                        className="flex min-w-0 flex-1 items-center gap-3 rounded-xl transition-opacity hover:opacity-90"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-xs font-semibold text-white"
                          style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(43,0,255,0.28))' }}
                        >
                          {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-[0.82rem] font-semibold" style={{ color: 'var(--text-primary)' }}>
                            {user?.name}
                          </p>
                          <p className="truncate text-[0.68rem]" style={{ color: 'var(--text-muted)' }}>
                            {user?.email}
                          </p>
                        </div>
                      </NavLink>

                      <div className="flex shrink-0 flex-col items-end gap-1.5">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-[0.56rem] font-semibold uppercase tracking-[0.14em]"
                          style={{
                            background: rolePill.background,
                            color: rolePill.color,
                            border: `1px solid ${rolePill.border}`,
                          }}
                        >
                          {user?.role}
                        </span>

                        <button
                          type="button"
                          onClick={handleLogout}
                          className="rounded-xl p-2 transition-colors"
                          style={{ color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)' }}
                          title="Sign out"
                        >
                          <AppIcon name="logout" className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="flex min-h-screen flex-1 md:ml-[268px]">
          <div className="flex min-h-screen flex-1 flex-col">
            <header className="px-3 pt-3 sm:px-4 sm:pt-4 md:hidden">
              <div className="glass flex items-center justify-between rounded-[24px] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  className="rounded-xl p-1.5 transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <AppIcon name="menu" className="h-6 w-6" />
                </button>

                <div className="flex items-center gap-3">
                  <CrestmontLogo size={34} />
                  <div>
                    <p
                      className="font-display text-sm font-semibold uppercase tracking-[0.16em]"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      Crestmont
                    </p>
                    <p className="text-[0.62rem] uppercase tracking-[0.24em]" style={{ color: 'var(--text-muted)' }}>
                      Bank
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-xl p-1.5 transition-colors hover:bg-white/5"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <AppIcon name="logout" className="h-5 w-5" />
                </button>
              </div>
            </header>

            <main className="flex-1">
              <div className="mx-auto max-w-7xl px-4 pb-7 pt-5 sm:px-5 sm:pb-8 sm:pt-6 md:px-8 md:pb-10 md:pt-8 animate-fade-in">
                <Outlet />
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
