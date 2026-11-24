import type { ComponentProps, FC } from 'react'
import { Link } from 'wouter'

type AppLinkProps = Omit<ComponentProps<'a'>, 'href'> & { href: string }

// Anything that leaves the app (or isn't a real route) is a plain anchor
const isPlainAnchor = (href: string, target?: string) =>
  target === '_blank' || href === '#' || /^([a-z][a-z0-9+.-]*:)?\/\//i.test(href)

/** Client-side navigation for app routes, a regular anchor for everything else */
export const AppLink: FC<AppLinkProps> = ({ href, target, rel, ...rest }) => {
  if (isPlainAnchor(href, target)) {
    return (
      <a
        href={href}
        target={target}
        rel={target === '_blank' ? (rel ?? 'noopener noreferrer') : rel}
        {...rest}
      />
    )
  }
  return <Link href={href} {...rest} />
}
