import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui';
import { authAPI } from '../services/api';
import SoftAurora from '../components/SoftAurora';
import { BrandLockup } from '../components/Brand';

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setMounted(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const response = await authAPI.register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      login(response.data.token, response.data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
      <SoftAurora
        className="absolute inset-0"
        speed={0.42}
        scale={1.46}
        brightness={0.88}
        color1="#ffffff"
        color2="#4262ff"
        bandHeight={0.44}
        bandSpread={0.92}
        layerOffset={0.14}
        colorSpeed={0.7}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 16%, rgba(255,255,255,0.04), transparent 18%), radial-gradient(circle at 76% 82%, rgba(66,98,255,0.1), transparent 24%)',
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
                <BrandLockup subtitle="Open your premium digital banking profile" />
              </div>

              <div>
                <p className="label mb-2.5">Onboarding</p>
                <h1 className="page-title">Open your account</h1>
                <p className="mt-2.5 text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Join the portal to manage accounts, make verified transfers, and track every action in one place.
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
                  <label className="label">Full Name</label>
                  <input
                    className="input"
                    name="name"
                    placeholder="John Doe"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>

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

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="label">Password</label>
                    <input
                      className="input"
                      name="password"
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={form.password}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div>
                    <label className="label">Confirm Password</label>
                    <input
                      className="input"
                      name="confirm"
                      type="password"
                      placeholder="Repeat password"
                      value={form.confirm}
                      onChange={handleChange}
                      required
                    />
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
                      Creating account...
                    </>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </form>

              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Already a member?{' '}
                <Link to="/login" className="font-semibold hover:underline" style={{ color: '#d8deff' }}>
                  Sign in
                </Link>
              </p>

              <p className="text-center text-sm" style={{ color: 'var(--text-muted)' }}>
                Prefer the public overview?{' '}
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
