interface SearchInputProps {
  id: string;
  label: string;
  // The public players index shows its label; the admin tab-panel search
  // boxes never had a visible one (just the placeholder + a heading nearby
  // for context) - sr-only keeps that exact visual behaviour while still
  // giving those inputs a proper accessible name, which they lacked before.
  srOnlyLabel?: boolean;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

// Shared label + text input for the "search/filter a list" boxes repeated
// across the Spurs Women public site and admin panel - see WEB-160. Doesn't
// own the surrounding wrapper div/margin or any result-count caption below
// it, since those vary per caller (e.g. the players index shows one, the
// admin panels don't) - only the label/input markup was ever identical.
export default function SearchInput({ id, label, srOnlyLabel = false, placeholder, value, onChange }: SearchInputProps) {
  return (
    <>
      <label htmlFor={id} className={srOnlyLabel ? 'sr-only' : 'block spurs-text text-xs font-medium mb-1'}>
        {label}
      </label>
      <input
        id={id}
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 rounded border border-[var(--spurs-input-border)] bg-[var(--spurs-input-bg)] text-[var(--spurs-input-text)] placeholder-[var(--spurs-input-placeholder)] focus:outline-none focus:ring-2 focus:ring-[var(--spurs-input-focus-ring)]"
      />
    </>
  );
}
