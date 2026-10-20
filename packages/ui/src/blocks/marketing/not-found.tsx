'use client'

import { lazy, Suspense, useState, type ComponentProps, type ReactNode } from 'react'
import { Reveal, Stagger, TextSplit } from '@youj/motion'
import { ArrowLeftIcon, ArrowRightIcon, BookmarkIcon, HomeIcon, MessageIcon, SearchIcon } from '@youj/icons'
import { Button, buttonVariants } from '../../components/ui/button'
import { Field, FieldError, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { cn } from '../../lib/utils'
import { ComingSoon } from './not-found/coming-soon'
import {
  DEFAULT_COPY,
  demo,
  type HeadingTag,
  type LinkComponent,
  type NotFoundCta,
  type NotFoundDestination,
  type NotFoundCopy,
} from './not-found/data'

/* Two pages for when there is nothing to show yet. `not-found`: a 404 beside
 * a lighthouse whose lamp sweeps the fog for the page that drifted off (or,
 * with `media={null}`, its digits rising out of their masks), a plain
 * explanation, a search field, the way home and three likely destinations. `coming-soon`: a
 * launch countdown whose digits roll each second over a mesh gradient, and a
 * notify-me sign-up carried by Button onAction. Reduced motion: the
 * lighthouse stands still, the digits are set, the backgrounds hold still and
 * the countdown simply changes.
 *
 * Pass your own `destinations`, `homeCta`, `launch`, wire `onSearch` and
 * `onNotify`, and set `linkComponent` for your router; every string is in
 * `copy`. */

/** The lighthouse is a chunk of its own, fetched when the 404 shows it (`media={null}` fetches nothing). */
const Lighthouse = lazy(() => import('./not-found/lighthouse').then((m) => ({ default: m.Lighthouse })))

const destinationsFor = (copy: NotFoundCopy): NotFoundDestination[] => [
  { href: '#docs', icon: <BookmarkIcon size={16} />, title: copy.docsTitle, description: copy.docsDescription },
  { href: '#changelog', icon: <ArrowRightIcon size={16} className="rtl:-scale-x-100" />, title: copy.changelogTitle, description: copy.changelogDescription },
  { href: '#support', icon: <MessageIcon size={16} />, title: copy.supportTitle, description: copy.supportDescription },
]

interface NotFoundContentProps {
  copy: NotFoundCopy
  destinations: NotFoundDestination[]
  homeCta: NotFoundCta
  onBack: () => void
  onSearch: (query: string) => Promise<unknown> | unknown
  media: ReactNode
  Link: LinkComponent
  Title: HeadingTag
}

function NotFoundContent({ copy, destinations, homeCta, onBack, onSearch, media, Link, Title }: NotFoundContentProps) {
  const art =
    media === undefined ? (
      <Suspense fallback={null}>
        <Reveal inView={false} variant="scale" duration="slow" className="size-full">
          <Lighthouse />
        </Reveal>
      </Suspense>
    ) : (
      media
    )
  const rich = art !== null && art !== false
  const align = rich ? 'items-center text-center lg:items-start lg:text-start' : 'items-center text-center'
  const text = (
    <div className={cn('flex w-full max-w-lg flex-col gap-6', align)}>
      {rich ? (
        <p className="font-mono text-ui-sm tracking-widest text-fg-subtle uppercase">{copy.errorCode(copy.code)}</p>
      ) : (
        <TextSplit
          as="p"
          by="chars"
          mask
          inView={false}
          step="loose"
          duration="deliberate"
          ease="enter"
          className="font-mono text-5xl font-semibold tracking-tighter text-accent sm:text-6xl"
        >
          {copy.code}
        </TextSplit>
      )}
      <Stagger inView={false} delay={rich ? 2 : 4} variant="rise" className={cn('flex w-full flex-col gap-6', align)}>
        <Title className={cn('text-balance text-3xl font-semibold tracking-tight text-fg sm:text-4xl', rich && 'xl:text-5xl')}>{copy.title}</Title>
        <p className="max-w-md text-pretty text-ui-lg text-fg-muted">{copy.description}</p>
        {/* A Reveal of its own, so the form can take the column's width rather than its content's. */}
        <Reveal className="w-full">
          <Search onSearch={onSearch} copy={copy} className={cn('mx-auto', rich && 'lg:mx-0')} />
        </Reveal>
        <div className={cn('flex flex-wrap justify-center gap-3', rich && 'lg:justify-start')}>
          <Link href={homeCta.href} onClick={homeCta.onClick} data-yj-trigger="" className={buttonVariants({ size: 'lg' })}>
            <HomeIcon size={16} /> {homeCta.label}
          </Link>
          {copy.back && (
            <Button size="lg" variant="outline" data-yj-trigger="" onClick={onBack}>
              <ArrowLeftIcon size={16} className="rtl:-scale-x-100" /> {copy.back}
            </Button>
          )}
        </div>
      </Stagger>
    </div>
  )
  return (
    <>
      {rich ? (
        <div className="grid w-full max-w-5xl items-center justify-items-center gap-8 lg:grid-cols-2 lg:justify-items-start lg:gap-12">
          <div aria-hidden className="size-60 sm:size-72 lg:order-last lg:size-104 lg:justify-self-center">
            {art}
          </div>
          {text}
        </div>
      ) : (
        text
      )}
      {destinations.length > 0 && (
        <Reveal inView={false} delay={10} className={cn('w-full', rich ? 'max-w-5xl' : 'max-w-2xl')}>
          <nav aria-label={copy.destinationsLabel}>
            <ul className="grid gap-2 sm:grid-cols-3">
              {destinations.map((d) => (
                <li key={d.href}>
                  <Link
                    href={d.href}
                    data-yj-trigger=""
                    className="flex h-full flex-col gap-1 rounded-xl border border-line bg-surface/80 youj-allow-glass p-4 backdrop-blur transition-colors yj-duration-fast ease-standard focus-ring hover:bg-hover"
                  >
                    <span className="flex items-center gap-2 text-ui font-medium text-fg">
                      {d.icon && <span className="text-accent">{d.icon}</span>}
                      {d.title}
                    </span>
                    <span className="text-ui-sm text-fg-muted">{d.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Reveal>
      )}
    </>
  )
}

/** The site search: the query goes to `onSearch`, which can route to your results page. */
function Search({
  onSearch,
  copy,
  className,
}: {
  onSearch: (query: string) => Promise<unknown> | unknown
  copy: NotFoundCopy
  className?: string
}) {
  const [query, setQuery] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  return (
    <form
      role="search"
      aria-label={copy.searchLabel}
      className={cn('w-full max-w-md text-start', className)}
      onSubmit={async (event) => {
        event.preventDefault()
        const value = query.trim()
        if (!value) return
        setPending(true)
        setError(null)
        try {
          await onSearch(value)
        } catch (failure) {
          if (failure instanceof Error && failure.message) setError(failure.message)
        } finally {
          setPending(false)
        }
      }}
    >
      <Field invalid={error !== null}>
        <FieldLabel className="sr-only">{copy.searchLabel}</FieldLabel>
        <div className="flex gap-2">
          <Input
            type="search"
            name="q"
            autoComplete="off"
            placeholder={copy.searchPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="min-w-0 flex-1"
          />
          <Button type="submit" variant="outline" loading={pending}>
            <SearchIcon size={16} /> {copy.search}
          </Button>
        </div>
        {error && <FieldError>{error}</FieldError>}
      </Field>
    </form>
  )
}

interface NotFoundProps extends Omit<ComponentProps<'main'>, 'children'> {
  /** `not-found`: the 404. `coming-soon`: a launch countdown with a notify-me form. Default `not-found`. */
  variant?: 'not-found' | 'coming-soon'
  /** Not found: the picture beside the text: your own node, or `null` for the plain page. Default: a lighthouse sweeping the fog. */
  media?: ReactNode
  /** Not found: search the site; route to your results page, or reject with an Error whose message shows under the field. Default: a short demo wait. */
  onSearch?: (query: string) => Promise<unknown> | unknown
  /** Coming soon: the launch time. Default: 12 days, 7 hours and 42 minutes after the page opens in the browser. */
  launch?: Date | number
  /** Coming soon: resolve once the address is on the list; reject with an Error whose message says why not. Default: a short demo wait. */
  onNotify?: (email: string) => Promise<unknown> | unknown
  /** Not found: the cards under the 404; an empty array hides them. Default: Documentation, Changelog and Support. */
  destinations?: NotFoundDestination[]
  /** Not found: the way home. Default: Back to home → `#home`. */
  homeCta?: NotFoundCta
  /** Not found: what Go back does. Default: `history.back()`. */
  onBack?: () => void
  /** The page heading's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** The element every internal link renders as, e.g. Next.js `Link`. Default `'a'`. */
  linkComponent?: LinkComponent
  /** Any of the block's strings, to rewrite or translate. */
  copy?: Partial<NotFoundCopy>
}

function NotFound({
  variant = 'not-found',
  media,
  onSearch = () => demo('NotFound: onSearch', 700),
  launch,
  onNotify = () => demo('NotFound: onNotify', 900),
  destinations: destinationsProp,
  homeCta: homeCtaProp,
  onBack = () => window.history.back(),
  headingLevel = 1,
  linkComponent = 'a',
  copy: copyProp,
  className,
  ...rest
}: NotFoundProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const destinations = destinationsProp ?? destinationsFor(copy)
  const homeCta = homeCtaProp ?? { label: copy.home, href: '#home' }
  const Title = `h${headingLevel}` as HeadingTag
  return (
    <main
      className={cn(
        'relative isolate flex min-h-dvh flex-col items-center justify-center gap-14 overflow-hidden bg-canvas px-4 py-16 sm:px-6 lg:py-20',
        className,
      )}
      {...rest}
    >
      {variant === 'coming-soon' ? (
        <ComingSoon copy={copy} launch={launch === undefined ? undefined : +launch} onNotify={onNotify} Title={Title} />
      ) : (
        <NotFoundContent
          copy={copy}
          destinations={destinations}
          homeCta={homeCta}
          onBack={onBack}
          onSearch={onSearch}
          media={media}
          Link={linkComponent}
          Title={Title}
        />
      )}
    </main>
  )
}

export { NotFound }
export type { NotFoundProps, NotFoundCopy, NotFoundDestination, NotFoundCta }
