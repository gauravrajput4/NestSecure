import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12 bg-paper overflow-hidden">
      {/* Subtle gradient wash */}
      <div
        className="absolute inset-0 z-0 bg-gradient-to-br from-surface-low to-info-soft opacity-60 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative z-10 w-full max-w-md bg-white rounded-xl2 shadow-lift border border-outline-soft p-6 sm:p-8 flex flex-col gap-6">
        <div className="text-center flex flex-col gap-1">
          <h1 className="font-display font-extrabold text-3xl text-ink tracking-tight">
            Create Your Account
          </h1>
          <p className="text-ink/60">
            Join NestSecure PG to book or list a stay.
          </p>
        </div>

        {/* Role selector (segmented toggle) — drives the real role field */}
        <div
          className="flex bg-surface-high rounded-lg p-1"
          role="tablist"
          aria-label="Register as"
        >
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
              className={`flex-1 py-2 px-2 rounded-md text-sm font-semibold text-center transition-all ${
                formData.role === r.key
                  ? 'bg-white shadow-subtle text-ink'
                  : 'text-ink/60 hover:text-ink'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Full Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <Input
            label="Email Address"
            type="email"
            name="email"
            placeholder="name@example.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <Input
            label="Phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="+91..."
          />

          {/* Gender radio group */}
          <fieldset>
            <legend className="block text-sm font-semibold text-ink mb-1.5">
              Gender
            </legend>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'MALE', label: 'Male' },
                { value: 'FEMALE', label: 'Female' },
                { value: 'OTHER', label: 'Other' },
              ].map((g) => (
                <label
                  key={g.value}
                  className={`flex items-center justify-center gap-2 h-control rounded-xl border-2 text-sm font-semibold cursor-pointer transition-colors ${
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
            placeholder="••••••••"
            value={formData.password}
            onChange={handleChange}
            required
            minLength={6}
          />
          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            placeholder="••••••••"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            minLength={6}
          />

          <Button type="submit" fullWidth loading={loading} className="mt-1">
            Create Account
          </Button>
        </form>

        <p className="text-center text-sm text-ink/60">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-indigo-deep font-semibold hover:underline"
          >
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
