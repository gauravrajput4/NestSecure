import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
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
      navigate(
        user.role === 'OWNER' ? '/owner/dashboard' : user.role === 'ADMIN' ? '/admin' : '/'
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage bookings, payments, and property activity."
      footerText="Don’t have an account?"
      footerLinkTo="/register"
      footerLinkLabel="Create one"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="login-password" className="block text-sm font-semibold text-ink">
              Password
            </label>
            <Link
              to="/forgot-password"
              className="text-sm font-semibold text-indigo-deep hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              className="h-control w-full rounded-xl border-2 border-ink/20 pl-4 pr-11 text-ink placeholder:text-ink/40 transition-colors hover:border-ink/30 focus:border-indigo-brand/60 focus:outline-none focus:ring-2 focus:ring-indigo-brand/50"
            />
            <button
              type="button"
              onClick={() => setShowPassword((s) => !s)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-ink/50 transition hover:bg-ink/5 hover:text-ink"
            >
              {showPassword ? (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3l18 18M10.6 10.6a2 2 0 002.8 2.8M9.9 4.2A9.6 9.6 0 0112 4c6 0 10 8 10 8a17 17 0 01-3 3.9M6.1 6.1A17 17 0 002 12s4 8 10 8a9.6 9.6 0 004-.9"
                  />
                </svg>
              ) : (
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8-10-8-10-8z"
                  />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          Sign in
        </Button>
      </form>
    </AuthShell>
  );
}
