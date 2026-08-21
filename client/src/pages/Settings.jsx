import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import Button from '../components/Button.jsx';
import Modal from '../components/Modal.jsx';
import Toggle from '../components/Toggle.jsx';
import Input from '../components/Input.jsx';
import Select from '../components/Select.jsx';
import Loader from '../components/Loader.jsx';
import {
  getAccountSettings,
  updateNotificationPrefs,
  updatePrivacyPrefs,
  addPaymentMethod,
  setDefaultPaymentMethod,
  deletePaymentMethod,
  exportAccountData,
  deleteAccount,
} from '../services/settingsService.js';

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
const IconDownload = (p) => (
  <Svg {...p}>
    <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </Svg>
);
const IconTrash = (p) => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4a1 1 0 011-1h6a1 1 0 011 1v2m2 0v14a2 2 0 01-2 2H8a2 2 0 01-2-2V6" />
  </Svg>
);
const IconCheck = (p) => (
  <Svg {...p}>
    <path d="M5 13l4 4L19 7" />
  </Svg>
);
const IconMailOpen = (p) => (
  <Svg {...p}>
    <path d="M3 8l9 6 9-6" />
    <rect x="3" y="5" width="18" height="14" rx="2" />
  </Svg>
);

const TABS = [
  { id: 'security', label: 'Account Security', icon: IconLock },
  { id: 'notifications', label: 'Notifications', icon: IconBell },
  { id: 'payments', label: 'Payment Methods', icon: IconCard },
  { id: 'privacy', label: 'Privacy', icon: IconShield },
];

const TAB_SUBTITLES = {
  security: 'Keep your account safe',
  notifications: 'Choose what we send you',
  payments: 'Ways to pay faster',
  privacy: 'Your data, your rules',
};

const CHANNELS = [
  { value: 'EMAIL', label: 'Email' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'BOTH', label: 'Email + WhatsApp' },
];

const CARD_NETWORKS = ['VISA', 'MASTERCARD', 'RUPAY', 'AMEX', 'OTHER'];

const UPI_RE = /^[\w.\-]{2,256}@[a-zA-Z]{2,64}$/;

// Row definitions per role — each row is a notification key + copy.
function rowsForRole(role) {
  if (role === 'OWNER') {
    return [
      {
        key: 'newRequests',
        label: 'New booking requests',
        description: 'When a tenant requests to book one of your listings.',
      },
      {
        key: 'bookingUpdates',
        label: 'Booking activity',
        description: 'Approvals, cancellations and payment confirmations on your listings.',
      },
      {
        key: 'rentReminders',
        label: 'Rent reminders',
        description: "When a tenant's rent is due or overdue.",
      },
      {
        key: 'promotions',
        label: 'Offers & news',
        description: 'Occasional product updates and growth tips.',
      },
    ];
  }
  if (role === 'ADMIN') {
    return [
      {
        key: 'bookingUpdates',
        label: 'Booking activity',
        description: 'System-wide booking events and flagged activity.',
      },
      {
        key: 'promotions',
        label: 'Product news',
        description: 'Feature and platform updates for admins.',
      },
    ];
  }
  return [
    {
      key: 'bookingUpdates',
      label: 'Booking updates',
      description: 'Approvals, confirmations and cancellations for your bookings.',
    },
    {
      key: 'rentReminders',
      label: 'Rent reminders',
      description: 'A heads-up when a rent payment is due or overdue.',
    },
    {
      key: 'promotions',
      label: 'Offers & news',
      description: 'Occasional offers relevant to the city you search in.',
    },
  ];
}

// A toggle row with consistent spacing for the preferences list.
function PrefRow({ label, description, checked, onChange, disabled }) {
  return (
    <div className="rounded-xl2 bg-paper border border-stone-line p-4">
      <Toggle
        label={label}
        description={description}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />
    </div>
  );
}

