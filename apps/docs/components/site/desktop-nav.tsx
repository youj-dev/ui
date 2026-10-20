'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { usePathname } from 'next/navigation'
import { motion } from 'motion/react'
import { ThemeScope, useSoundCue, useYouj } from '@youj/core'
import { paletteById } from '@youj/core/lib/youj/theme'
import { ArrowRightIcon } from '@youj/icons/components/youj/icons/arrow-right'
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@youj/react/components/ui/navigation-menu'
import { FeatureArt, prefetchArt } from '@/components/site/feature-art'
import { IntentLink } from '@/components/site/intent-link'
import type { SectionId } from '@/components/site/site-header'
import { cn } from '@/lib/cn'
import type { HeaderNav, NavEntry, NavFeature, NavLink, NavMenu, PillarId } from '@/lib/nav'
import { Stage } from '@/components/site/stage'
import { BackdropLayer } from '@/components/docs/backdrop-layer'
import { TILE_MOODS } from '@/components/landing/tile-moods'
import type { BackdropId } from '@/lib/backdrops'

/* The header's five menus, from md up (site-header.tsx hydrates them once the page is idle, or on intent). */

/**
 * The current section wears a particle above its label, like the tittle
 * on the wordmark's i. It glides to the new section on navigation.
 */
function Tittle() {
  const k = useYouj()
  return (
    <motion.span
      layoutId="site-nav-tittle"
      aria-hidden
      transition={k.reduced ? { duration: 0 } : k.spring('smooth')}
      // A bottom tab: an accent bar on the header's lower edge under the current area (the trigger sits centred in the bar).
      className="pointer-events-none absolute inset-x-2 top-[calc(50%+var(--header-bar)/2-2px)] h-0.5 rounded-full bg-accent"
    />
  )
}

/** The page a link opens, without its fragment: Themes (/docs/theming#presets) is current on Theming. */
const isCurrent = (link: NavLink, pathname: string) => link.url.split('#')[0] === pathname

function Badge({ status }: { status: NavLink['status'] }) {
  return status ? (
    <span data-status={status} className="sidebar-badge ms-0! shrink-0">
      {status}
    </span>
  ) : null
}

/** A menu's pictures, fetched as it's about to open: its feature's, and its rows' where they have one. */
function prefetchMenuArt(menu: NavMenu) {
  prefetchArt(menu.feature.art)
  for (const link of menu.links) if (link.art) prefetchArt(link.art)
  if (menu.id === 'blocks') prefetchArt('mosaic')
}

/** The feature art's height: the card's picture is 28:15 across the 15rem column, less the card's padding (224 × 120px), so the card stands as tall as four rows. */
const ART_SIZE = 120

/** A Visuals card's art: its 2:1 picture across a half-width card (about 210 × 105px). */
const SMALL_ART_SIZE = 92

/**
 * A menu's feature card, on the panel's end side: one of the Youj
 * animations, live, on top (16:10, rounded, on the gallery's stage), its
 * title, one line and a link below. The panel mounts only while its menu is
 * open, so the animation does too: its code is fetched as the menu is about
 * to open (feature-art.tsx), never with the page, and a panel closing holds
 * its frame. It follows the site's light and dark, and under reduced motion
 * it's the animation's still frame. The link stretches over the card (its
 * ::after), so the picture stays out of its name. The card is a pane of the
 * floating chrome's tone, so a two-tone theme's dark islands reach the menu.
 */
