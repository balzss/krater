import type { ReactNode, ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'

type BaseMenuItemProps = {
  children: ReactNode
  startIcon?: LucideIcon
  endIcon?: LucideIcon
  className?: string
}

type MenuItemAnchorProps = BaseMenuItemProps &
  Omit<ComponentProps<'a'>, keyof BaseMenuItemProps | 'children'> & {
    href: string
    type?: never
  }

type MenuItemButtonProps = BaseMenuItemProps &
  Omit<ComponentProps<'button'>, keyof BaseMenuItemProps | 'children'> & {
    href?: never
  }

type MenuItemProps = MenuItemAnchorProps | MenuItemButtonProps

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  startIcon: StartIcon,
  endIcon: EndIcon,
  ...rest
}) => {
  const className = `w-full px-4 py-3 border border-(--border) rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer duration-100 transform transition hover:bg-(--item) ease-in-out flex gap-2 items-center h-12 bg-(--card) ${rest.className}`
  const content = (
    <>
      {StartIcon && <StartIcon size={20} />}
      {children}
      {EndIcon && <EndIcon size={20} className="ml-auto" />}
    </>
  )

  if ('href' in rest && typeof rest.href === 'string') {
    return (
      <Link {...rest} className={className}>
        {content}
      </Link>
    )
  }
  return (
    <button {...rest} className={className}>
      {content}
    </button>
  )
}
