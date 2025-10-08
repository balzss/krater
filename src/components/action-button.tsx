import Link from 'next/link'
import type { FC, ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'

type BaseActionButtonProps = {
  icon: LucideIcon
  size?: number
  className?: string
}

type ActionButtonLinkProps = BaseActionButtonProps &
  Omit<ComponentProps<'a'>, keyof BaseActionButtonProps> & {
    href: string
    onClick?: never
    disabled?: never
  }

type ActionButtonButtonProps = BaseActionButtonProps &
  Omit<ComponentProps<'button'>, keyof BaseActionButtonProps> & {
    href?: never
  }

type ActionButtonProps = ActionButtonLinkProps | ActionButtonButtonProps

export const ActionButton: FC<ActionButtonProps> = ({
  icon: Icon,
  size = 32,
  className = '',
  ...rest
}) => {
  const combinedClasses = `p-2 rounded-lg cursor-pointer duration-100 transform transition hover:bg-(--ghost-button-hover) ease-in-out flex gap-2 items-center disabled:cursor-not-allowed disabled:opacity-25 disabled:bg-transparent ${className}`

  if ('href' in rest && typeof rest.href === 'string') {
    return (
      <Link {...rest} className={combinedClasses}>
        <Icon size={size} />
      </Link>
    )
  }

  return (
    <button {...rest} className={combinedClasses}>
      <Icon size={size} />
    </button>
  )
}