function FeatureCard({ feature, open, pathname, small = false, mood }: { feature: NavFeature; open: boolean; pathname: string; /** One of Visuals' four cards: a shorter picture, the art to match. */ small?: boolean; /** A mood (lib/backdrops), as on the homepage's tiles: its ground under the card, its palette on the piece, the words on glass. */ mood?: BackdropId }) {
  const current = isCurrent(feature, pathname)
  return (
    <div
      data-yj-tone="float"
      data-feature-card=""
      data-glass={small ? '' : undefined}
      className={cn(
        'group/feature relative flex h-full flex-col gap-3 overflow-hidden rounded-lg p-2 pb-3 text-fg transition-colors yj-duration-fast ease-standard focus-ring-within',
        mood ? 'nav-mood isolate pb-2' : 'bg-chrome has-[[data-feature]:hover]:yj-solid-shade',
      )}
    >
      {mood && <BackdropLayer id={mood} live={false} className="-z-10" />}
      {/* The stage the gallery's cards stand on: its own theme scope on the gray page, the dot grid fading out to the edges. */}
      <Stage
        aria-hidden
        // One card, as the galleries' tiles: the stage draws no frame or ground of its own, the card's wash (styles/site.css) runs under both.
        className={cn(
          'relative isolate grid place-items-center overflow-hidden rounded-md bg-transparent! [--yj-anim-paper:var(--color-canvas)]',
          // A small card's picture sits a little high in its plate, so a tall piece's foot isn't clipped.
          small ? 'aspect-[2/1] pb-3' : 'aspect-[28/15]',
          // A Visuals card's piece sits on a frosted-glass plate on the card (styles/site.css), in light.
          small && !mood && 'light:bg-surface/55! youj-allow-glass light:backdrop-blur-md light:backdrop-saturate-150',
        )}
      >
        {mood ? (
          <ThemeScope palette={paletteById(mood)}>
            <FeatureArt id={feature.art} size={small ? SMALL_ART_SIZE : ART_SIZE} paused={!open} />
          </ThemeScope>
        ) : (
          <FeatureArt id={feature.art} size={small ? SMALL_ART_SIZE : ART_SIZE} paused={!open} />
        )}
      </Stage>
      <NavigationMenuLink
        render={<IntentLink href={feature.url} />}
        closeOnClick
        active={current}
        aria-current={current ? 'page' : undefined}
        data-feature=""
        className={cn(
          'flex-1 flex-col items-stretch gap-1 bg-transparent px-1.5 py-0 outline-none! after:absolute after:inset-0 after:rounded-lg hover:bg-transparent focus-visible:bg-transparent data-active:bg-transparent',
          // On a mood the words sit in a pane of glass (styles/site.css `.nav-mood`).
          mood && 'nav-mood-pane px-2.5! py-2!',
        )}
      >
        <span className="flex items-center gap-2 text-ui-lg leading-tight font-semibold tracking-tight text-fg">
          {feature.title}
          <Badge status={feature.status} />
        </span>
        <span className="text-ui-sm leading-snug text-pretty text-fg-muted">{feature.description}</span>
        {/* A Visuals card names no count (it changes, and there's no room): only the features carry a call to action. */}
        {feature.cta && (
          <span className={'mt-auto inline-flex items-center gap-1.5 pt-2 text-ui font-medium text-fg'}>
            {feature.cta}
            <ArrowRightIcon
              size={14}
              strokeWidth={1.75}
              className="transition-transform yj-duration-fast ease-standard group-hover/feature:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover/feature:-translate-x-0.5"
            />
          </span>
        )}
      </NavigationMenuLink>
    </div>
  )
}

/** A panel's links, in reading order. */
const panelLinks = (id: string) => [...document.querySelectorAll<HTMLElement>(`[data-nav-panel="${id}"] a[href]`)]

/** Home and End jump to the panel's first and last link. */
function moveInPanel(event: KeyboardEvent<HTMLElement>) {
  if (event.key !== 'Home' && event.key !== 'End') return
  const links = panelLinks(event.currentTarget.dataset.navPanel!)
  const target = event.key === 'Home' ? links[0] : links.at(-1)
  if (!target) return
  event.preventDefault()
  target.focus()
}

/** Focuses a panel's first or last link, once its content has mounted (it opens on the next frames). */
function focusPanel(id: string, which: 'first' | 'last', tries = 20) {
  const links = panelLinks(id)
  const target = which === 'first' ? links[0] : links.at(-1)
  if (target) target.focus()
  else if (tries > 0) requestAnimationFrame(() => focusPanel(id, which, tries - 1))
}

interface PanelProps {
  menu: NavMenu
  /** Its menu is open: false while a panel closes (its art holds its frame). */
  open: boolean
  pathname: string
}


/** Visuals: no feature, its four parts as even cards, two by two, each its own live piece (an icon, a scene, a miniature, a loader) over its name, a line and its count. */
function VisualsPanel({ menu, open, pathname }: PanelProps) {
  return (
    <div data-nav-panel={menu.id} onKeyDown={moveInPanel} className="grid w-[29rem] grid-cols-2 gap-2.5 p-1">
      {menu.links.map((link) =>
        link.art ? (
          <FeatureCard
            key={link.url}
            feature={{ title: link.title, url: link.url, description: link.description, cta: '', art: link.art, status: link.status }}
            open={open}
            pathname={pathname}
            small
            // The homepage's moods for the parts it shows (tile-moods.ts); Miniatures, which has no tile there, on Seaglass.
            mood={TILE_MOODS[link.glyph as PillarId] ?? 'seaglass'}
          />
        ) : null,
      )}
    </div>
  )
}

