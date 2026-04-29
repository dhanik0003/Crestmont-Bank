import { Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/ui/header-2';

const FloatingLines = lazy(() => import('../components/FloatingLines'));

const NAV_ITEMS = [
  { href: '#about', label: 'About' },
  { href: '#features', label: 'Features' },
  { href: '#support', label: 'Support' },
  { href: '#security', label: 'Security' },
];

const FEATURE_GRID = [
  {
    title: 'Account management',
    copy: 'Open savings, current, and fixed-deposit accounts with transaction history, balances, and account-specific controls.',
  },
  {
    title: 'Smart transfers',
    copy: 'Send money with categories, notes, and clearer transaction context for day-to-day banking and internal review.',
  },
  {
    title: 'Spending analytics',
    copy: 'Review outgoing spend by category, compare month-over-month movement, and visualize cash flow trends.',
  },
  {
    title: 'Loan operations',
    copy: 'Handle approvals, repayment schedules, EMI collections, and overdue visibility in a structured workflow.',
  },
  {
    title: 'Statements on demand',
    copy: 'Generate polished PDF statements over a custom date range without leaving the account workspace.',
  },
  {
    title: 'Operational auditability',
    copy: 'Support admin and staff oversight through alerts, audit logs, and role-aware access across the platform.',
  },
];

const BANK_STORY = [
  {
    title: 'A modern retail model',
    copy: 'Crestmont Bank is presented here as a fictional digital-first institution focused on practical retail banking: faster service, transparent money movement, and cleaner operational controls.',
  },
  {
    title: 'Built for everyday clarity',
    copy: 'The experience emphasizes traceable transfers, understandable loan schedules, meaningful fixed deposits, and statements customers can actually use.',
  },
];

const SUPPORT_CHANNELS = [
  {
    title: '24/7 phone support',
    detail: 'Speak with a service specialist any time for login issues, payment questions, or urgent account help.',
    meta: 'Helpline: 1800-300-4400',
  },
  {
    title: 'Secure in-app messaging',
    detail: 'Customers can raise account or loan queries inside the protected workspace without switching channels.',
    meta: 'Typical response: under 3 minutes',
  },
  {
    title: 'Planned branch appointments',
    detail: 'Schedule assistance for onboarding, document verification, and higher-touch service requests when needed.',
    meta: 'Fictional network: 18 service hubs',
  },
];

const SECURITY_POINTS = [
  'Role-based access for customers, employees, managers, and administrators',
  'Auditable actions and transaction visibility across operational workflows',
  'Structured statement exports, fraud alerts, and transaction-level metadata',
  'Database-backed persistence and controlled backend service boundaries',
];

function SectionIntro({ eyebrow, title, copy }) {
  return (
    <div className="max-w-3xl">
      <p className="label mb-3" style={{ color: '#cfd7ff' }}>
        {eyebrow}
      </p>
      <h2
        className="text-3xl font-semibold md:text-4xl"
        style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}
      >
        {title}
      </h2>
      <p className="mt-4 text-base leading-8 md:text-lg" style={{ color: 'var(--text-secondary)' }}>
        {copy}
      </p>
    </div>
  );
}

