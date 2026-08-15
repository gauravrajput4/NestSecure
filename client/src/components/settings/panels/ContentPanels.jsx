import Input from '../../Input.jsx';
import Select from '../../Select.jsx';
import Textarea from '../../Textarea.jsx';
import Toggle from '../../Toggle.jsx';
import SettingsSection from '../SettingsSection.jsx';
import SettingRow from '../SettingRow.jsx';
import BrandingImageField from '../BrandingImageField.jsx';
import { FEATURED_MODE_OPTIONS } from '../../../config/themes.js';

// Every panel here follows the same contract:
//   value  -> the draft object for this section
//   patch  -> (partial) => merge partial into the draft section
// This keeps panels presentational; the page owns state + persistence.

const CURRENCIES = [
  { value: 'INR', label: '₹ Indian Rupee (INR)' },
  { value: 'USD', label: '$ US Dollar (USD)' },
  { value: 'EUR', label: '€ Euro (EUR)' },
  { value: 'GBP', label: '£ British Pound (GBP)' },
  { value: 'AED', label: 'د.إ UAE Dirham (AED)' },
];

const TIME_FORMATS = [
  { value: '12h', label: '12-hour (1:30 PM)' },
  { value: '24h', label: '24-hour (13:30)' },
];

export function GeneralPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="General"
      description="Core identity and regional defaults for the site."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Site name"
          value={value.siteName || ''}
          onChange={(e) => patch({ siteName: e.target.value })}
          maxLength={80}
        />
        <Input
          label="Short name"
          helperText="Used in tight spaces like the navbar and tab title."
          value={value.shortName || ''}
          onChange={(e) => patch({ shortName: e.target.value })}
          maxLength={40}
        />
      </div>
      <Input
        label="Tagline"
        value={value.tagline || ''}
        onChange={(e) => patch({ tagline: e.target.value })}
        maxLength={120}
      />
      <Textarea
        label="Description"
        value={value.description || ''}
        onChange={(e) => patch({ description: e.target.value })}
        rows={3}
        maxLength={400}
        helperText="A one-line summary of the platform."
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Select
          label="Currency"
          options={CURRENCIES}
          value={value.currency || 'INR'}
          onChange={(e) => patch({ currency: e.target.value })}
        />
        <Input
          label="Currency symbol"
          value={value.currencySymbol || ''}
          onChange={(e) => patch({ currencySymbol: e.target.value })}
          maxLength={4}
        />
        <Select
          label="Time format"
          options={TIME_FORMATS}
          value={value.timeFormat || '12h'}
          onChange={(e) => patch({ timeFormat: e.target.value })}
        />
        <Input
          label="Timezone"
          value={value.timezone || ''}
          onChange={(e) => patch({ timezone: e.target.value })}
          placeholder="Asia/Kolkata"
        />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Support email"
          type="email"
          value={value.supportEmail || ''}
          onChange={(e) => patch({ supportEmail: e.target.value })}
        />
        <Input
          label="Support phone"
          value={value.supportPhone || ''}
          onChange={(e) => patch({ supportPhone: e.target.value })}
        />
      </div>
    </SettingsSection>
  );
}

// Branding: text fields go through the draft (`value`/`patch`); images are
// uploaded/removed immediately via `onUpload(slot, file)` / `onRemove(slot)`.
export function BrandingPanel({ value = {}, patch, images = {}, onUpload, onRemove }) {
  return (
    <SettingsSection
      title="Branding"
      description="Logos, favicon, and brand wording. Images upload immediately."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Brand name"
          value={value.brandName || ''}
          onChange={(e) => patch({ brandName: e.target.value })}
          maxLength={40}
        />
        <Input
          label="Brand tagline"
          value={value.brandTagline || ''}
          onChange={(e) => patch({ brandTagline: e.target.value })}
          maxLength={80}
        />
      </div>

      <div className="space-y-5 border-t border-neutral-200 pt-5">
        <BrandingImageField
          label="Primary logo"
          hint="Shown in the navbar and footer. PNG or SVG with transparent background works best."
          value={images.logo || ''}
          onUpload={(file) => onUpload('logo', file)}
          onRemove={() => onRemove('logo')}
        />
        <BrandingImageField
          label="Dark logo"
          hint="Optional light-colored logo for dark backgrounds."
          value={images.logoDark || ''}
          onUpload={(file) => onUpload('logoDark', file)}
          onRemove={() => onRemove('logoDark')}
        />
        <BrandingImageField
          label="Mobile logo"
          hint="Optional compact mark for small screens."
          aspect="square"
          value={images.logoMobile || ''}
          onUpload={(file) => onUpload('logoMobile', file)}
          onRemove={() => onRemove('logoMobile')}
        />
        <BrandingImageField
          label="Favicon"
          hint="Square icon shown in the browser tab. 512×512 recommended."
          aspect="square"
          value={images.favicon || ''}
          onUpload={(file) => onUpload('favicon', file)}
          onRemove={() => onRemove('favicon')}
        />
      </div>
    </SettingsSection>
  );
}

