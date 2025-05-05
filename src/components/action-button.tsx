import Link from 'next/link'
import type { FC } from 'react'
import type { LucideIcon } from 'lucide-react'

type ActionButtonProps = {
  icon: LucideIcon
  href?: string
  onClick?: () => void
  disabled?: boolean
  size?: number
  className?: string
}

export const ActionButton: FC<ActionButtonProps> = ({
  icon: Icon,
  href,
  onClick,
  disabled,
  size = 32,
  className = '',
}) => {
  const combinedClasses = `p-2 rounded-lg cursor-pointer duration-100 transform transition hover:bg-(--item) ease-in-out flex gap-2 items-center bg-(--card) disabled:cursor-not-allowed disabled:opacity-25 disabled:bg-transparent ${className}`
  if (href) {
    return (
      <Link className={combinedClasses} href={href}>
        <Icon size={size} />
      </Link>
    )
  }
  return (
    <button className={combinedClasses} onClick={onClick} disabled={disabled}>
      <Icon size={size} />
    </button>
  )
}
