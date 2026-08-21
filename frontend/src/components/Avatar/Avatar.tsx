interface AvatarProps {
  label: string
  onClick?: () => void
  size?: 'sm' | 'md'
}

const SIZE_CLASSES = {
  sm: 'h-5 w-5 text-[10px]',
  md: 'h-9 w-9 text-base',
}

function Avatar({ label, onClick, size = 'md' }: AvatarProps) {
  const initial = label.slice(0, 1).toUpperCase()

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="User menu"
      className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full bg-[var(--color-primary-strong)] font-medium text-white ${SIZE_CLASSES[size]}`}
    >
      {initial}
    </button>
  )
}

export default Avatar
