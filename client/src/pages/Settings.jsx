import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';

// ---- Inline icon set -----------------------------------------------------
const Svg = ({ children, className = 'h-5 w-5', ...p }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
    {...p}
  >
    {children}
  </svg>
);
const IconLock = (p) => (
  <Svg {...p}>
    <rect x="4" y="11" width="16" height="10" rx="2" />
    <path d="M8 11V7a4 4 0 018 0v4" />
  </Svg>
);
const IconBell = (p) => (
  <Svg {...p}>
    <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.7 21a2 2 0 01-3.4 0" />
  </Svg>
);
const IconCard = (p) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </Svg>
);
const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M9.9 4.2A9.1 9.1 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.2 3.2M6.6 6.6A18.4 18.4 0 001 12s4 8 11 8a9 9 0 004.4-1.1" />
    <path d="M9.9 9.9a3 3 0 004.2 4.2M1 1l22 22" />
  </Svg>
);
const IconShield = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
  </Svg>
);
const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);
const IconClock = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Svg>
);

const TABS = [
  { id: 'security', label: 'Account Security', icon: IconLock },
  { id: 'notifications', label: 'Notifications', icon: IconBell },
  { id: 'payments', label: 'Payment Methods', icon: IconCard },
  { id: 'privacy', label: 'Privacy', icon: IconShield },
];

// Small badge used to be honest about features with no backend support yet.
const SoonPill = () => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-semibold">
    <IconClock className="h-3 w-3" />
    Not available yet
  </span>
);

// A reusable "planned, but not wired" panel so we never show fake controls
// that silently do nothing.
const ComingSoon = ({ icon: Icon, title, blurb }) => (
  <div className="rounded-xl2 border border-dashed border-outline-soft p-8 text-center">
    <span className="mx-auto h-12 w-12 rounded-full bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
      <Icon className="h-6 w-6" />
    </span>
    <div className="mt-4 flex items-center justify-center gap-2">
      <h3 className="font-display font-bold text-lg text-ink">{title}</h3>
      <SoonPill />
    </div>
    <p className="text-ink/60 mt-2 max-w-md mx-auto">{blurb}</p>
  </div>
);

