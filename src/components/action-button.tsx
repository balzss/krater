import Link from 'next/link'
import type { FC } from 'react'
import type { LucideIcon } from 'lucide-react'

type ActionButtonProps = {
  icon: LucideIcon
  href?: string
  onClick?: () => void
  disabled?: boolean
  size?: number
}

export const ActionButton: FC<ActionButtonProps> = ({
  icon: Icon,
  href,
  onClick,
  disabled,
  size = 32,
}) => {
  const className =
    'p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer duration-100 transform transition hover:bg-(--item) ease-in-out flex gap-2 items-center min-h-12 bg-(--card) disabled:cursor-not-allowed disabled:opacity-25 disabled:bg-transparent'
  if (href) {
    return (
      <Link className={className} href={href}>
        <Icon size={size} />
      </Link>
    )
  }
  return (
    <button className={className} onClick={onClick} disabled={disabled}>
      <Icon size={size} />
    </button>
  )
}
