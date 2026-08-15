import Input from '../../Input.jsx';
import Select from '../../Select.jsx';
import Textarea from '../../Textarea.jsx';
import Toggle from '../../Toggle.jsx';
import SettingsSection from '../SettingsSection.jsx';
import SettingRow from '../SettingRow.jsx';
import { ANNOUNCEMENT_STYLE_OPTIONS } from '../../../config/themes.js';

// Small inline note used to flag stored-but-not-yet-enforced business rules and
// security guarantees. Keeps the honesty explicit in the UI.
function Note({ tone = 'info', children }) {
  const tones = {
    info: 'bg-indigo-brand/5 text-neutral-600 border-indigo-brand/20',
    warning: 'bg-warning/10 text-warning-700 border-warning/30',
  };
  return (
    <p className={`rounded-lg border px-3 py-2 text-xs leading-relaxed ${tones[tone]}`}>
      {children}
    </p>
  );
}

export function NavigationPanel({ value = {}, patch }) {
  const rows = [
    ['sticky', 'Sticky header', 'Keep the navbar pinned while scrolling.'],
    ['showSearch', 'Show search', 'Search entry point in the navbar.'],
    ['showWishlist', 'Show wishlist', 'Wishlist link for signed-in users.'],
    ['showAuthButtons', 'Show sign in / register', 'Auth buttons for signed-out visitors.'],
    ['showOwnerPortal', 'Show owner portal', 'Owner dashboard entry point.'],
    ['showContact', 'Show contact', 'Contact link in the menu.'],
    ['showHelp', 'Show help', 'Help center link in the menu.'],
  ];
  return (
    <SettingsSection
      title="Navigation"
      description="Toggle navbar elements. Hiding a link only removes it from the menu — its page stays reachable by URL."
    >
      {rows.map(([key, label, desc]) => (
        <SettingRow key={key} label={label} description={desc}>
          <Toggle checked={value[key] !== false} onChange={(v) => patch({ [key]: v })} />
        </SettingRow>
      ))}
    </SettingsSection>
  );
}

export function AnnouncementPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Announcement bar"
      description="A dismissible banner shown site-wide above the navbar."
    >
      <SettingRow label="Enable announcement" description="Show the banner to all visitors.">
        <Toggle checked={!!value.enabled} onChange={(v) => patch({ enabled: v })} />
      </SettingRow>
      <Textarea
        label="Message"
        value={value.text || ''}
        onChange={(e) => patch({ text: e.target.value })}
        rows={2}
        maxLength={200}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Link (optional)"
          value={value.link || ''}
          onChange={(e) => patch({ link: e.target.value })}
          placeholder="https://…"
        />
        <Select
          label="Style"
          options={ANNOUNCEMENT_STYLE_OPTIONS}
          value={value.style || 'primary'}
          onChange={(e) => patch({ style: e.target.value })}
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Start date (optional)"
          type="date"
          value={toDateInput(value.startDate)}
          onChange={(e) => patch({ startDate: e.target.value || null })}
        />
        <Input
          label="End date (optional)"
          type="date"
          value={toDateInput(value.endDate)}
          onChange={(e) => patch({ endDate: e.target.value || null })}
        />
      </div>
    </SettingsSection>
  );
}

