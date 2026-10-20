'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ComponentProps, type ElementType, type ReactNode, type Ref } from 'react'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { BrandGithubIcon, CheckIcon, MailOpenIcon } from '@youj/icons'
import { AsyncButton } from '../../components/ui/async-button'
import { cn } from '../../lib/utils'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyMedia } from '../../components/ui/empty'
import { FieldSeparator } from '../../components/ui/field'
import { AuthLinkContext } from './shell/auth-link'
import { AUTH_COPY, AUTH_LINKS, type AuthCopy, type AuthLinks } from './shell/copy'
import { GoogleMark, googleButton } from './shell/google-mark'

/* The frame every auth page sits in, in two layouts:
 * - `card`: one centered card on the canvas under a soft glow of the accent.
 * - `split`: the form on the inline-start half, and an art panel on the other
 *   from `lg` up: an isometric scene (a rocket over its pad by default; any
 *   of the illustrations by id, or your own picture) on a plain band above
 *   a customer quote. `illustration={null}` leaves the band and the quote.
 *   Below `lg` it is the form alone.
 * The scene holds still under reduced motion. Pass your
 * `brand` and `links`; the quote and the legal line are in `copy`, and
 * `linkComponent` renders every internal link as your router's Link. */

type AuthShellVariant = 'card' | 'split'

/** The product shown above the form. */
interface AuthBrand {
  name: string
  /** Your mark before the name. Default: none (the demo brand has its own). */
  logo?: ReactNode
  /** Where the brand links. Default '/'. */
  href?: string
}

const AUTH_BRAND: AuthBrand = {
  name: 'Northwind',
  href: '#',
  logo: (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 text-accent">
      <path d="M4 5h4l4 7-4 7H4l4-7z" fill="currentColor" />
      <path d="M12 5h4l4 7-4 7h-4l4-7z" fill="currentColor" opacity={0.45} />
    </svg>
  ),
}

/** What the frame and every auth page take, besides a page's own data and callbacks. */
interface AuthFrameProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The split layout's art: a scene from the illustrations by id, your own node, or `null` for the plain band alone. Default 'deploy'. */
  illustration?: IllustrationSlot
  /** Any of the strings (headings, labels, errors, the quote, the legal line), to rewrite or translate. Default: the Northwind demo's. */
  copy?: Partial<AuthCopy>
  /** The product above the form: `{ name, logo?, href? }`. Default: the Northwind demo. */
  brand?: AuthBrand
  /** Where the links go: `signIn`, `signUp`, `forgot`, `terms`, `privacy`, and the mail apps (`gmail`, `outlook`). Default: the demo's `#` anchors. */
  links?: Partial<AuthLinks>
  /** Renders every internal link, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: ElementType
  /** The step heading's level. Default 1. */
  headingLevel?: 1 | 2 | 3
}

interface AuthShellProps extends AuthFrameProps {
  variant?: AuthShellVariant
  children: ReactNode
}

/** What every auth page takes besides its own data and callbacks. */
interface AuthPageProps extends AuthFrameProps {
  /** `card`: one centered card. `split`: the form beside an art panel from `lg` up. Default `card`. */
  layout?: AuthShellVariant
}

/** A page's copy: the defaults with its overrides, kept stable while `copy` is (the forms' schemas memo on it). */
function useAuthCopy(copy?: Partial<AuthCopy>): AuthCopy {
  return useMemo(() => ({ ...AUTH_COPY, ...copy }), [copy])
}

function Brand({ brand }: { brand: AuthBrand }) {
  const { Link } = useContext(AuthLinkContext)
  return (
    <Link href={brand.href ?? '/'} className="inline-flex items-center gap-2 rounded-md text-ui-lg font-semibold tracking-tight text-fg focus-ring">
      {brand.logo}
      {brand.name}
    </Link>
  )
}

const legalLink = 'rounded-sm text-fg underline underline-offset-4 focus-ring hover:text-accent'

