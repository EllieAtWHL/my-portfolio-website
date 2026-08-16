interface CookieIconProps {
  className?: string;
  size?: number;
}

export default function CookieIcon({ className = '', size = 20 }: CookieIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <circle cx="8.5" cy="8.5" r="0.5" fill="currentColor" />
      <circle cx="15.5" cy="10.5" r="0.5" fill="currentColor" />
      <circle cx="10" cy="15" r="0.5" fill="currentColor" />
      <circle cx="15" cy="15.5" r="0.5" fill="currentColor" />
    </svg>
  );
}
