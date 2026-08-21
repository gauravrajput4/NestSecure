import { useEffect, useRef } from 'react';

// Scroll-reveal wrapper. Adds `.is-visible` once the element enters the
// viewport, which flips the CSS `.reveal` utility to its settled state (opacity
// 1, no transform). Purely additive — the global reduced-motion media query
// disables the transition entirely, so content is never hidden for those users.
export default function Reveal({
  children,
  className = '',
  as: Tag = 'div',
  delay = 0,
  ...props
}) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Elements already in view on load should not wait for an observer tick.
    if (typeof IntersectionObserver === 'undefined') {
      el.classList.add('is-visible');
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add('is-visible');
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${className}`}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      {...props}
    >
      {children}
    </Tag>
  );
}