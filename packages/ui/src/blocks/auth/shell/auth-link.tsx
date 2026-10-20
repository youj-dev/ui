import { createContext, useContext, type ElementType, type ReactNode } from 'react'
import type { AuthAction } from './copy'

/** The component every internal link under an AuthShell renders as: your router's Link, or `'a'`. */
const AuthLinkContext = createContext<{ Link: ElementType }>({ Link: 'a' })

/** A link to another auth step: an anchor to its page, or a button that moves the flow there. Same look either way. */
function AuthLink({ to, className, children }: { to: AuthAction; className: string; children: ReactNode }) {
  const { Link } = useContext(AuthLinkContext)
  if ('href' in to)
    return (
      <Link href={to.href} className={className}>
        {children}
      </Link>
    )
  return (
    <button type="button" onClick={to.onClick} className={`cursor-pointer ${className}`}>
      {children}
    </button>
  )
}

/** The quiet link under a field's label ("Forgot password?") and the emphatic one in a footer ("Create an account"). */
const quietLink = 'rounded-sm text-ui-sm text-fg-muted underline-offset-4 focus-ring hover:text-fg hover:underline'
const footerLink = 'rounded-sm font-medium text-fg underline-offset-4 focus-ring hover:underline'

export { AuthLink, AuthLinkContext, footerLink, quietLink }
