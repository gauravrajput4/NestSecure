import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoLink, setDemoLink] = useState('');
  const { forgotPassword } = useAuth();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await forgotPassword(email);
      setSent(true);
      // Demo mode (no SMTP) returns the link directly so it's still testable.
      if (res.resetLink) setDemoLink(res.resetLink);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-ink via-ink-soft to-indigo-brand flex items-center justify-center p-4">
      <div className="bg-white rounded-xl2 shadow-lift p-8 w-full max-w-md">
        <h1 className="font-display font-extrabold text-3xl text-ink mb-2">
          Reset password
        </h1>

        {sent ? (
          <div className="space-y-4">
            <p className="text-ink/70">
              If an account exists for{' '}
              <span className="font-semibold text-ink">{email}</span>, we've sent
              a reset link. It's valid for one hour.
            </p>
            {demoLink && (
              <div className="rounded-xl bg-paper border border-warning/40 p-4">
                <p className="text-xs font-mono uppercase tracking-wide text-ink/40 mb-1">
                  Demo mode · no email configured
                </p>
                <Link
                  to={demoLink.replace(/^https?:\/\/[^/]+/, '')}
                  className="text-sm text-indigo-brand font-semibold break-all hover:underline"
                >
                  Open reset link
                </Link>
              </div>
            )}
            <Link
              to="/login"
              className="inline-block text-sm text-indigo-brand font-semibold hover:underline"
            >
              Back to login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-ink/60 mb-6">
              Enter your email and we'll send a link to reset your password.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Send reset link
              </Button>
            </form>
            <p className="text-center text-sm text-ink/60 mt-6">
              Remembered it?{' '}
              <Link
                to="/login"
                className="text-indigo-brand font-semibold hover:underline"
              >
                Log in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
