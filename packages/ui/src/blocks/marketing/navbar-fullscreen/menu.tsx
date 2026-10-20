'use client'

import { useRef, useState, type ElementType, type FocusEvent, type ReactNode, type Ref } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { MotionFeatures, useDirection, useYouj } from '@youj/core'
import { ArrowLeftIcon, ArrowRightIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button, buttonVariants } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import type { NavbarFullscreenCopy, NavbarFullscreenCta, NavbarFullscreenItem, NavbarFullscreenLink, NavbarFullscreenSocial } from './data'

/* The menu's body: the current level's entries set large, each rising into
 * place out of its own line as the menu arrives; an entry with a level of its
 * own drills in, the list leaving toward the inline start as the next one
 * arrives from the end (mirrored in RTL), with a Back button that returns
 * focus to the entry that opened it. Beside the list on wide screens, a
 * picture follows the entry under the pointer or keyboard focus. The foot
 * holds the small links, the contact line and the profiles. */

interface Opened {
  item: NavbarFullscreenItem
  /** Its place in the level above, for focus on the way back. */
  index: number
}

const holds = (item: NavbarFullscreenItem, href?: string): boolean => !!href && !!item.items?.some((child) => child.href === href || holds(child, href))

interface MenuBodyProps {
  items: NavbarFullscreenItem[]
  current?: string
  footerLinks: NavbarFullscreenLink[]
  socials: NavbarFullscreenSocial[]
  contact: NavbarFullscreenLink | null
  cta: NavbarFullscreenCta | null
  copy: NavbarFullscreenCopy
  Link: ElementType
  /** A link was followed: the menu closes. */
  onFollow: () => void
  /** The first entry, which takes focus as the menu opens. */
  firstRef: Ref<HTMLElement>
}

export function MenuBody({ items, current, footerLinks, socials, contact, cta, copy, Link, onFollow, firstRef }: MenuBodyProps) {
  const k = useYouj()
  const rtl = useDirection() === 'rtl'
  const [path, setPath] = useState<Opened[]>([])
  const [deeper, setDeeper] = useState(true)
  const [pointed, setPointed] = useState<NavbarFullscreenItem | null>(null)
  // Where focus goes once the next level has arrived: its first entry, or the entry it was opened from.
  const focusNext = useRef<number | null>(null)
  const level = path.at(-1)
  const list = level?.item.items ?? items
  const shown = pointed ?? level?.item ?? list[0]
  const pictured = [...items, ...items.flatMap((item) => item.items ?? [])].some((item) => item.media)

  const enter = (item: NavbarFullscreenItem, index: number) => {
    focusNext.current = 0
    setDeeper(true)
    setPath([...path, { item, index }])
    setPointed(null)
  }
  const leave = () => {
    focusNext.current = level?.index ?? 0
    setDeeper(false)
    setPath(path.slice(0, -1))
    setPointed(null)
  }
  const arrived = (list: HTMLUListElement | null) => {
    if (!list || focusNext.current === null) return
    list.querySelectorAll<HTMLElement>('[data-yj-entry]')[focusNext.current]?.focus()
    focusNext.current = null
  }

  // Travel toward the inline start when going deeper, back the other way; a mirrored page mirrors it.
  // The leaving level reads the latest direction through AnimatePresence's `custom`.
  const away = (deeper ? -1 : 1) * (rtl ? -1 : 1)
  const travel = {
    arrive: (to: number) => ({ x: -to * 24, opacity: 0 }),
    rest: { x: 0, opacity: 1 },
    leave: (to: number) => ({ x: to * 24, opacity: 0, transition: k.tween('fast', 'exit') }),
  }
  const rise = (i: number) =>
    k.reduced ? { initial: false as const } : { initial: { y: '110%' }, animate: { y: '0%' }, transition: { ...k.spring('smooth'), delay: k.stagger('tight') * (i + (path.length ? 0 : 2)) } }

  return (
    <MotionFeatures>
      <div className={cn('mx-auto grid w-full max-w-6xl flex-1 content-start gap-10 px-5 pt-6 pb-10 md:px-10 md:pt-12', pictured && 'lg:grid-cols-[minmax(0,1fr)_--spacing(88)] lg:gap-16')}>
        <nav aria-label={copy.navLabel} className="min-w-0">
          <AnimatePresence mode="wait" initial={false} custom={away}>
            <m.div
              key={path.map((p) => p.item.label).join('/') || 'top'}
              custom={away}
              variants={travel}
              initial={k.reduced ? false : 'arrive'}
              animate="rest"
              exit={k.reduced ? undefined : 'leave'}
              transition={k.tween('base', 'enter')}
              role={level ? 'group' : undefined}
              aria-label={level?.item.label}
              className="flex flex-col gap-4"
            >
              {level && (
                <div className="flex items-center gap-3">
                  <Button variant="ghost" size="sm" onClick={leave} className="-ms-2.5 text-fg-muted">
                    <ArrowLeftIcon size={16} className="rtl:-scale-x-100" />
                    {copy.back}
                  </Button>
                  <span aria-hidden className="text-ui-sm text-fg-subtle">
                    {path.map((p) => p.item.label).join(' / ')}
                  </span>
                </div>
              )}
              <ul ref={arrived} className="flex flex-col" onPointerLeave={() => setPointed(null)}>
                {list.map((item, i) => {
                  const here = item.href !== undefined && item.href === current
                  const near = holds(item, current)
                  const dim = pointed !== null && pointed !== item
                  const entryClass = cn(
                    'group/entry flex w-full items-baseline gap-4 rounded-lg py-1 text-start text-4xl font-semibold tracking-tight text-fg md:gap-6 md:text-6xl',
                    'transition-[color,translate] yj-duration-base ease-standard focus-ring hover:translate-x-2 focus-visible:translate-x-2 rtl:hover:-translate-x-2 rtl:focus-visible:-translate-x-2',
                    dim && 'text-fg-subtle',
                  )
                  const inner = (
                    <>
                      <span aria-hidden className="w-7 shrink-0 font-mono text-ui-sm font-normal tracking-normal text-fg-subtle tabular-nums md:w-9">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">{item.label}</span>
                      {item.badge && <Badge className="self-center">{item.badge}</Badge>}
                      {(here || near) && <span aria-hidden className="size-2 shrink-0 self-center rounded-full bg-accent" />}
                      {item.items && <ArrowRightIcon size={28} strokeWidth={1.5} aria-hidden className="shrink-0 self-center text-fg-subtle transition-colors yj-duration-fast group-hover/entry:text-fg rtl:-scale-x-100" />}
                    </>
                  )
                  // Focus points at an entry only when it shows (the keyboard's), not when the menu placed it there on a click.
                  const point = {
                    onPointerEnter: () => setPointed(item),
                    onFocus: (event: FocusEvent<HTMLElement>) => event.currentTarget.matches(':focus-visible') && setPointed(item),
                  }
                  return (
                    <li key={item.label} className="overflow-y-clip py-1">
                      <m.div {...rise(i)}>
                        {item.items ? (
                          <button type="button" data-yj-entry="" ref={i === 0 && !level ? (firstRef as Ref<HTMLButtonElement>) : undefined} onClick={() => enter(item, i)} className={entryClass} {...point}>
                            {inner}
                          </button>
                        ) : (
                          <Link
                            href={item.href}
                            data-yj-entry=""
                            ref={i === 0 && !level ? firstRef : undefined}
                            aria-current={here ? 'page' : undefined}
                            onClick={onFollow}
                            className={entryClass}
                            {...point}
                          >
                            {inner}
                          </Link>
                        )}
                      </m.div>
                    </li>
                  )
                })}
              </ul>
            </m.div>
          </AnimatePresence>
        </nav>
        {pictured && shown && <Preview item={shown} />}
      </div>
      <Foot footerLinks={footerLinks} socials={socials} contact={contact} cta={cta} copy={copy} Link={Link} onFollow={onFollow} />
    </MotionFeatures>
  )
}

