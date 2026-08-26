interface CollapsibleFormSectionProps {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  controlsId: string;
  children: React.ReactNode;
}

export function CollapsibleFormSection({ title, isOpen, onToggle, controlsId, children }: CollapsibleFormSectionProps) {
  return (
    <div className="border border-gray-600 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full px-4 py-3 bg-gray-800 hover:bg-gray-700 flex items-center justify-between transition-colors"
        style={{
          backgroundColor: isOpen ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
          borderColor: isOpen ? 'var(--spurs-dark-accent)' : 'transparent',
          borderWidth: isOpen ? '2px' : '0',
        }}
        aria-expanded={isOpen}
        aria-controls={controlsId}
      >
        <span className="font-medium text-white">{title}</span>
        <span className="text-gray-400 transform transition-transform">
          {isOpen ? '▼' : '▶'}
        </span>
      </button>

      {isOpen && (
        <div id={controlsId} className="p-4 space-y-4 bg-gray-800/50">
          {children}
        </div>
      )}
    </div>
  );
}
