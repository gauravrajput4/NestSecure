import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Cosmetic role hint (matches NestSecure toggle). The backend still returns
  // the account's true role, which drives the post-login redirect below.
  const [loginAs, setLoginAs] = useState('USER');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const user = await login(email, password);
      toast.success(`Welcome back, ${user.name}!`);
      navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/');
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
            Welcome Back
          </h1>
          <p className="text-ink/60">
            Login to manage your bookings and properties.
          </p>
        </div>

        {/* Role selector (segmented toggle) */}
        <div
          className="flex bg-surface-high rounded-lg p-1"
          role="tablist"
          aria-label="Login as"
        >
          {[
            { key: 'USER', label: 'User' },
            { key: 'OWNER', label: 'Owner' },
          ].map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={loginAs === r.key}
              onClick={() => setLoginAs(r.key)}
              className={`flex-1 py-2 rounded-md text-sm font-semibold text-center transition-all ${
                loginAs === r.key
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
            label="Email Address"
            type="email"
            placeholder="name@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label
                htmlFor="login-password"
                className="block text-sm font-semibold text-ink"
              >
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-semibold text-indigo-deep hover:underline"
              >
                Forgot Password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full h-control pl-4 pr-11 rounded-xl border-2 text-ink placeholder:text-ink/40 border-ink/20 hover:border-ink/30 focus:outline-none focus:ring-2 focus:ring-indigo-brand/50 focus:border-indigo-brand/60 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A9.6 9.6 0 0112 4c6 0 10 8 10 8a17 17 0 01-3 3.9M6.1 6.1A17 17 0 002 12s4 8 10 8a9.6 9.6 0 004-.9" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <Button type="submit" fullWidth loading={loading} className="mt-1">
            Sign In
          </Button>
        </form>

        <p className="text-center text-sm text-ink/60">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-indigo-deep font-semibold hover:underline"
          >
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
