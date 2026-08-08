interface Tab<K extends string> {
  key: K;
  label: string;
  /** Id of the element this tab controls - when provided, wires aria-controls
   * to it. Omit when the tab's content isn't a single addressable element
   * (e.g. admin's top-level tabs, whose content is scattered across several
   * separately-conditional blocks rather than one panel). */
  panelId?: string;
}

interface TabNavProps<K extends string> {
  tabs: Tab<K>[];
  activeKey: K;
  onChange: (key: K) => void;
  className?: string;
}

export function TabNav<K extends string>({
  tabs,
  activeKey,
  onChange,
  className = 'flex flex-wrap gap-2',
}: TabNavProps<K>) {
  return (
    <div className={className} role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            id={`tab-${tab.key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={tab.panelId}
            onClick={() => onChange(tab.key)}
            className={`px-3 py-2 font-medium transition-all duration-200 rounded-t-lg text-sm ${
              isActive ? 'spurs-text' : 'text-gray-300 hover:text-spurs-accent'
            }`}
            style={{
              backgroundColor: isActive ? 'var(--spurs-dark-bg-1)' : 'var(--spurs-dark-opacity-30)',
              borderBottomColor: isActive ? 'var(--spurs-dark-accent)' : 'transparent',
              borderBottomWidth: isActive ? '2px' : '0',
              color: isActive ? 'var(--spurs-dark-accent)' : '#d1d5db',
            }}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