function Legal({ copy, links }: { copy: AuthCopy; links: AuthLinks }) {
  const { Link } = useContext(AuthLinkContext)
  return (
    <p className="text-center text-ui-sm text-balance text-fg-muted">
      {copy.legalBefore}{' '}
      <Link href={links.terms} className={legalLink}>
        {copy.legalTerms}
      </Link>{' '}
      {copy.legalAnd}{' '}
      <Link href={links.privacy} className={legalLink}>
        {copy.legalPrivacy}
      </Link>
      {copy.legalAfter}
    </p>
  )
}

/** Two letters for the quote's avatar. */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

function AuthShell({
  variant = 'card',
  illustration,
  copy: copyProp,
  brand = AUTH_BRAND,
  links: linksProp,
  linkComponent = 'a',
  headingLevel,
  className,
  children,
  ...rest
}: AuthShellProps) {
  const copy = { ...AUTH_COPY, ...copyProp }
  const links = { ...AUTH_LINKS, ...linksProp }
  const heading = useContext(AuthHeadingContext)
  const linkContext = useMemo(() => ({ Link: linkComponent }), [linkComponent])
  const body = (
    <AuthHeadingContext.Provider value={headingLevel ? { ...heading, level: headingLevel } : heading}>{children}</AuthHeadingContext.Provider>
  )
  if (variant === 'split') {
    return (
      <AuthLinkContext.Provider value={linkContext}>
        <div className={cn('grid min-h-dvh bg-canvas [--auth-surface:var(--color-canvas)] lg:grid-cols-2', className)} {...rest}>
          <div className="flex flex-col gap-10 px-5 py-6 sm:px-10 sm:py-8">
            <Brand brand={brand} />
            <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center">{body}</main>
            <Legal copy={copy} links={links} />
          </div>
          <aside className="relative isolate m-2 hidden flex-col overflow-hidden rounded-2xl border border-line bg-band lg:flex">
            {illustration !== null && (
              <div data-slot="auth-illustration" className="relative grid flex-1 place-items-center px-8 pt-10">
                <Illustration scene={illustration} fallback="deploy" unit={38} />
              </div>
            )}
            <figure className="relative m-6 mt-auto flex flex-col gap-4 rounded-xl border border-line bg-surface p-6 shadow-xs">
              <blockquote className="text-ui-lg leading-relaxed text-balance text-fg">{copy.quote}</blockquote>
              <figcaption className="flex items-center gap-3 text-ui-sm">
                <span aria-hidden className="grid size-8 place-items-center rounded-full bg-accent-subtle text-ui-xs font-semibold text-accent-text">
                  {initials(copy.quoteName)}
                </span>
                <span className="flex flex-col">
                  <span className="font-medium text-fg">{copy.quoteName}</span>
                  <span className="text-fg-muted">{copy.quoteRole}</span>
                </span>
              </figcaption>
            </figure>
          </aside>
        </div>
      </AuthLinkContext.Provider>
    )
  }
  return (
    <AuthLinkContext.Provider value={linkContext}>
      <div
        className={cn('relative isolate flex min-h-dvh flex-col items-center justify-center gap-8 overflow-hidden bg-canvas px-4 py-10 [--auth-surface:var(--color-surface)]', className)}
        {...rest}
      >
        <Brand brand={brand} />
        <main className="w-full max-w-sm">
          <Card className="shadow-md">
            <CardContent>{body}</CardContent>
          </Card>
        </main>
        <Legal copy={copy} links={links} />
      </div>
    </AuthLinkContext.Provider>
  )
}

/** How step headings render: an h1 on a page, an h2 in a card or dialog, and focusable where focus moves to them (the auth flow). */
const AuthHeadingContext = createContext<{ level: 1 | 2 | 3; focusable: boolean }>({ level: 1, focusable: false })

/** A step's heading. `focusable` (or the context) makes it the place focus lands with the step's news. */
function AuthTitle({ children, focusable, ref }: { children: ReactNode; focusable?: boolean; ref?: Ref<HTMLHeadingElement> }) {
  const heading = useContext(AuthHeadingContext)
  const Tag = heading.level === 1 ? 'h1' : heading.level === 2 ? 'h2' : 'h3'
  const target = focusable ?? heading.focusable
  return (
    <Tag ref={ref} tabIndex={target ? -1 : undefined} className={cn('text-2xl font-semibold tracking-tight text-fg', target && 'outline-none')}>
      {children}
    </Tag>
  )
}