export function HomepagePanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Homepage"
      description="Hero copy and the featured properties strip on the landing page."
    >
      <Input
        label="Hero heading"
        value={value.heroHeading || ''}
        onChange={(e) => patch({ heroHeading: e.target.value })}
        maxLength={80}
      />
      <Textarea
        label="Hero subheading"
        value={value.heroSubheading || ''}
        onChange={(e) => patch({ heroSubheading: e.target.value })}
        rows={2}
        maxLength={240}
      />
      <SettingRow
        label="Show search in hero"
        description="Display the location search panel over the hero."
      >
        <Toggle
          checked={value.heroShowSearch !== false}
          onChange={(v) => patch({ heroShowSearch: v })}
        />
      </SettingRow>

      <div className="space-y-5 border-t border-neutral-200 pt-5">
        <SettingRow
          label="Featured section"
          description="Show a curated strip of properties on the homepage."
        >
          <Toggle
            checked={value.featuredEnabled !== false}
            onChange={(v) => patch({ featuredEnabled: v })}
          />
        </SettingRow>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Featured title"
            value={value.featuredTitle || ''}
            onChange={(e) => patch({ featuredTitle: e.target.value })}
            maxLength={60}
          />
          <Input
            label="Number of properties"
            type="number"
            min={3}
            max={24}
            value={value.featuredCount ?? 9}
            onChange={(e) => patch({ featuredCount: Number(e.target.value) })}
          />
        </div>
        <Select
          label="Selection method"
          options={FEATURED_MODE_OPTIONS}
          value={value.featuredMode || 'newest'}
          onChange={(e) => patch({ featuredMode: e.target.value })}
        />
      </div>
    </SettingsSection>
  );
}

export function FooterPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Footer"
      description="Content and links shown in the site footer."
    >
      <Textarea
        label="Footer description"
        value={value.description || ''}
        onChange={(e) => patch({ description: e.target.value })}
        rows={2}
        maxLength={240}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Contact email"
          value={value.email || ''}
          onChange={(e) => patch({ email: e.target.value })}
        />
        <Input
          label="Contact phone"
          value={value.phone || ''}
          onChange={(e) => patch({ phone: e.target.value })}
        />
      </div>
      <Input
        label="Address"
        value={value.address || ''}
        onChange={(e) => patch({ address: e.target.value })}
      />
      <Input
        label="Copyright line"
        value={value.copyright || ''}
        onChange={(e) => patch({ copyright: e.target.value })}
        helperText="The current year is added automatically."
      />
      <div className="space-y-4 border-t border-neutral-200 pt-5">
        <SettingRow label="Show logo" description="Display the brand mark in the footer.">
          <Toggle checked={value.showLogo !== false} onChange={(v) => patch({ showLogo: v })} />
        </SettingRow>
        <SettingRow label="Show product links" description="Explore, Help, and other quick links.">
          <Toggle
            checked={value.showProductLinks !== false}
            onChange={(v) => patch({ showProductLinks: v })}
          />
        </SettingRow>
        <SettingRow label="Show trust badges" description="Verified / secure-payment reassurance row.">
          <Toggle checked={value.showTrust !== false} onChange={(v) => patch({ showTrust: v })} />
        </SettingRow>
      </div>
    </SettingsSection>
  );
}

export function ContactPanel({ value = {}, patch }) {
  return (
    <SettingsSection
      title="Contact"
      description="How visitors reach support. Shown on the Help and contact surfaces."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Support email"
          type="email"
          value={value.supportEmail || ''}
          onChange={(e) => patch({ supportEmail: e.target.value })}
        />
        <Input
          label="Support phone"
          value={value.supportPhone || ''}
          onChange={(e) => patch({ supportPhone: e.target.value })}
        />
        <Input
          label="WhatsApp"
          value={value.whatsapp || ''}
          onChange={(e) => patch({ whatsapp: e.target.value })}
        />
        <Input
          label="Working hours"
          value={value.workingHours || ''}
          onChange={(e) => patch({ workingHours: e.target.value })}
          placeholder="Mon–Sat, 9am–7pm"
        />
      </div>
      <Input
        label="Address"
        value={value.address || ''}
        onChange={(e) => patch({ address: e.target.value })}
      />
      <Input
        label="Map link"
        value={value.mapLink || ''}
        onChange={(e) => patch({ mapLink: e.target.value })}
        placeholder="https://maps.google.com/…"
      />
    </SettingsSection>
  );
}

export function SocialPanel({ value = {}, patch }) {
  const fields = [
    ['instagram', 'Instagram'],
    ['facebook', 'Facebook'],
    ['linkedin', 'LinkedIn'],
    ['youtube', 'YouTube'],
    ['twitter', 'X / Twitter'],
  ];
  return (
    <SettingsSection
      title="Social links"
      description="Profile URLs shown in the footer. Leave blank to hide an icon."
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map(([key, label]) => (
          <Input
            key={key}
            label={label}
            value={value[key] || ''}
            onChange={(e) => patch({ [key]: e.target.value })}
            placeholder="https://…"
          />
        ))}
      </div>
    </SettingsSection>
  );
}