export default function Landing() {
  return (
    <div
      id="top"
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(180deg, #020203 0%, #05070d 38%, #030304 100%)',
      }}
    >
      <div className="fixed inset-x-0 top-0 z-50 px-4 pt-3 md:px-8 md:pt-5">
        <Header
          links={NAV_ITEMS.map((item) => ({
            label: item.label,
            href: item.href,
          }))}
          signInTo="/login"
          getStartedTo="/register"
          signInLabel="Sign In"
          getStartedLabel="Get Started"
        />
      </div>

      <section className="relative isolate min-h-screen overflow-hidden">
        <div className="absolute inset-0">
          <Suspense fallback={<div className="h-full w-full" />}>
            <FloatingLines
              enabledWaves={['top', 'middle', 'bottom']}
              lineCount={[10, 15, 20]}
              lineDistance={[8, 6, 4]}
              bendRadius={5}
              bendStrength={-0.5}
              interactive
              parallax
              animationSpeed={0.95}
              parallaxStrength={0.18}
              linesGradient={['#1d1cf9', '#3556ff', '#7a96ff', '#ffffff']}
              topWavePosition={{ x: 9.4, y: 0.58, rotate: -0.42 }}
              middleWavePosition={{ x: 4.8, y: -0.02, rotate: 0.18 }}
              bottomWavePosition={{ x: 2.2, y: -0.72, rotate: -0.9 }}
              mixBlendMode="screen"
            />
          </Suspense>
        </div>

        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(circle at 50% 0%, rgba(29,28,249,0.22), transparent 34%), radial-gradient(circle at 15% 12%, rgba(255,255,255,0.06), transparent 20%), linear-gradient(180deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.3) 26%, rgba(0,0,0,0.76) 100%)',
          }}
        />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 pt-24 md:px-8 md:pt-28">
          <div className="flex flex-1 items-center justify-center pb-8 pt-6 lg:pb-10 lg:pt-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1
                className="mx-auto max-w-4xl"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: "'Montserrat', 'Inter', system-ui, sans-serif",
                  fontSize: 'clamp(2.85rem, 6vw, 5.3rem)',
                  fontWeight: 700,
                  lineHeight: 0.95,
                  letterSpacing: '-0.05em',
                }}
              >
                Banking that feels immediate,
                <span style={{ color: '#b9c5ff' }}> traceable, and confidently supported.</span>
              </h1>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link to="/register" className="btn btn-primary">
                  Launch Banking Workspace
                </Link>
                <a href="#support" className="btn btn-ghost">
                  View Customer Support
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="relative">
        <div
          className="mx-auto max-w-7xl px-4 md:px-8"
          style={{ background: 'transparent' }}
        >
          <div
            className="h-px"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            }}
          />
        </div>

        <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-10 md:px-8 md:pb-20 md:pt-14">
          <section id="about" className="scroll-mt-28 py-10 md:py-14">
            <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
              <SectionIntro
                eyebrow="About Crestmont"
                title="A fictional bank designed to feel credible, modern, and customer-first."
                copy="This landing page presents Crestmont as a digital-first retail bank that blends self-service convenience with dependable human support. The goal is simple: make the product feel like a complete banking brand, not just an internal dashboard."
              />

              <div className="grid gap-4">
                {BANK_STORY.map((item) => (
                  <div
                    key={item.title}
                    className="glass-sm rounded-[26px] px-5 py-5"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {item.title}
                    </h3>
                    <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                      {item.copy}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="features" className="scroll-mt-28 py-10 md:py-14">
            <SectionIntro
              eyebrow="Features"
              title="Everything a polished banking portal should surface clearly."
              copy="The product experience is organized around practical banking tasks: managing accounts, moving money safely, understanding spending behavior, servicing loans, and exporting records when customers need them."
            />

            <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {FEATURE_GRID.map((feature, index) => (
                <div
                  key={feature.title}
                  className="glass-sm rounded-[26px] px-5 py-5"
                  style={{ background: index % 3 === 0 ? 'rgba(29,28,249,0.08)' : 'rgba(255,255,255,0.05)' }}
                >
                  <p className="label mb-3">Feature {String(index + 1).padStart(2, '0')}</p>
                  <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                    {feature.copy}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section id="support" className="scroll-mt-28 py-10 md:py-14">
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
              <SectionIntro
                eyebrow="Support"
                title="Customer help should feel visible before people need it."
                copy="The landing page now gives Crestmont a more complete service identity, including clear support channels, faster reassurance, and a sense that customers are not left on their own after onboarding."
              />

              <div className="grid gap-4">
                {SUPPORT_CHANNELS.map((channel) => (
                  <div
                    key={channel.title}
                    className="glass-sm rounded-[26px] px-5 py-5"
                    style={{ background: 'rgba(255,255,255,0.05)' }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                          {channel.title}
                        </h3>
                        <p className="mt-3 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                          {channel.detail}
                        </p>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em]"
                        style={{
                          background: 'rgba(29,28,249,0.12)',
                          color: '#d9e0ff',
                          border: '1px solid rgba(123,144,255,0.24)',
                        }}
                      >
                        {channel.meta}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section id="security" className="scroll-mt-28 py-10 md:py-14">
            <div className="grid gap-8 lg:grid-cols-[1.08fr_0.92fr]">
              <div className="glass rounded-[30px] p-6 md:p-7">
                <SectionIntro
                  eyebrow="Security and control"
                  title="The experience is designed to look trustworthy because the workflow itself is structured."
                  copy="Rather than vague marketing claims, Crestmont emphasizes practical controls: role-aware access, audit visibility, richer transaction context, and clear service boundaries across the banking system."
                />

                <div className="mt-6 grid gap-3">
                  {SECURITY_POINTS.map((point) => (
                    <div
                      key={point}
                      className="rounded-[20px] px-4 py-4"
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                        {point}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass-sm rounded-[30px] px-6 py-6 md:px-7 md:py-7">
                <p className="label mb-3">Ready to explore</p>
                <h3 className="text-2xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Start with the public-facing story, then move straight into the banking workspace.
                </h3>
                <p className="mt-4 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  This page now gives the project a more believable front door: a bank identity, a top navigation bar,
                  service details, feature coverage, and visible support information before the user signs in.
                </p>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/register" className="btn btn-primary">
                    Create Access
                  </Link>
                  <Link to="/login" className="btn btn-ghost">
                    Sign In
                  </Link>
                </div>

                <div
                  className="mt-6 rounded-[22px] px-4 py-4"
                  style={{
                    background: 'rgba(29,28,249,0.1)',
                    border: '1px solid rgba(123,144,255,0.18)',
                  }}
                >
                  <p className="text-xs uppercase tracking-[0.18em]" style={{ color: '#cfd7ff' }}>
                    Demo note
                  </p>
                  <p className="mt-2 text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                    Crestmont Bank is a fictional brand created for this project presentation and interface experience.
                  </p>
                </div>
              </div>
            </div>
          </section>

          <footer
            className="mt-6 rounded-[28px] border px-5 py-5 md:px-6"
            style={{
              borderColor: 'rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.04)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Crestmont Bank is a fictional banking brand used for this project demo.
              </p>

              <div className="flex flex-wrap gap-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
                {NAV_ITEMS.map((item) => (
                  <a key={item.href} href={item.href} className="hover:underline">
                    {item.label}
                  </a>
                ))}
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
