import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Input from '../components/Input.jsx';
import Button from '../components/Button.jsx';

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
      navigate(user.role === 'OWNER' ? '/owner/dashboard' : '/');
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
          Choose a new password
        </h1>
        <p className="text-ink/60 mb-6">Enter and confirm your new password.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
          />
          <Button type="submit" className="w-full" loading={loading}>
            Update password
          </Button>
        </form>

        <p className="text-center text-sm text-ink/60 mt-6">
          <Link
            to="/login"
            className="text-indigo-brand font-semibold hover:underline"
          >
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