export function BookingPanel({ value = {}, patch }) {
  const feeTypes = [
    { value: 'percentage', label: 'Percentage of booking' },
    { value: 'fixed', label: 'Fixed amount' },
  ];
  return (
    <SettingsSection
      title="Booking rules"
      description="Defaults for booking durations, approvals, and cancellations."
    >
      <Note>
        These values are saved and fully manageable here. They will govern the
        booking and cancellation flows once enforcement is switched on — the
        current checkout logic is unchanged in this release.
      </Note>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Min duration (months)"
          type="number"
          min={1}
          max={60}
          value={value.minDurationMonths ?? 1}
          onChange={(e) => patch({ minDurationMonths: Number(e.target.value) })}
        />
        <Input
          label="Max duration (months)"
          type="number"
          min={1}
          max={120}
          value={value.maxDurationMonths ?? 12}
          onChange={(e) => patch({ maxDurationMonths: Number(e.target.value) })}
        />
        <Input
          label="Advance booking window (days)"
          type="number"
          min={0}
          max={365}
          value={value.advanceBookingDays ?? 90}
          onChange={(e) => patch({ advanceBookingDays: Number(e.target.value) })}
        />
        <Input
          label="Free cancellation window (hours)"
          type="number"
          min={0}
          max={720}
          value={value.freeCancellationHours ?? 48}
          onChange={(e) => patch({ freeCancellationHours: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-4 border-t border-neutral-200 pt-5">
        <SettingRow label="Allow instant booking" description="Skip the approval step for confirmed rooms.">
          <Toggle checked={!!value.allowInstantBooking} onChange={(v) => patch({ allowInstantBooking: v })} />
        </SettingRow>
        <SettingRow label="Require owner approval" description="Owner must approve each request.">
          <Toggle checked={value.requireOwnerApproval !== false} onChange={(v) => patch({ requireOwnerApproval: v })} />
        </SettingRow>
        <SettingRow label="Require admin approval" description="An admin signs off before confirmation.">
          <Toggle checked={!!value.requireAdminApproval} onChange={(v) => patch({ requireAdminApproval: v })} />
        </SettingRow>
        <SettingRow label="Allow cancellations" description="Let guests cancel a booking.">
          <Toggle checked={value.cancellationAllowed !== false} onChange={(v) => patch({ cancellationAllowed: v })} />
        </SettingRow>
      </div>
      <div className="grid gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-2">
        <Select
          label="Cancellation fee type"
          options={feeTypes}
          value={value.cancellationFeeType || 'percentage'}
          onChange={(e) => patch({ cancellationFeeType: e.target.value })}
        />
        <Input
          label="Cancellation fee value"
          type="number"
          min={0}
          value={value.cancellationFeeValue ?? 0}
          onChange={(e) => patch({ cancellationFeeValue: Number(e.target.value) })}
        />
      </div>
    </SettingsSection>
  );
}

export function PaymentsPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Payments"
      description="Payment options and platform charges."
    >
      <Note tone="warning">
        Secret keys (Razorpay secret, JWT secret, database URI, SMTP password)
        are configured on the server and are never shown or editable here. These
        settings are saved and will apply to checkout once enforcement is enabled.
      </Note>
      <div className="space-y-4">
        <SettingRow label="Online payments" description="Accept online payments at checkout.">
          <Toggle checked={value.enableOnline !== false} onChange={(v) => patch({ enableOnline: v })} />
        </SettingRow>
        <SettingRow label="Pay at property" description="Allow paying on arrival.">
          <Toggle checked={!!value.enablePayAtProperty} onChange={(v) => patch({ enablePayAtProperty: v })} />
        </SettingRow>
        <SettingRow label="Razorpay" description="Use Razorpay as the online gateway.">
          <Toggle checked={value.enableRazorpay !== false} onChange={(v) => patch({ enableRazorpay: v })} />
        </SettingRow>
      </div>
      <div className="grid gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-2">
        <Input
          label="Minimum booking amount"
          type="number"
          min={0}
          value={value.minBookingAmount ?? 0}
          onChange={(e) => patch({ minBookingAmount: Number(e.target.value) })}
        />
        <Input
          label="Booking fee"
          type="number"
          min={0}
          value={value.bookingFee ?? 0}
          onChange={(e) => patch({ bookingFee: Number(e.target.value) })}
        />
        <Input
          label="Platform fee (%)"
          type="number"
          min={0}
          max={100}
          value={value.platformFeePercent ?? 0}
          onChange={(e) => patch({ platformFeePercent: Number(e.target.value) })}
        />
        <Input
          label="Tax (%)"
          type="number"
          min={0}
          max={100}
          value={value.taxPercent ?? 0}
          onChange={(e) => patch({ taxPercent: Number(e.target.value) })}
        />
      </div>
    </SettingsSection>
  );
}

export function RegistrationPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Registration"
      description="Who can create accounts and what's required."
    >
      <div className="space-y-4">
        <SettingRow label="Allow guest sign-up" description="Let renters create accounts.">
          <Toggle checked={value.enableUser !== false} onChange={(v) => patch({ enableUser: v })} />
        </SettingRow>
        <SettingRow label="Allow owner sign-up" description="Let property owners register.">
          <Toggle checked={value.enableOwner !== false} onChange={(v) => patch({ enableOwner: v })} />
        </SettingRow>
        <SettingRow label="Require email verification" description="New accounts confirm their email first.">
          <Toggle checked={!!value.requireEmailVerification} onChange={(v) => patch({ requireEmailVerification: v })} />
        </SettingRow>
        <SettingRow label="Approve owners manually" description="An admin reviews each owner sign-up.">
          <Toggle checked={!!value.requireAdminApprovalOwners} onChange={(v) => patch({ requireAdminApprovalOwners: v })} />
        </SettingRow>
      </div>
    </SettingsSection>
  );
}

