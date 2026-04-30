import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import { authAPI, getApiErrorMessage } from '../services/api';
import SoftAurora from '../components/SoftAurora';
import { BrandLockup } from '../components/Brand';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    void authAPI.warmup();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.login(form);
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(getApiErrorMessage(err, 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <SoftAurora
        className="absolute inset-0"
        speed={0.44}
        scale={1.48}
        brightness={0.88}
        color1="#ffffff"
        color2="#3356ff"
        bandHeight={0.42}
        bandSpread={0.94}
        colorSpeed={0.74}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.04), transparent 18%), radial-gradient(circle at 80% 80%, rgba(51,86,255,0.1), transparent 24%)',
        }}
      />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-6 md:py-8">
        <div
          className="w-full max-w-xl"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(24px)',
            transition: 'opacity 560ms ease, transform 560ms cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div className="glass p-5 md:p-6 lg:p-7">
            <div className="flex flex-col gap-6">
              <div>
                <BrandLockup subtitle="Secure. Simple. Trusted." />
              </div>

              <div>
                <p className="label mb-2.5">Client Portal</p>
                <h1 className="page-title">Welcome back</h1>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Sign in to continue with accounts, transfers, loans, and internal control workflows.
                </p>
              </div>

              {error ? (
                <div
                  className="rounded-2xl px-4 py-3 text-sm"
                  style={{
                    background: 'rgba(255,133,133,0.12)',
                    border: '1px solid rgba(255,133,133,0.24)',
                    color: '#ffb0b0',
                  }}
                >
                  {error}
                </div>
              ) : null}

              <form onSubmit={submit} className="space-y-4">
                <div>
                  <label className="label">Email Address</label>
                  <input
                    className="input"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div>
                  <label className="label">Password</label>
                  <div className="relative">
                    <input
                      className="input pr-20"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((current) => !current)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold transition-opacity hover:opacity-80"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {showPassword ? 'Hide' : 'Show'}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn w-full"
                  style={{
                    color: '#ffffff',
                    background: '#2f43ff',
                    boxShadow: '0 14px 34px rgba(47, 67, 255, 0.22)',
                  }}
                >
                  {loading ? (
                    <>
                      <Spinner size="sm" />
                      Signing in...
                    </>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </form>
              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Need an account?{' '}
                <Link to="/register" className="font-semibold hover:underline" style={{ color: '#d8deff' }}>
                  Create one
                </Link>
              </p>

              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Want the overview first?{' '}
                <Link to="/" className="font-semibold hover:underline" style={{ color: '#d8deff' }}>
                  Back to landing page
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