function Preview({ item }: { item: NavbarFullscreenItem }) {
  const k = useYouj()
  return (
    <div aria-hidden className="flex flex-col gap-4 max-lg:hidden">
      <div className="relative aspect-4/5 overflow-hidden rounded-2xl border border-line bg-well">
        <AnimatePresence initial={false}>
          <m.div
            key={item.label}
            initial={k.reduced ? false : { opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: k.tween('base', 'exit') }}
            transition={k.tween('slow', 'enter')}
            className="absolute inset-0"
          >
            {item.media}
          </m.div>
        </AnimatePresence>
      </div>
      <p className="flex min-h-12 flex-col gap-1">
        <span className="font-medium text-fg">{item.label}</span>
        {item.description && <span className="text-ui-sm text-fg-muted">{item.description}</span>}
      </p>
    </div>
  )
}

function Foot({
  footerLinks,
  socials,
  contact,
  cta,
  copy,
  Link,
  onFollow,
}: Pick<MenuBodyProps, 'footerLinks' | 'socials' | 'contact' | 'cta' | 'copy' | 'Link' | 'onFollow'>): ReactNode {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 border-t border-line px-5 py-6 md:flex-row md:items-center md:justify-between md:px-10">
      {cta && (
        <Link href={cta.href} onClick={cta.onClick} className={buttonVariants({ size: 'lg', className: 'md:hidden' })}>
          {cta.label}
        </Link>
      )}
      {footerLinks.length > 0 && (
        <nav aria-label={copy.footerLabel}>
          <ul className="flex flex-wrap gap-x-5 gap-y-2 text-ui-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} onClick={onFollow} className="rounded-sm text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        {contact && (
          <a href={contact.href} className="rounded-sm text-ui-sm font-medium text-fg underline-offset-4 hover:underline focus-ring">
            {contact.label}
          </a>
        )}
        {socials.length > 0 && (
          <ul className="flex items-center gap-1">
            {socials.map((social) => (
              <li key={social.href}>
                <a href={social.href} aria-label={social.label} className={buttonVariants({ variant: 'ghost', size: 'icon' })}>
                  {social.icon}
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