export function SeoPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="SEO & meta"
      description="How the site appears in search results and social shares."
    >
      <Input
        label="Default page title"
        value={value.defaultTitle || ''}
        onChange={(e) => patch({ defaultTitle: e.target.value })}
        maxLength={120}
      />
      <Textarea
        label="Meta description"
        value={value.metaDescription || ''}
        onChange={(e) => patch({ metaDescription: e.target.value })}
        rows={2}
        maxLength={320}
      />
      <Input
        label="Keywords"
        value={value.metaKeywords || ''}
        onChange={(e) => patch({ metaKeywords: e.target.value })}
        helperText="Comma-separated."
      />
      <div className="grid gap-5 border-t border-neutral-200 pt-5 sm:grid-cols-2">
        <Input
          label="Open Graph title"
          value={value.ogTitle || ''}
          onChange={(e) => patch({ ogTitle: e.target.value })}
        />
        <Input
          label="Open Graph image URL"
          value={value.ogImage || ''}
          onChange={(e) => patch({ ogImage: e.target.value })}
          placeholder="https://…"
        />
        <Input
          label="Twitter image URL"
          value={value.twitterImage || ''}
          onChange={(e) => patch({ twitterImage: e.target.value })}
          placeholder="https://…"
        />
        <Input
          label="Canonical domain"
          value={value.canonicalDomain || ''}
          onChange={(e) => patch({ canonicalDomain: e.target.value })}
          placeholder="https://nestsecure.example"
        />
      </div>
      <SettingRow
        label="Allow search indexing"
        description="When off, sends noindex/nofollow to crawlers."
      >
        <Toggle checked={value.robotsIndex !== false} onChange={(v) => patch({ robotsIndex: v })} />
      </SettingRow>
    </SettingsSection>
  );
}

export function NotificationsPanel({ value = {}, patch }) {
  const rows = [
    ['bookingConfirmation', 'Booking confirmation', 'Email guests when a booking is confirmed.'],
    ['cancellation', 'Cancellation', 'Email when a booking is cancelled.'],
    ['refund', 'Refund', 'Email when a refund is processed.'],
    ['paymentConfirmation', 'Payment confirmation', 'Email on successful payment.'],
    ['ownerBooking', 'Owner: new booking', 'Notify owners of new requests.'],
    ['adminBooking', 'Admin: new booking', 'Notify admins of new bookings.'],
    ['welcome', 'Welcome email', 'Greet new accounts on sign-up.'],
  ];
  return (
    <SettingsSection
      title="Notifications"
      description="Transactional emails the platform sends. Delivery depends on your mail configuration."
    >
      {rows.map(([key, label, desc]) => (
        <SettingRow key={key} label={label} description={desc}>
          <Toggle checked={value[key] !== false} onChange={(v) => patch({ [key]: v })} />
        </SettingRow>
      ))}
    </SettingsSection>
  );
}

