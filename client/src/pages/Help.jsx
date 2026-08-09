import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
const IconSearch = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="M21 21l-4.3-4.3" />
  </Svg>
);
const IconBooking = (p) => (
  <Svg {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18M9 16l2 2 4-4" />
  </Svg>
);
const IconPayment = (p) => (
  <Svg {...p}>
    <rect x="2" y="5" width="20" height="14" rx="2" />
    <path d="M2 10h20" />
  </Svg>
);
const IconOwner = (p) => (
  <Svg {...p}>
    <path d="M3 21h18M5 21V8l7-5 7 5v13" />
    <path d="M9 21v-6h6v6" />
  </Svg>
);
const IconSafety = (p) => (
  <Svg {...p}>
    <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9.5 12l1.8 1.8 3.2-3.6" />
  </Svg>
);
const IconChevron = (p) => (
  <Svg {...p}>
    <path d="M9 6l6 6-6 6" />
  </Svg>
);
const IconLifebuoy = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="3.5" />
    <path d="M4.9 4.9l4.6 4.6M14.5 14.5l4.6 4.6M19.1 4.9l-4.6 4.6M9.5 14.5l-4.6 4.6" />
  </Svg>
);
const IconMail = (p) => (
  <Svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3 7l9 6 9-6" />
  </Svg>
);
const IconSpark = (p) => (
  <Svg {...p}>
    <path d="M12 3l1.8 4.9L18.7 9l-4.9 1.8L12 15.7l-1.8-4.9L5.3 9l4.9-1.1L12 3z" />
  </Svg>
);

