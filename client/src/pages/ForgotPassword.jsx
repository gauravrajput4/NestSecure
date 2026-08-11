import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import AuthShell from '../components/AuthShell.jsx';

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
    <AuthShell
      title="Reset your password"
      subtitle="Enter your account email and we’ll send a secure reset link."
      footerText={!sent ? 'Remember your password?' : undefined}
      footerLinkTo={!sent ? '/login' : undefined}
      footerLinkLabel={!sent ? 'Back to login' : undefined}
      sideSubtitle="Password resets are time-limited and tied to your account for security."
      highlights={[
        'One-time secure reset token',
        'Time-limited link validity',
        'Automatic login after successful reset',
      ]}
    >
      {sent ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-success/30 bg-success/10 p-4 text-sm text-ink/80">
            If an account exists for <span className="font-semibold text-ink">{email}</span>,
            a reset link has been sent. The link expires in 1 hour.
          </div>

          {demoLink && (
            <div className="rounded-xl border border-warning/40 bg-warning/10 p-4">
              <p className="mb-1 text-xs font-mono uppercase tracking-wide text-ink/45">
                Demo mode
              </p>
              <Link
                to={demoLink.replace(/^https?:\/\/[^/]+/, '')}
                className="break-all text-sm font-semibold text-indigo-brand hover:underline"
              >
                Open reset link
              </Link>
            </div>
          )}

          <Link
            to="/login"
            className="inline-flex text-sm font-semibold text-indigo-deep hover:underline"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
          <Button type="submit" fullWidth loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