export function MaintenancePanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Maintenance mode"
      description="Take the site offline for visitors while you work. Admins always retain full access."
    >
      <Note tone="warning">
        When enabled, non-admin visitors see the maintenance screen and the API
        returns 503 for protected routes. Admins bypass it automatically, so you
        won't lock yourself out.
      </Note>
      <SettingRow label="Enable maintenance mode" description="Show the maintenance screen to visitors.">
        <Toggle checked={!!value.enabled} onChange={(v) => patch({ enabled: v })} />
      </SettingRow>
      <Input
        label="Title"
        value={value.title || ''}
        onChange={(e) => patch({ title: e.target.value })}
        maxLength={80}
      />
      <Textarea
        label="Message"
        value={value.message || ''}
        onChange={(e) => patch({ message: e.target.value })}
        rows={2}
        maxLength={240}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Estimated return"
          value={value.estimatedReturn || ''}
          onChange={(e) => patch({ estimatedReturn: e.target.value })}
          placeholder="e.g. Today, 6 PM IST"
        />
      </div>
      <SettingRow label="Allow owner access" description="Let property owners through during maintenance.">
        <Toggle checked={!!value.allowOwnerAccess} onChange={(v) => patch({ allowOwnerAccess: v })} />
      </SettingRow>
    </SettingsSection>
  );
}

export function SecurityPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Security"
      description="Session and authentication policy defaults."
    >
      <Note tone="warning">
        No secrets are stored or shown here. Password/session policy values below
        are saved and will apply once enforcement is enabled; core auth is
        unchanged in this release.
      </Note>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Session timeout (minutes)"
          type="number"
          min={5}
          max={43200}
          value={value.sessionTimeoutMinutes ?? 10080}
          onChange={(e) => patch({ sessionTimeoutMinutes: Number(e.target.value) })}
        />
        <Input
          label="Max login attempts"
          type="number"
          min={3}
          max={50}
          value={value.maxLoginAttempts ?? 10}
          onChange={(e) => patch({ maxLoginAttempts: Number(e.target.value) })}
        />
      </div>
      <div className="space-y-4 border-t border-neutral-200 pt-5">
        <SettingRow label="Require email verification" description="Users must verify email before access.">
          <Toggle checked={!!value.requireEmailVerification} onChange={(v) => patch({ requireEmailVerification: v })} />
        </SettingRow>
        <SettingRow label="Require strong passwords" description="Enforce complexity on new passwords.">
          <Toggle checked={!!value.requireStrongPassword} onChange={(v) => patch({ requireStrongPassword: v })} />
        </SettingRow>
        <SettingRow
          label="Enable maintenance restrictions"
          description="Master switch for the maintenance-mode gate. Turn off to keep the API open even when maintenance is on."
        >
          <Toggle
            checked={value.enableMaintenanceRestrictions !== false}
            onChange={(v) => patch({ enableMaintenanceRestrictions: v })}
          />
        </SettingRow>
      </div>
    </SettingsSection>
  );
}

export function AdvancedPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Advanced"
      description="Performance and platform options."
    >
      <SettingRow
        label="Cache public settings"
        description="Serve public settings from an in-memory cache (faster; refreshes on save)."
      >
        <Toggle checked={value.cachePublicSettings !== false} onChange={(v) => patch({ cachePublicSettings: v })} />
      </SettingRow>
      <SettingRow
        label="Show “Powered by” credit"
        description="Display a small platform credit in the footer."
      >
        <Toggle checked={value.showPoweredBy !== false} onChange={(v) => patch({ showPoweredBy: v })} />
      </SettingRow>
    </SettingsSection>
  );
}

// Date -> yyyy-mm-dd for <input type=date>; tolerant of null/ISO strings.
function toDateInput(v) {
  if (!v) return '';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}
