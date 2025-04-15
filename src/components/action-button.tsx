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
  size,
}) => {
  const className =
    'p-2 duration-150 transition cursor-pointer ease-in-out text-(--icon) disabled:cursor-not-allowed disabled:opacity-25 hover:text-(--icon-hover) disabled:text-(--icon)'
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
