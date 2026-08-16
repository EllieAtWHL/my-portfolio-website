'use client';

interface StatsIconButtonProps {
  onClick: () => void;
  className?: string;
}

// Icon-only trigger matching the original site's #stats-icon (a small,
// low-opacity chart glyph, not a filled button) - see myPortfolioWebsite/regicide/regicide.css.
// Deliberately a raw <button>, not the shared Button component: Button always
// carries filled background/padding styling, which is exactly what this
// control is meant to avoid. Noted as intentional in reference/BUTTON_MIGRATION.md.
export function StatsIconButton({ onClick, className = '' }: StatsIconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="View Statistics"
      className={`p-1.5 rounded-full border border-brand-dark text-brand-dark opacity-50 hover:opacity-100 focus-visible:opacity-100 dark:bg-dark-bg-1 dark:border-dark-gray-medium/40 dark:text-dark-gray-medium dark:opacity-100 dark:hover:border-dark-accent dark:hover:text-dark-accent dark:focus-visible:border-dark-accent dark:focus-visible:text-dark-accent transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-dark dark:focus-visible:ring-dark-accent focus-visible:ring-offset-2 ${className}`}
    >
      <svg xmlns="http://www.w3.org/2000/svg" height="20" width="20" fill="currentColor" aria-hidden="true">
        <title>See my stats</title>
        <path d="M2.333 15.792q-.521 0-.864-.344-.344-.344-.344-.865t.344-.864q.343-.344.843-.344.167 0 .292.031.125.032.25.073l4.542-4.541q-.084-.126-.115-.23-.031-.104-.031-.27 0-.5.344-.844t.864-.344q.521 0 .865.344t.344.864q0 .167-.105.48l3 2.979q.105-.042.23-.073.125-.032.25-.032.146 0 .27.021.126.021.23.105l3.02-3.021q-.062-.105-.083-.229-.021-.126-.021-.292 0-.5.344-.844t.865-.344q.521 0 .864.344.344.344.344.865t-.344.864q-.343.344-.843.344-.167 0-.292-.021-.125-.021-.229-.083l-3.021 3.021q.062.104.083.229.021.125.021.291 0 .5-.344.844t-.864.344q-.521 0-.865-.344t-.344-.844q0-.166.032-.291.031-.125.114-.25l-3-3q-.125.083-.26.114-.136.032-.261.032-.166 0-.479-.105l-4.5 4.521q0 .125.031.24.032.115.032.281 0 .5-.344.844t-.865.344ZM3.5 7.979l-.479-1-1-.479 1-.479.479-1 .479 1 1 .479-1 .479Zm9 0-.75-1.729-1.729-.75 1.729-.75.75-1.729.75 1.729 1.729.75-1.729.75Z" />
      </svg>
    </button>
  );
}