// Static, self-contained knowledge base — no backend calls. Each topic groups
// a handful of real FAQs about how this platform works.
const TOPICS = [
  {
    id: 'booking',
    title: 'Booking a PG',
    icon: IconBooking,
    blurb: 'Finding rooms, sending requests, and moving in.',
    faqs: [
      {
        q: 'How do I book a room?',
        a: "Open a property, pick an available room, choose your move-in date and send a booking request. The owner reviews it, and once they approve you can pay to reserve your spot.",
      },
      {
        q: 'Why does my booking need owner approval?',
        a: "PG owners confirm each applicant themselves. After you send a request it sits as pending until the owner approves or declines — you'll only be asked to pay once it's approved.",
      },
      {
        q: 'Can I save PGs to compare later?',
        a: 'Yes. Tap the heart on any property to add it to your wishlist, then review them together from the Wishlist page in your account.',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Payments & Rent',
    icon: IconPayment,
    blurb: 'Paying rent, deposits, and getting refunds.',
    faqs: [
      {
        q: 'When do I pay rent?',
        a: 'After the owner approves your request you pay the first month plus any security deposit to confirm. Ongoing rent is tracked in your rent ledger, where you can pay each month.',
      },
      {
        q: 'How do refunds work if I cancel?',
        a: 'Cancelling shows a refund preview before you confirm, based on how far ahead of your move-in date you cancel. Approved refunds are reversed to your original payment method.',
      },
      {
        q: 'Is my payment secure?',
        a: 'Payments are processed through a secure payment gateway. We never store your full card details on our servers.',
      },
    ],
  },
  {
    id: 'owners',
    title: 'For PG Owners',
    icon: IconOwner,
    blurb: 'Listing properties, tenants, and payouts.',
    faqs: [
      {
        q: 'How do I list my PG?',
        a: "From your owner dashboard choose Add New Listing and follow the guided steps — basic details, location, amenities, rooms and pricing, then photos. Publish when you're ready.",
      },
      {
        q: 'Where do I approve tenants?',
        a: 'Incoming applications appear under Tenant Requests. You can review each applicant, approve to let them pay, or decline with an optional reason.',
      },
      {
        q: 'How do I receive rent payouts?',
        a: "Add your payout details from your profile's Professional Settings. Once your payout account is active, collected rent can be routed to you.",
      },
    ],
  },
  {
    id: 'safety',
    title: 'Trust & Safety',
    icon: IconSafety,
    blurb: 'Verification, privacy, and staying safe.',
    faqs: [
      {
        q: 'What does the Verified badge mean?',
        a: 'A verified badge means the person completed ID/selfie verification. Owners can see a tenant’s verification status when reviewing requests.',
      },
      {
        q: 'How do I verify my account?',
        a: 'Open your profile and complete the selfie verification step. Once reviewed, your account shows a verified badge to build trust with owners.',
      },
      {
        q: 'How is my personal information handled?',
        a: 'We only share what an owner needs to review your booking, such as your name, gender and contact number. Sensitive details are never shown publicly.',
      },
    ],
  },
];

const TOPIC_TINT = {
  booking: 'bg-info/10 text-info',
  payments: 'bg-success/10 text-success',
  owners: 'bg-indigo-brand/10 text-indigo-brand',
  safety: 'bg-danger/10 text-danger',
};

export default function Help() {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(null); // `${topicId}-${index}`

  const q = query.trim().toLowerCase();

  // Client-side filter across topic titles and every Q/A.
  const results = useMemo(() => {
    if (!q) return TOPICS;
    return TOPICS.map((t) => {
      const faqs = t.faqs.filter(
        (f) =>
          f.q.toLowerCase().includes(q) ||
          f.a.toLowerCase().includes(q) ||
          t.title.toLowerCase().includes(q)
      );
      return { ...t, faqs };
    }).filter((t) => t.faqs.length > 0);
  }, [q]);

  const totalMatches = results.reduce((s, t) => s + t.faqs.length, 0);

  return (
    <div className="min-h-screen bg-paper">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ink via-ink-soft to-indigo-brand text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/60 mb-3">
            NestSecure PG · Help Center
          </p>
          <h1 className="font-display font-extrabold text-3xl sm:text-5xl leading-tight">
            How can we help?
          </h1>
          <p className="text-white/70 mt-3 max-w-xl mx-auto">
            Search our guides on booking, payments, listing your PG, and staying
            safe.
          </p>

          {/* Search */}
          <div className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-ink/40">
                <IconSearch className="h-5 w-5" />
              </span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search help articles…"
                aria-label="Search help articles"
                className="w-full h-control-lg pl-12 pr-4 rounded-xl2 bg-white text-ink shadow-lift placeholder:text-ink/40 focus:outline-none focus:ring-2 focus:ring-white/60"
              />
            </div>
            {q && (
              <p className="text-sm text-white/70 mt-3">
                {totalMatches} result{totalMatches === 1 ? '' : 's'} for
                &ldquo;{query}&rdquo;
              </p>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* No results */}
        {results.length === 0 ? (
          <div className="bg-white rounded-xl2 shadow-card p-12 text-center">
            <span className="mx-auto h-14 w-14 rounded-full bg-indigo-brand/10 text-indigo-brand flex items-center justify-center">
              <IconSearch className="h-7 w-7" />
            </span>
            <h2 className="font-display font-bold text-xl text-ink mt-4">
              No articles match &ldquo;{query}&rdquo;
            </h2>
            <p className="text-ink/60 mt-2">
              Try a different term, or reach out and we'll point you in the right
              direction.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-5 text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
            >
              Clear search
            </button>
          </div>
        ) : (
          <>
            {/* Topic browser (only when not searching) */}
            {!q && (
              <>
                <h2 className="font-display font-bold text-2xl text-ink mb-5">
                  Browse by topic
                </h2>
                <div className="grid gap-4 sm:grid-cols-2 mb-12">
                  {TOPICS.map((t) => {
                    const Icon = t.icon;
                    return (
                      <a
                        key={t.id}
                        href={`#${t.id}`}
                        className="group bg-white rounded-xl2 shadow-card p-5 flex items-start gap-4 hover:shadow-lift transition"
                      >
                        <span
                          className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                            TOPIC_TINT[t.id] || 'bg-indigo-brand/10 text-indigo-brand'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                        </span>
                        <div className="min-w-0">
                          <h3 className="font-display font-bold text-lg text-ink flex items-center gap-1">
                            {t.title}
                            <IconChevron className="h-4 w-4 text-ink/30 group-hover:translate-x-0.5 group-hover:text-indigo-brand transition" />
                          </h3>
                          <p className="text-sm text-ink/60 mt-0.5">
                            {t.blurb}
                          </p>
                          <p className="text-xs font-semibold text-ink/40 mt-2">
                            {t.faqs.length} articles
                          </p>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </>
            )}

            {/* FAQ accordion sections */}
            <div className="space-y-10">
              {results.map((t) => {
                const Icon = t.icon;
                return (
                  <section key={t.id} id={t.id} className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-4">
                      <span
                        className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          TOPIC_TINT[t.id] || 'bg-indigo-brand/10 text-indigo-brand'
                        }`}
                      >
                        <Icon className="h-5 w-5" />
                      </span>
                      <h2 className="font-display font-bold text-xl text-ink">
                        {t.title}
                      </h2>
                    </div>

                    <div className="bg-white rounded-xl2 shadow-card divide-y divide-ink/10 overflow-hidden">
                      {t.faqs.map((f, i) => {
                        const key = `${t.id}-${i}`;
                        const isOpen = open === key;
                        return (
                          <div key={key}>
                            <button
                              type="button"
                              onClick={() => setOpen(isOpen ? null : key)}
                              aria-expanded={isOpen}
                              className="w-full flex items-center justify-between gap-4 text-left px-5 py-4 hover:bg-paper/60 transition"
                            >
                              <span className="font-semibold text-ink">
                                {f.q}
                              </span>
                              <IconChevron
                                className={`h-5 w-5 shrink-0 text-ink/40 transition-transform ${
                                  isOpen ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                            {isOpen && (
                              <div className="px-5 pb-5 -mt-1">
                                <p className="text-ink/70 leading-relaxed">
                                  {f.a}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
            </div>
          </>
        )}

        {/* Featured article + contact */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] mt-12">
          <section className="rounded-xl2 bg-white shadow-card overflow-hidden">
            <div className="bg-indigo-brand/5 px-6 py-3 flex items-center gap-2">
              <IconSpark className="h-4 w-4 text-indigo-brand" />
              <span className="font-mono text-xs uppercase tracking-[0.2em] text-indigo-brand">
                Featured article
              </span>
            </div>
            <div className="p-6">
              <h3 className="font-display font-bold text-xl text-ink">
                A first-timer's guide to booking a PG with confidence
              </h3>
              <p className="text-ink/60 mt-2">
                From shortlisting verified properties to understanding your
                deposit and refund window — here's everything to check before you
                send that first booking request.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <a
                  href="#booking"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
                >
                  Read booking basics
                  <IconChevron className="h-4 w-4" />
                </a>
                <a
                  href="#payments"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
                >
                  Understand refunds
                  <IconChevron className="h-4 w-4" />
                </a>
              </div>
            </div>
          </section>

          <section className="rounded-xl2 bg-ink text-white shadow-lift p-6 flex flex-col">
            <span className="h-11 w-11 rounded-xl bg-white/10 flex items-center justify-center">
              <IconLifebuoy className="h-6 w-6" />
            </span>
            <h3 className="font-display font-bold text-xl mt-4">
              Need more help?
            </h3>
            <p className="text-white/70 mt-2 text-sm flex-1">
              Can't find what you're looking for? Our support team is happy to
              help with bookings, payments and listings.
            </p>
            <a
              href="mailto:support@nestsecure.example"
              className="mt-5 inline-flex items-center justify-center gap-2 h-control rounded-xl bg-white text-ink font-semibold hover:bg-white/90 transition"
            >
              <IconMail className="h-5 w-5" />
              Contact support
            </a>
            <p className="text-white/40 text-xs mt-3 text-center">
              Typical reply within one business day.
            </p>
          </section>
        </div>

        {/* Back to explore */}
        <div className="text-center mt-10">
          <Link
            to="/"
            className="text-sm font-semibold text-indigo-brand hover:text-indigo-deep"
          >
            ← Back to exploring PGs
          </Link>
        </div>
      </div>
    </div>
  );
}
