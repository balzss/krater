import { FC, ReactNode } from 'react'
import { House } from 'lucide-react'
import { ActionButton } from './action-button'

interface PageHeaderProps {
  title?: string
  actions?: ReactNode
  showHomeButton?: boolean
  centered?: boolean
}

/**
 * Reusable page header component with optional title, action buttons, and home button
 */
export const PageHeader: FC<PageHeaderProps> = ({
  title,
  actions,
  showHomeButton = true,
  centered = false,
}) => {
  const justifyClass = title ? '' : centered ? 'justify-center' : ''

  return (
    <div className={`flex w-full gap-2 sm:gap-4 items-center ${justifyClass}`}>
      {title && <h1 className="text-4xl font-bold mr-auto">{title}</h1>}
      {actions}
      {showHomeButton && <ActionButton href="/" icon={House} />}
    </div>
  )
}
