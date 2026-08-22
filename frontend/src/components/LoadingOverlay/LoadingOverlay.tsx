import logoImage from '../../assets/logo.png'

interface LoadingOverlayProps {
  label?: string
  compact?: boolean
  labelClassName?: string
}

function LoadingOverlay({ label, compact = false, labelClassName }: LoadingOverlayProps) {
  return (
    <div className={`flex h-full flex-1 flex-col items-center justify-center gap-3 ${compact ? 'py-6' : 'py-16'}`}>
      <div className="relative flex h-14 w-14 items-center justify-center">
        <span className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--border-panel)] border-t-[var(--color-primary)]" />
        <img src={logoImage} alt="" className="h-8 w-8 rounded-[50px] object-cover" />
      </div>
      {label && <p className={labelClassName ?? 'text-sm text-[var(--color-muted)]'}>{label}</p>}
    </div>
  )
}

export default LoadingOverlay
