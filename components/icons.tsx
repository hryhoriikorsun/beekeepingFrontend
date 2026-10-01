/// Line icons from the design handoff: 24-grid, stroke 2.75, round caps.
type IconProps = { size?: number; className?: string };

const base = (size: number) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.75,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
});

export function HiveIcon({ size = 20, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 2c-1.5 2-2 3.5-2 5 0 1.5.8 2.3 2 2.3s2-.8 2-2.3c0-1.5-.5-3-2-5Z" />
      <path d="M7 12c0-2 2-3 5-3s5 1 5 3v6c0 2-2 3-5 3s-5-1-5-3z" />
      <path d="M7 15h10" />
      <path d="M7 18h10" />
    </svg>
  );
}

export function BasketIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
      <path d="M3 6h18" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

export function TrashIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="m12 19-7-7 7-7" />
      <path d="M19 12H5" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M5 12h14" />
      <path d="m12 5 7 7-7 7" />
    </svg>
  );
}

export function ArrowDownIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12 5v14" />
      <path d="m19 12-7 7-7-7" />
    </svg>
  );
}

export function PauseIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </svg>
  );
}

export function PlayIcon({ size = 18, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M7 4.5v15l12-7.5Z" />
    </svg>
  );
}

export function TruckIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
      <path d="M15 18H9" />
      <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
      <circle cx="17" cy="18" r="2" />
      <circle cx="7" cy="18" r="2" />
    </svg>
  );
}

export function TagIcon({ size = 16, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4Z" />
      <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
    </svg>
  );
}

export function MenuIcon({ size = 24, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function CloseIcon({ size = 22, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function LockIcon({ size = 14, className }: IconProps) {
  return (
    <svg {...base(size)} className={className}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  );
}

/// Solid, unlike the rest: the admin entry is a mode switch, not a link
/// among links, and the fill is what sets it apart in the header.
export function ShieldIcon({ size = 20, className }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      focusable="false"
      className={className}
    >
      <path d="M12 2.2 4.5 5.3v6c0 4.6 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.9 7.5-10.5v-6L12 2.2Z" />
      <path
        d="m8.8 11.8 2.2 2.2 4.2-4.2"
        fill="none"
        stroke="#f5ead8"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