export default function Settings() {
  const { user, logout, forgotPassword } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [active, setActive] = useState('security');

  const [loading, setLoading] = useState(true);

  // Notification prefs
  const [notif, setNotif] = useState({
    bookingUpdates: true,
    rentReminders: true,
    promotions: false,
    newRequests: true,
    channel: 'EMAIL',
  });
  const [savingNotif, setSavingNotif] = useState(false);

  // Privacy prefs
  const [privacy, setPrivacy] = useState({ showContact: true, profileVisibility: 'PRIVATE' });
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  // Payment methods
  const [methods, setMethods] = useState([]);
  const [addType, setAddType] = useState('UPI');
  const [addUpi, setAddUpi] = useState('');
  const [addNetwork, setAddNetwork] = useState('VISA');
  const [addLast4, setAddLast4] = useState('');
  const [adding, setAdding] = useState(false);
  const [methodBusy, setMethodBusy] = useState(null);

  // Export + delete
  const [exporting, setExporting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Change-password (existing flow)
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [demoLink, setDemoLink] = useState('');

  const role = user?.role || 'USER';

  useEffect(() => {
    let mounted = true;
    getAccountSettings()
      .then((res) => {
        if (!mounted) return;
        setNotif((prev) => ({ ...prev, ...res.data.notifications }));
        setPrivacy((prev) => ({ ...prev, ...res.data.privacy }));
        setMethods(res.data.paymentMethods || []);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const saveNotifications = async () => {
    try {
      setSavingNotif(true);
      await updateNotificationPrefs(notif);
      toast.success('Notification preferences saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingNotif(false);
    }
  };

  const savePrivacy = async () => {
    try {
      setSavingPrivacy(true);
      await updatePrivacyPrefs(privacy);
      toast.success('Privacy preferences saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    try {
      setAdding(true);
      if (addType === 'UPI') {
        if (!UPI_RE.test(addUpi)) {
          toast.error('Enter a valid UPI ID, like name@bank');
          return;
        }
      } else if (!/^\d{4}$/.test(addLast4)) {
        toast.error('Enter the last 4 digits of the card');
        return;
      }
      const res = await addPaymentMethod({
        type: addType,
        ...(addType === 'UPI' ? { upiId: addUpi } : { network: addNetwork, last4: addLast4 }),
      });
      setMethods((prev) => [...prev, res.data]);
      setAddUpi('');
      setAddLast4('');
      toast.success('Payment method saved');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdding(false);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      setMethodBusy(id);
      await setDefaultPaymentMethod(id);
      setMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m._id === id }))
      );
      toast.success('Default payment method updated');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMethodBusy(null);
    }
  };

  const handleDeleteMethod = async (id) => {
    if (!window.confirm('Remove this saved payment method?')) return;
    try {
      setMethodBusy(id);
      await deletePaymentMethod(id);
      setMethods((prev) => prev.filter((m) => m._id !== id));
      toast.success('Payment method removed');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setMethodBusy(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await exportAccountData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nestsecure-data-${user?._id}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Your data is downloading');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (confirmText.trim().toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    try {
      setDeleting(true);
      await deleteAccount();
      toast.success('Account deleted');
      logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message);
      setDeleteOpen(false);
    } finally {
      setDeleting(false);
    }
  };

  const ActiveIcon = TABS.find((t) => t.id === active)?.icon || IconLock;
  const notifRows = rowsForRole(role);

  if (loading) {
    return (
      <div className="min-h-screen bg-paper py-10">
        <Loader className="min-h-[40vh]" />
      </div>
    );
  }

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
                <p className="text-sm text-ink/50">{TAB_SUBTITLES[active]}</p>
              </div>
            </div>

            {/* Account Security */}
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
                      <Button
                        onClick={sendResetLink}
                        loading={sending}
                        disabled={!user?.email}
                      >
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
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-warning/15 text-warning text-xs font-semibold">
                      <IconClock className="h-3 w-3" />
                      Not available yet
                    </span>
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

            {/* Notifications */}
            {active === 'notifications' && (
              <div className="space-y-6">
                <p className="text-sm text-ink/60 -mt-2">
                  Choose which messages we send you and where they arrive. You
                  can change this any time.
                </p>

                <div className="space-y-3">
                  {notifRows.map((row) => (
                    <PrefRow
                      key={row.key}
                      label={row.label}
                      description={row.description}
                      checked={notif[row.key] ?? false}
                      onChange={(next) =>
                        setNotif((prev) => ({ ...prev, [row.key]: next }))
                      }
                    />
                  ))}
                </div>

                <div className="rounded-xl2 bg-paper border border-stone-line p-4">
                  <p className="text-sm font-medium text-neutral-800 mb-3">
                    Where should notifications arrive?
                  </p>
                  <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Notification channel">
                    {CHANNELS.map((c) => (
                      <button
                        key={c.value}
                        type="button"
                        role="radio"
                        aria-checked={notif.channel === c.value}
                        onClick={() =>
                          setNotif((prev) => ({ ...prev, channel: c.value }))
                        }
                        className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          notif.channel === c.value
                            ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-deep'
                            : 'border-outline-soft bg-white text-ink/70 hover:border-indigo-brand/40'
                        }`}
                      >
                        {notif.channel === c.value && (
                          <IconCheck className="h-4 w-4 text-indigo-brand" />
                        )}
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveNotifications} loading={savingNotif}>
                    Save preferences
                  </Button>
                </div>
              </div>
            )}

            {/* Payment methods */}
            {active === 'payments' && (
              <div className="space-y-6">
                <p className="text-sm text-ink/60 -mt-2">
                  Saved methods are offered at checkout so you can pay in a tap.
                  We only store the last 4 digits of cards — full numbers never
                  touch our servers.
                </p>

                {methods.length > 0 && (
                  <div className="space-y-3">
                    {methods.map((m) => (
                      <div
                        key={m._id}
                        className="rounded-xl2 bg-paper border border-stone-line p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="h-10 w-10 shrink-0 rounded-xl bg-white shadow-subtle flex items-center justify-center text-indigo-brand">
                            <IconCard className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="font-semibold text-ink truncate">
                              {m.label}
                            </p>
                            <p className="text-sm text-ink/50">
                              {m.type === 'UPI'
                                ? 'UPI'
                                : `${m.network} •••• ${m.last4 || 'XXXX'}`}
                              {m.isDefault && (
                                <span className="ml-2 inline-flex items-center rounded-full bg-indigo-brand/10 px-2 py-0.5 text-[11px] font-bold text-indigo-brand">
                                  DEFAULT
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 self-end sm:self-auto">
                          {!m.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(m._id)}
                              disabled={methodBusy === m._id}
                              className="text-sm font-semibold text-indigo-brand hover:text-indigo-deep disabled:opacity-50"
                            >
                              Set default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteMethod(m._id)}
                            disabled={methodBusy === m._id}
                            aria-label={`Remove ${m.label}`}
                            className="flex h-9 w-9 items-center justify-center rounded-lg text-ink/40 hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                          >
                            <IconTrash className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add a method */}
                <form
                  onSubmit={handleAddMethod}
                  className="rounded-xl2 border border-dashed border-outline-soft p-5"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="h-8 w-8 rounded-lg bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
                      <IconCard className="h-4 w-4" />
                    </span>
                    <h3 className="font-display font-bold text-lg text-ink">
                      Save a payment method
                    </h3>
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4" role="radiogroup" aria-label="Payment method type">
                    {['UPI', 'CARD'].map((t) => (
                      <button
                        key={t}
                        type="button"
                        role="radio"
                        aria-checked={addType === t}
                        onClick={() => setAddType(t)}
                        className={`rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                          addType === t
                            ? 'border-indigo-brand bg-indigo-brand/5 text-indigo-deep'
                            : 'border-outline-soft bg-white text-ink/70 hover:border-indigo-brand/40'
                        }`}
                      >
                        {t === 'UPI' ? 'UPI / QR' : 'Card'}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {addType === 'UPI' ? (
                      <Input
                        label="UPI ID"
                        placeholder="name@bank"
                        value={addUpi}
                        onChange={(e) => setAddUpi(e.target.value)}
                        helperText="e.g. yourname@okhdfcbank"
                      />
                    ) : (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <Select
                          label="Card network"
                          value={addNetwork}
                          onChange={(e) => setAddNetwork(e.target.value)}
                          options={CARD_NETWORKS.map((n) => ({ value: n, label: n }))}
                        />
                        <Input
                          label="Last 4 digits"
                          type="number"
                          maxLength={4}
                          placeholder="4242"
                          value={addLast4}
                          onChange={(e) => setAddLast4(e.target.value.slice(0, 4))}
                        />
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex justify-end">
                    <Button type="submit" loading={adding}>
                      Save method
                    </Button>
                  </div>
                </form>

                {role === 'OWNER' && (
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

            {/* Privacy */}
            {active === 'privacy' && (
              <div className="space-y-6">
                <p className="text-sm text-ink/60 -mt-2">
                  Decide how much of your profile is visible to other people on
                  the platform, and what happens to your data.
                </p>

                <div className="space-y-3">
                  <PrefRow
                    label="Share my contact with owners"
                    description="Owners see your phone number once a booking is approved, so you can coordinate move-in."
                    checked={privacy.showContact}
                    onChange={(next) =>
                      setPrivacy((prev) => ({ ...prev, showContact: next }))
                    }
                  />
                  <PrefRow
                    label="Public profile in applications"
                    description="When OFF, owners reviewing your booking request see only what's needed — name, gender and contact. When ON, they can view your full profile."
                    checked={privacy.profileVisibility === 'PUBLIC'}
                    onChange={(next) =>
                      setPrivacy((prev) => ({
                        ...prev,
                        profileVisibility: next ? 'PUBLIC' : 'PRIVATE',
                      }))
                    }
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={savePrivacy} loading={savingPrivacy}>
                    Save preferences
                  </Button>
                </div>

                {/* Your data */}
                <section className="pt-6 border-t border-ink/10">
                  <h3 className="font-display font-bold text-lg text-ink mb-1">
                    Your data
                  </h3>
                  <p className="text-ink/60 text-sm mb-4">
                    Take a copy of everything this account has on record — profile,
                    bookings, payments, reviews and saved listings — as a JSON file.
                  </p>
                  <Button variant="outline" onClick={handleExport} loading={exporting}>
                    <IconDownload className="h-4 w-4" />
                    Download my data
                  </Button>
                </section>

                {/* Danger zone */}
                <section className="pt-6 border-t border-ink/10">
                  <h3 className="font-display font-bold text-lg text-ink mb-1">
                    Delete account
                  </h3>
                  <p className="text-ink/60 text-sm mb-4">
                    Permanently close this account. You'll lose access to your
                    bookings and saved listings. This can't be undone.
                  </p>
                  <div className="rounded-xl2 bg-danger/5 border border-danger/20 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-xl bg-white shadow-subtle text-danger flex items-center justify-center">
                        <IconTrash className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="font-semibold text-ink">Close this account</p>
                        <p className="text-sm text-ink/50">
                          We'll first check nothing is left unfinished.
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteOpen(true)}
                    >
                      Delete account
                    </Button>
                  </div>
                </section>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <Modal
        open={deleteOpen}
        onClose={() => {
          if (!deleting) setDeleteOpen(false);
        }}
        title="Delete your account?"
        footer={
          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Keep my account
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteAccount}
              loading={deleting}
            >
              Delete permanently
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-ink/70">
            This removes your access immediately and anonymizes the account.
            Bookings, payments and reviews are kept for the owner's records.
          </p>
          <ul className="space-y-2 text-sm text-ink/70 list-disc pl-5">
            <li>Your profile, saved listings and payment methods are wiped.</li>
            <li>Pending booking requests are cancelled.</li>
            <li>If you own listings, remove them first — we'll stop you otherwise.</li>
            <li>Confirmed bookings must be cancelled (with refunds) first.</li>
          </ul>
          <div>
            <label htmlFor="del-confirm" className="block text-sm font-semibold text-neutral-800 mb-1.5">
              Type <span className="font-mono text-danger">DELETE</span> to confirm
            </label>
            <input
              id="del-confirm"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="DELETE"
              className="w-full h-11 px-4 rounded-[var(--radius-control)] border bg-white text-neutral-900 placeholder:text-neutral-400 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500 border-neutral-300 hover:border-neutral-400"
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}