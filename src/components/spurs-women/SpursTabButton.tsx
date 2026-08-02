'use client';

interface SpursTabButtonProps {
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export default function SpursTabButton({ isActive, onClick, disabled, children }: SpursTabButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm border-b-2 ${
        isActive
          ? 'text-[var(--spurs-dark-accent)] bg-[var(--spurs-dark-bg-1)] border-[var(--spurs-dark-accent)]'
          : 'text-gray-300 hover:text-[var(--spurs-dark-accent)] bg-[var(--spurs-dark-opacity-30)] border-transparent'
      }`}
    >
      {children}
    </button>
  );
}
