import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';
import AuthShell from '../components/AuthShell.jsx';

export default function ResetPassword() {
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    try {
      setLoading(true);
      const user = await resetPassword(token, password);
      toast.success('Password updated — you are logged in');
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
      title="Set a new password"
      subtitle="Use a strong password with at least 6 characters."
      footerText="Prefer signing in instead?"
      footerLinkTo="/login"
      footerLinkLabel="Back to login"
      sideSubtitle="After reset, you’ll be signed in automatically and redirected to your workspace."
      highlights={[
        'Strong-password minimum enforced',
        'Secure token verification',
        'Automatic authenticated session',
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Input
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />
        <Button type="submit" fullWidth loading={loading}>
          Update password
        </Button>
      </form>

      <div className="mt-4 rounded-xl border border-outline-soft/70 bg-paper p-3">
        <p className="text-xs text-ink/65">
          Need help? Use{' '}
          <Link to="/forgot-password" className="font-semibold text-indigo-deep hover:underline">
            forgot password
          </Link>{' '}
          to request a fresh reset link.
        </p>
      </div>
    </AuthShell>
  );
}
