import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'USER',
    gender: 'MALE',
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      await register(formData);
      toast.success('Account created successfully');
      navigate('/');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Get started as a tenant or PG owner in under a minute."
      footerText="Already have an account?"
      footerLinkTo="/login"
      footerLinkLabel="Sign in"
      sideSubtitle="Onboard quickly, then manage listings, requests, and bookings from one workspace."
      highlights={[
        'Tenant-friendly discovery and booking',
        'Owner dashboard with request controls',
        'Secure payment and reminder workflows',
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl border border-outline-soft/70 bg-paper p-1" role="tablist" aria-label="Register as">
          <div className="grid grid-cols-2 gap-1">
            {[
              { key: 'USER', label: "I'm looking for a PG" },
              { key: 'OWNER', label: 'I list PGs' },
            ].map((r) => (
              <button
                key={r.key}
                type="button"
                role="tab"
                aria-selected={formData.role === r.key}
                onClick={() => setFormData({ ...formData, role: r.key })}
                className={`rounded-lg px-2 py-2.5 text-xs font-semibold transition sm:text-sm ${
                  formData.role === r.key
                    ? 'bg-white text-ink shadow-subtle'
                    : 'text-ink/60 hover:text-ink'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <Input
          label="Full name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          autoComplete="name"
          required
        />
        <Input
          label="Email address"
          type="email"
          name="email"
          placeholder="name@example.com"
          value={formData.email}
          onChange={handleChange}
          autoComplete="email"
          required
        />
        <Input
          label="Phone number"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+91XXXXXXXXXX"
          autoComplete="tel"
          helperText="Use WhatsApp-enabled number for alerts."
        />

        <fieldset>
          <legend className="mb-1.5 block text-sm font-semibold text-ink">Gender</legend>
          <div className="grid grid-cols-3 gap-2">
            {[
              { value: 'MALE', label: 'Male' },
              { value: 'FEMALE', label: 'Female' },
              { value: 'OTHER', label: 'Other' },
            ].map((g) => (
              <label
                key={g.value}
                className={`flex h-control cursor-pointer items-center justify-center rounded-xl border-2 text-sm font-semibold transition-colors ${
                  formData.gender === g.value
                    ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-deep'
                    : 'border-ink/20 text-ink/70 hover:border-ink/30'
                }`}
              >
                <input
                  type="radio"
                  name="gender"
                  value={g.value}
                  checked={formData.gender === g.value}
                  onChange={handleChange}
                  className="sr-only"
                />
                {g.label}
              </label>
            ))}
          </div>
        </fieldset>

        <Input
          label="Password"
          type="password"
          name="password"
          placeholder="At least 6 characters"
          value={formData.password}
          onChange={handleChange}
          autoComplete="new-password"
          required
          minLength={6}
        />
        <Input
          label="Confirm password"
          type="password"
          name="confirmPassword"
          placeholder="Re-enter password"
          value={formData.confirmPassword}
          onChange={handleChange}
          autoComplete="new-password"
          required
          minLength={6}
        />

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Create account
        </Button>
      </form>
    </AuthShell>
  );
}