/** The page's heading and a line under it. */
function AuthHeader({ title, description }: { title: ReactNode; description?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <AuthTitle>{title}</AuthTitle>
      {description && <p className="text-ui text-fg-muted">{description}</p>}
    </div>
  )
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/** A "Continue with…" button above the email form. */
interface AuthProvider {
  /** What `onProvider` receives, e.g. `'google'`. */
  id: string
  /** The button's label, e.g. "Continue with Google". */
  label: string
  /** The provider's mark before the label. */
  icon?: ReactNode
  /** Default `secondary`. */
  variant?: 'outline' | 'secondary'
  className?: string
}

/** Google's button keeps Google's own colors and four-color G (see layout/google-mark.tsx); both buttons share one size and stroke weight so neither outranks the other. */
const AUTH_PROVIDERS: AuthProvider[] = [
  { id: 'google', label: 'Continue with Google', icon: <GoogleMark className="size-4.5" />, variant: 'outline', className: googleButton.auto },
  { id: 'github', label: 'Continue with GitHub', icon: <BrandGithubIcon /> },
]

/** Continue with a provider, then "or" above the email form. Each button runs its redirect through onAction. No providers: the email form alone. */
function SocialSignIn({
  copy = AUTH_COPY,
  providers = AUTH_PROVIDERS,
  onProvider = () => demo('SocialSignIn: onProvider', 1200),
}: {
  copy?: AuthCopy
  providers?: AuthProvider[]
  onProvider?(provider: string): unknown
}) {
  if (providers.length === 0) return null
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        {providers.map((provider) => (
          <AsyncButton
            key={provider.id}
            variant={provider.variant ?? 'secondary'}
            size="lg"
            onAction={() => onProvider(provider.id)}
            pendingLabel={copy.providerPending}
            successLabel={copy.providerSuccess}
            className={cn('w-full', provider.className)}
          >
            {provider.icon}
            {provider.label}
          </AsyncButton>
        ))}
      </div>
      {/* The label's backing matches whichever surface the form sits on. */}
      <FieldSeparator className="**:data-[slot=field-separator-content]:bg-(--auth-surface)">{copy.or}</FieldSeparator>
    </div>
  )
}

/** An envelope that seals itself on arrival, then a check lands on its corner: "it's on its way". Reduced motion: sealed and checked at rest. */
function MailIllustration() {
  const [sealed, setSealed] = useState(false)
  const seal = useCallback((el: HTMLElement | null) => {
    if (el) setSealed(true)
  }, [])
  return (
    <div ref={seal} aria-hidden className="relative w-fit" data-yj-trigger="">
      <EmptyMedia variant="icon" className="mb-0 size-18 group-hover/empty-header:[&>span]:rotate-0">
        <MailOpenIcon active={sealed} size={30} strokeWidth={1.5} className="size-7.5 text-fg" />
      </EmptyMedia>
      {sealed && (
        <span
          className={cn(
            'absolute -end-1.5 -top-1.5 grid size-6 place-items-center rounded-full bg-success text-canvas shadow-sm ring-3 ring-(--auth-surface)',
            'transition-[scale,opacity] yj-duration-base ease-emphasized starting:scale-50 starting:opacity-0',
            '[transition-delay:calc(var(--yj-duration-base)*var(--yj-motion,1))]',
          )}
        >
          <CheckIcon trigger="mount" size={14} strokeWidth={2.5} />
        </span>
      )}
    </div>
  )
}

export { AuthHeader, AuthHeadingContext, AuthShell, AuthTitle, MailIllustration, SocialSignIn, useAuthCopy, wait, demo, AUTH_BRAND, AUTH_COPY, AUTH_LINKS, AUTH_PROVIDERS }
export type { AuthBrand, AuthCopy, AuthShellProps, AuthShellVariant, AuthLinks, AuthPageProps, AuthProvider }
