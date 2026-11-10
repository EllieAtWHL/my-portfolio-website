import type { VictoryMedal } from '@/hooks/useRegicideGame';

export const MEDAL_ORDER: VictoryMedal[] = ['gold', 'silver', 'bronze'];

export const MEDAL_LABEL: Record<VictoryMedal, string> = {
  gold: 'Gold',
  silver: 'Silver',
  bronze: 'Bronze',
};

const MEDAL_COLOR: Record<VictoryMedal, string> = {
  gold: 'text-amber-500 dark:text-amber-400',
  silver: 'text-slate-400 dark:text-slate-300',
  bronze: 'text-orange-700 dark:text-orange-500',
};

export function MedalIcon({ medal, className = 'w-6 h-6' }: { medal: VictoryMedal; className?: string }) {
  return (
    <svg
      className={`flex-shrink-0 ${MEDAL_COLOR[medal]} ${className}`}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle cx="12" cy="15" r="6" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.5 10L5 3h4l3 6 3-6h4l-3.5 7" />
    </svg>
  );
}
