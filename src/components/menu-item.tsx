import type { ReactNode, ComponentProps } from 'react'
import type { LucideIcon } from 'lucide-react'

type MenuItemProps = {
  children: ReactNode
  href: string
  startIcon?: LucideIcon
  endIcon?: LucideIcon
} & ComponentProps<'a'>

export const MenuItem: React.FC<MenuItemProps> = ({
  children,
  startIcon: StartIcon,
  endIcon: EndIcon,
  ...rest
}) => {
  return (
    <a
      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent max-w-sm cursor-pointer duration-300 transform transition hover:scale-103 ease-in-out flex gap-2 items-center h-12"
      {...rest}
    >
      {StartIcon && <StartIcon size={20} />}
      {children}
      {EndIcon && <EndIcon size={20} className="ml-auto" />}
    </a>
  )
}
