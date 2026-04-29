import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';
import { ErrorMsg, SectionHeader, Spinner, Toast } from '../components/ui';

const EMPTY_PASSWORD_FORM = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    ...EMPTY_PASSWORD_FORM,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [errors, setErrors] = useState({});

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let mounted = true;

    const loadProfile = async () => {
      try {
        const response = await authAPI.me();

        if (!mounted) {
          return;
        }

        const nextUser = response.data;
        updateUser(nextUser);
        setForm((current) => ({
          ...current,
          name: nextUser.name || '',
          email: nextUser.email || '',
        }));
      } catch {
        if (mounted) {
          showToast('Failed to load profile details', 'error');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadProfile();

    return () => {
      mounted = false;
    };
  }, [updateUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: '' }));
  };

  const validate = () => {
    const nextErrors = {};
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) {
      nextErrors.name = 'Name is required';
    }

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    }

    if (form.newPassword || form.currentPassword || form.confirmPassword) {
      if (!form.currentPassword) {
        nextErrors.currentPassword = 'Current password is required';
      }

      if (form.newPassword.length < 6) {
        nextErrors.newPassword = 'New password must be at least 6 characters';
      }

      if (form.newPassword !== form.confirmPassword) {
        nextErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const submit = async (event) => {
    event.preventDefault();

    if (!validate()) {
      return;
    }

    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
      };

      if (form.newPassword) {
        payload.currentPassword = form.currentPassword;
        payload.newPassword = form.newPassword;
      }

      const response = await authAPI.updateMe(payload);
      updateUser(response.data);
      setForm((current) => ({
        ...current,
        ...EMPTY_PASSWORD_FORM,
        name: response.data.name,
        email: response.data.email,
      }));
      showToast('Profile updated successfully.', 'success');
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to update profile';
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {toast ? <Toast {...toast} onClose={() => setToast(null)} /> : null}

      <SectionHeader
        title="Profile"
        subtitle="View your account identity, update personal details, and change your password securely."
      />

      {loading ? (
        <div className="glass flex min-h-[18rem] items-center justify-center p-8">
          <div className="flex items-center gap-3" style={{ color: 'var(--text-secondary)' }}>
            <Spinner />
            <span>Loading profile...</span>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[0.86fr_1.14fr]">
          <div className="glass p-5 md:p-6">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-[1.35rem] text-xl font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.28), rgba(43,0,255,0.28))' }}
              >
                {user?.name?.slice(0, 1)?.toUpperCase() || 'U'}
              </div>

              <div>
                <p className="label mb-2">Signed In As</p>
                <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {user?.name}
                </h2>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {user?.email}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-4">
              <div className="glass-sm px-4 py-4">
                <p className="label mb-2">Role</p>
                <p className="text-sm font-semibold uppercase tracking-[0.14em]" style={{ color: '#dce3ff' }}>
                  {user?.role}
                </p>
              </div>

              <div className="glass-sm px-4 py-4">
                <p className="label mb-2">Profile Overview</p>
                <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  Keep your name and email up to date so statements, support interactions, and operational records stay accurate.
                </p>
              </div>

              <div className="glass-sm px-4 py-4">
                <p className="label mb-2">Password Guidance</p>
                <p className="text-sm leading-7" style={{ color: 'var(--text-secondary)' }}>
                  Leave the password fields empty if you only want to update your name or email address.
                </p>
              </div>
            </div>
          </div>

          <div className="glass p-5 md:p-6">
            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="label">Full Name</label>
                <input
                  className="input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
                <ErrorMsg message={errors.name} />
              </div>

              <div>
                <label className="label">Email Address</label>
                <input
                  className="input"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                />
                <ErrorMsg message={errors.email} />
              </div>

              <div className="rounded-[24px] border px-4 py-4" style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}>
                <p className="label mb-3">Change Password</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className="label">Current Password</label>
                    <input
                      className="input"
                      type="password"
                      name="currentPassword"
                      value={form.currentPassword}
                      onChange={handleChange}
                      placeholder="Enter current password"
                    />
                    <ErrorMsg message={errors.currentPassword} />
                  </div>

                  <div>
                    <label className="label">New Password</label>
                    <input
                      className="input"
                      type="password"
                      name="newPassword"
                      value={form.newPassword}
                      onChange={handleChange}
                      placeholder="Minimum 6 characters"
                    />
                    <ErrorMsg message={errors.newPassword} />
                  </div>

                  <div>
                    <label className="label">Confirm New Password</label>
                    <input
                      className="input"
                      type="password"
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      placeholder="Repeat new password"
                    />
                    <ErrorMsg message={errors.confirmPassword} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Changes are applied immediately to your active session.
                </p>

                <button type="submit" disabled={saving} className="btn btn-primary w-full sm:w-auto">
                  {saving ? (
                    <>
                      <Spinner size="sm" />
                      Saving...
                    </>
                  ) : (
                    'Save Profile'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
