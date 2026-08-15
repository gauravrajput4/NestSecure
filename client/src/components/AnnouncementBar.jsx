import { useSiteSettings } from '../context/SiteSettingsContext.jsx';

// Site-wide announcement strip. Renders only when an admin has enabled it and
// supplied text, so it's invisible by default (§65). Style maps to the brand
// tokens; the marigold accent stays static for contrast across themes.
const STYLES = {
  primary: 'bg-indigo-brand text-white',
  accent: 'bg-marigold text-ink',
  neutral: 'bg-neutral-900 text-white',
};

export default function AnnouncementBar() {
  const { settings } = useSiteSettings();
  const a = settings?.announcement || {};

  const text = (a.text || '').trim();
  if (!a.active || !text) return null;

  const cls = STYLES[a.style] || STYLES.primary;

  const content = a.link ? (
    <a
      href={a.link}
      target={/^https?:\/\//.test(a.link) ? '_blank' : undefined}
      rel="noopener noreferrer"
      className="underline-offset-2 hover:underline"
    >
      {text}
    </a>
  ) : (
    text
  );

  return (
    <div
      className={`${cls} px-4 py-2 text-center text-sm font-medium`}
      role="region"
      aria-label="Site announcement"
    >
      {content}
    </div>
  );
}