/** Blocks' one card for its kinds: a live picture over the name, then each kind a link with its count. The card isn't a link itself; its rows are. */
function KindsCard({ links, open, pathname }: { links: NavEntry[]; open: boolean; pathname: string }) {
  return (
    <div data-yj-tone="float" data-feature-card="" data-glass="" className="relative flex h-full flex-col gap-2 overflow-hidden rounded-lg bg-chrome p-2 pb-2.5 text-fg">
      <Stage
        aria-hidden
        className="relative isolate grid aspect-[2/1] place-items-center overflow-hidden rounded-md bg-transparent! pb-3 [--yj-anim-paper:var(--color-canvas)] light:bg-surface/55! youj-allow-glass light:backdrop-blur-md light:backdrop-saturate-150"
      >
        <FeatureArt id="mosaic" size={SMALL_ART_SIZE} paused={!open} />
      </Stage>
      <ul className="grid grid-cols-2 gap-0.5">
        {links.map((link) => {
          const current = isCurrent(link, pathname)
          return (
            <li key={link.url} className="odd:last:col-span-2">
              <NavigationMenuLink
                render={<IntentLink href={link.url} />}
                closeOnClick
                active={current}
                aria-current={current ? 'page' : undefined}
                className="flex-col items-start gap-0 px-1.5 py-1"
              >
                <span className="text-ui font-medium leading-tight text-fg">{link.title}</span>
              </NavigationMenuLink>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Blocks: two even cards, its kinds (cards, sections, screens, frames) and Create. */
function BlocksPanel({ menu, open, pathname }: PanelProps) {
  return (
    <div data-nav-panel={menu.id} onKeyDown={moveInPanel} className="grid w-[29rem] grid-cols-2 gap-2.5 p-1">
      <KindsCard links={menu.links} open={open} pathname={pathname} />
      <FeatureCard feature={menu.feature} open={open} pathname={pathname} small />
    </div>
  )
}

const PANEL = { blocks: BlocksPanel, visuals: VisualsPanel }

/**
 * Four menus: Docs, Components, Blocks and Visuals. Tab and the arrow keys move
 * between them and through a panel's links (Base UI's navigation menu), Esc
 * closes it and focus goes back to its trigger. A panel taller than the
 * window scrolls inside itself. A click on the trigger of a menu that
 * hovering opened keeps it open, rather than closing what the pointer just
 * opened; the next closes it. A menu opened by a press or a key sounds as it
 * opens and closes (with sound on); one that hovering opened stays silent,
 * and so does following a link.
 */
export function DesktopNav({ nav, active }: { nav: HeaderNav; active: SectionId | undefined }) {
  const pathname = usePathname()
  const [open, setOpen] = useState<string | null>(null)
  const openedByHover = useRef(false)
  const cue = useSoundCue()
  const sounded = useRef(false)

  return (
    <NavigationMenu
      aria-label="Main"
      className="hidden md:flex"
      value={open}
      onValueChange={(next: string | null, details: { reason: string }) => {
        const pressedOpen = next === null && details.reason === 'trigger-press' && openedByHover.current
        openedByHover.current = next !== null && details.reason === 'trigger-hover'
        if (pressedOpen) return
        if (open === null && next !== null) {
          sounded.current = details.reason !== 'trigger-hover'
          if (sounded.current) cue('open')
        } else if (open !== null && next === null) {
          if (sounded.current && details.reason !== 'link-press') cue('close')
          sounded.current = false
        }
        setOpen(next)
      }}
    >
      <NavigationMenuList>
        {nav.menus.map((menu) => {
          // Docs and Components open their first page: a link, no menu.
          if (menu.href)
            return (
              <NavigationMenuItem key={menu.id} value={menu.id}>
                <NavigationMenuLink
                  render={<IntentLink href={menu.href} />}
                  active={active === menu.id}
                  aria-current={pathname === menu.href ? 'page' : undefined}
                  className={cn(
                    'relative h-10 items-center rounded-md bg-transparent! px-3 text-ui-sm font-medium text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg data-active:text-fg',
                    active === menu.id && 'text-fg',
                  )}
                >
                  {menu.label}
                  {active === menu.id && <Tittle />}
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          const Panel = PANEL[menu.id as keyof typeof PANEL]
          return (
            <NavigationMenuItem key={menu.id} value={menu.id}>
              {/* Pointed at or focused, its feature's art starts loading, so it's in when the panel opens. */}
              <NavigationMenuTrigger
                onPointerEnter={() => prefetchMenuArt(menu)}
                onFocus={() => prefetchMenuArt(menu)}
                // The navigation pattern: Down opens the menu and moves into it, Up into its last link.
                onKeyDown={(event) => {
                  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
                  event.preventDefault()
                  setOpen(menu.id)
                  focusPanel(menu.id, event.key === 'ArrowDown' ? 'first' : 'last')
                }}
                // The site's top-level areas, a size down from the kit's trigger (text-ui) so the bar stays quiet; the logo leads it.
                className={cn('relative h-10 text-ui-sm', active === menu.id && 'text-fg')}
              >
                {menu.label}
                {active === menu.id && <Tittle />}
              </NavigationMenuTrigger>
              <NavigationMenuContent>
                <Panel menu={menu} open={open === menu.id} pathname={pathname} />
              </NavigationMenuContent>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
