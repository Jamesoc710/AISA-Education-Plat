/**
 * Hover treatment for the team-surface cards (`.team-card` containers with a
 * `.team-card-title`). Rendered once per team page. The accent is the team color
 * (scoped on the page root).
 *
 * Effect: bar + glow. On card hover, an accent bar sweeps in under the title and
 * the card lifts with a soft, team-colored glow.
 */
export function TeamHoverStyles() {
  return (
    <style>{`
      [data-surface="editorial"] .team-card {
        transition: box-shadow 200ms ease, transform 200ms ease;
      }
      [data-surface="editorial"] .team-card:hover {
        transform: translateY(-2px);
        box-shadow:
          0 2px 6px rgba(20, 20, 30, 0.05),
          0 10px 26px color-mix(in srgb, var(--color-accent) 16%, transparent);
      }

      [data-surface="editorial"] .team-card-title {
        position: relative;
        display: inline-block;
      }
      [data-surface="editorial"] .team-card-title::after {
        content: "";
        position: absolute;
        left: 0;
        bottom: -4px;
        height: 2px;
        width: 100%;
        background-color: var(--color-accent);
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1);
      }
      [data-surface="editorial"] .team-card:hover .team-card-title::after {
        transform: scaleX(1);
      }

      @media (prefers-reduced-motion: reduce) {
        [data-surface="editorial"] .team-card { transition: none; }
        [data-surface="editorial"] .team-card:hover { transform: none; }
        [data-surface="editorial"] .team-card-title::after { transition: none; }
      }
    `}</style>
  );
}