export default function Settings() {
  const { user, forgotPassword } = useAuth();
  const toast = useToast();
  const [active, setActive] = useState('security');

  // Change-password uses the REAL reset-email flow — no separate endpoint
  // exists for logged-in users, so we send the same secure reset link.
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoLink, setDemoLink] = useState('');

  const sendResetLink = async () => {
    if (!user?.email) return;
    try {
      setSending(true);
      const res = await forgotPassword(user.email);
      setSent(true);
      if (res.resetLink) setDemoLink(res.resetLink);
      toast.success('Password reset link sent');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSending(false);
    }
  };

  const ActiveIcon = TABS.find((t) => t.id === active)?.icon || IconLock;

  return (
    <div className="min-h-screen bg-paper py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand mb-2">
            Account
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl text-ink">
            Account settings
          </h1>
          <p className="text-ink/60 mt-2">
            Manage your sign-in security and preferences for{' '}
            <span className="font-semibold text-ink">{user?.email}</span>.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
          {/* Tab rail */}
          <nav
            className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible bg-white rounded-xl2 shadow-card p-2 h-max"
            aria-label="Settings sections"
          >
            {TABS.map((t) => {
              const Icon = t.icon;
              const on = active === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActive(t.id)}
                  aria-current={on ? 'page' : undefined}
                  className={`flex items-center gap-3 px-4 min-h-control rounded-xl text-sm font-semibold whitespace-nowrap transition ${
                    on
                      ? 'bg-indigo-brand text-white shadow-subtle'
                      : 'text-ink/70 hover:bg-ink/5'
                  }`}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  {t.label}
                </button>
              );
            })}
          </nav>

          {/* Panel */}
          <div className="bg-white rounded-xl2 shadow-card p-6 sm:p-8">
            <div className="flex items-center gap-3 mb-6 pb-6 border-b border-ink/10">
              <span className="h-11 w-11 rounded-xl bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
                <ActiveIcon className="h-6 w-6" />
              </span>
              <div>
                <h2 className="font-display font-bold text-xl text-ink">
                  {TABS.find((t) => t.id === active)?.label}
                </h2>
                <p className="text-sm text-ink/50">
                  {active === 'security'
                    ? 'Keep your account safe'
                    : 'Planned for a future update'}
                </p>
              </div>
            </div>

            {/* Account Security — real */}
            {active === 'security' && (
              <div className="space-y-8">
                {/* Change password */}
                <section>
                  <h3 className="font-display font-bold text-lg text-ink mb-1">
                    Change password
                  </h3>
                  <p className="text-ink/60 text-sm mb-4">
                    For your security, we send a password reset link to your
                    registered email rather than changing it in the browser.
                  </p>

                  {sent ? (
                    <div className="rounded-xl2 bg-success/5 border border-success/30 p-5">
                      <p className="flex items-center gap-2 font-semibold text-ink">
                        <IconMail className="h-5 w-5 text-success" />
                        Reset link sent to {user?.email}
                      </p>
                      <p className="text-sm text-ink/60 mt-1">
                        Check your inbox and follow the link to set a new
                        password. It's valid for one hour.
                      </p>
                      {demoLink && (
                        <div className="mt-4 rounded-xl bg-paper border border-warning/40 p-4">
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
                      <button
                        type="button"
                        onClick={() => {
                          setSent(false);
                          setDemoLink('');
                        }}
                        className="mt-4 text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
                      >
                        Send again
                      </button>
                    </div>
                  ) : (
                    <div className="rounded-xl2 bg-paper p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <span className="h-10 w-10 rounded-xl bg-white shadow-subtle text-indigo-brand flex items-center justify-center">
                          <IconLock className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="font-semibold text-ink">Password</p>
                          <p className="text-sm text-ink/50">
                            Last changed via secure email reset
                          </p>
                        </div>
                      </div>
                      <Button onClick={sendResetLink} loading={sending}>
                        Email me a reset link
                      </Button>
                    </div>
                  )}
                </section>

                {/* Two-factor — honest not-available */}
                <section className="pt-6 border-t border-ink/10">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display font-bold text-lg text-ink">
                      Two-factor authentication
                    </h3>
                    <SoonPill />
                  </div>
                  <p className="text-ink/60 text-sm mb-4">
                    An extra step at sign-in for stronger protection.
                  </p>
                  <div className="rounded-xl2 bg-paper p-5 flex items-center justify-between gap-4 opacity-75">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-xl bg-white shadow-subtle text-ink/40 flex items-center justify-center">
                        <IconShield className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">
                          Authenticator app
                        </p>
                        <p className="text-sm text-ink/50">
                          Not available in this version
                        </p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                      Set up
                    </Button>
                  </div>
                </section>
              </div>
            )}

            {/* Notifications — honest not-available */}
            {active === 'notifications' && (
              <ComingSoon
                icon={IconBell}
                title="Notification preferences"
                blurb="Controls for booking updates, rent reminders and promotional emails will live here. They aren't wired up yet, so we're not showing toggles that wouldn't do anything."
              />
            )}

            {/* Payment methods — honest not-available */}
            {active === 'payments' && (
              <div className="space-y-5">
                <ComingSoon
                  icon={IconCard}
                  title="Saved payment methods"
                  blurb="Saving cards for faster checkout isn't supported yet. For now, payments are handled securely at booking time through the payment gateway."
                />
                {user?.role === 'OWNER' && (
                  <div className="rounded-xl2 bg-indigo-brand/5 border border-indigo-brand/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <p className="font-semibold text-ink">
                        Looking for payouts?
                      </p>
                      <p className="text-sm text-ink/60">
                        Set up where you receive rent from your profile.
                      </p>
                    </div>
                    <Link to="/profile">
                      <Button size="sm" variant="outline">
                        Go to payout setup
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Privacy — honest not-available */}
            {active === 'privacy' && (
              <ComingSoon
                icon={IconShield}
                title="Privacy controls"
                blurb="Options to manage your data, profile visibility and account deletion are planned. Until they're connected, we'd rather not show placeholder switches."
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
