interface IconProps {
  className?: string
}

function base(className?: string) {
  return {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}

export function DownloadIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
    </svg>
  )
}

export function PrinterIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 14h12v7H6z" />
    </svg>
  )
}

export function PlusIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

export function TrashIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
    </svg>
  )
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  )
}

export function CheckIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  )
}

export function XIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  )
}

export function ResetIcon({ className }: IconProps) {
  return (
    <svg {...base(className)}>
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
    </svg>
  )
}
