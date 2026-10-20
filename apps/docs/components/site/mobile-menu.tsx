'use client'

import { Fragment, useEffect, useRef, useState } from 'react'
import { IntentLink } from '@/components/site/intent-link'
import { usePathname } from 'next/navigation'
import type * as PageTree from 'fumadocs-core/page-tree'
import { useSearchContext } from 'fumadocs-ui/contexts/search'
import { MenuIcon, SearchIcon } from '@youj/icons'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger, Drawer, DrawerContent, DrawerDescription, DrawerTitle, DrawerTrigger } from '@youj/react'
import { primeKeyboard } from '@youj/react/components/ui/presentation'
import { useSoundCue } from '@youj/core/lib/youj/sound-cue'
import { PageTreeNav } from '@/components/docs/page-tree'
import { navGlyph } from '@/components/site/pillar-icons'
import { communityIcon, SoonButton, type SectionId } from '@/components/site/site-header'
import { SoundToggle } from '@/components/site/sound-toggle'
import { cn } from '@/lib/cn'
import type { HeaderNav, NavEntry, NavMenu } from '@/lib/nav'
import { columnLinks } from '@/lib/nav-links'
import { communityLinks } from '@/lib/project'
import { loadTree } from '@/components/site/docs-tree'

const SHEET_BUTTON = 'grid size-12 shrink-0 place-items-center rounded-xl border border-line bg-canvas text-fg-muted transition-colors yj-duration-fast ease-standard active:bg-hover focus-ring'

function useDocsTree(wanted: boolean) {
  const [tree, setTree] = useState<PageTree.Root | 'failed'>()
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!wanted || (tree && tree !== 'failed')) return
    let live = true
    loadTree().then(
      (t) => live && setTree(t),
      () => live && setTree('failed'),
    )
    return () => {
      live = false
    }
  }, [wanted, tree, attempt])
  return {
    tree,
    retry: () => {
      setTree(undefined)
      setAttempt((n) => n + 1)
    },
  }
}

/** The docs tree without its Blocks section: their menus have the lists. */
function withoutBlocks(tree: PageTree.Root): PageTree.Root {
  const at = tree.children.findIndex((node) => node.type === 'separator' && node.name === 'Blocks')
  return at < 0 ? tree : { ...tree, children: tree.children.slice(0, at) }
}

/* Row lengths for the tree's placeholder while it loads. */
const PLACEHOLDER = [44, 62, 38, 56, 48, 30]

const row = 'flex min-h-11 min-w-0 items-center gap-3 rounded-lg px-2.5 text-ui-lg transition-colors yj-duration-fast ease-standard focus-ring active:bg-hover'

/** One of the header's menus, as a section that opens in place; the one holding this page starts open. */
function MenuSection({ menu, active, pathname, onNavigate }: { menu: NavMenu; active: boolean; pathname: string; onNavigate: () => void }) {
  const link = (entry: NavEntry) => {
    const Glyph = entry.glyph ? navGlyph[entry.glyph] : undefined
    const current = entry.url.split('#')[0] === pathname
    return (
      <li key={entry.url}>
        <IntentLink href={entry.url} aria-current={current ? 'page' : undefined} onClick={onNavigate} className={cn(row, current && 'bg-hover')}>
          {Glyph && <Glyph size={18} strokeWidth={1.5} className="shrink-0 text-fg-muted" />}
          <span className="truncate font-medium text-fg">{entry.title}</span>
          {entry.status && (
            <span data-status={entry.status} className="sidebar-badge ms-0! shrink-0">
              {entry.status}
            </span>
          )}
        </IntentLink>
      </li>
    )
  }

  return (
    <Collapsible defaultOpen={active} className="border-b border-line">
      <CollapsibleTrigger className="flex h-12 w-full items-center gap-2 rounded-lg px-2.5 text-start text-ui-lg font-semibold text-fg focus-ring">
        {menu.label}
        {active && <span aria-hidden className="particle size-1" />}
        <CollapsibleChevron size={16} className="ms-auto text-fg-subtle" />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className={cn('grid gap-0.5 px-0.5 pb-3', menu.columns && 'grid-cols-2')}>
          <li className={cn('mb-1', menu.columns && 'col-span-2')}>
            {/* The menu's feature, as in the header but without its loop: the sheet stays light. */}
            <IntentLink
              href={menu.feature.url}
              onClick={onNavigate}
              aria-current={menu.feature.url === pathname ? 'page' : undefined}
              className={cn(row, 'relative min-h-14 overflow-hidden bg-band ring-1 ring-line')}
            >
              <span className="flex min-w-0 flex-col">
                <span className="font-semibold text-fg">{menu.feature.cta}</span>
                <span className="truncate text-ui text-fg-muted">{menu.feature.title}</span>
              </span>
            </IntentLink>
          </li>
          {menu.links.map((entry) => link(entry))}
          {menu.columns?.map((column) => (
            <Fragment key={column.url}>
              <li className="col-span-2 mt-1">
                <IntentLink
                  href={column.url}
                  aria-current={column.url === pathname ? 'page' : undefined}
                  onClick={onNavigate}
                  className={cn(row, 'min-h-11 gap-2 text-ui font-semibold text-fg-muted', column.url === pathname && 'bg-hover')}
                >
                  {column.title}
                </IntentLink>
              </li>
              {columnLinks(column).map((entry) => (
                <li key={entry.url}>
                  <IntentLink
                    href={entry.url}
                    aria-current={entry.url === pathname ? 'page' : undefined}
                    onClick={onNavigate}
                    className={cn(row, entry.url === pathname && 'bg-hover')}
                  >
                    <span className="min-w-0 py-1.5 font-medium text-fg">{entry.title}</span>
                  </IntentLink>
                </li>
              ))}
            </Fragment>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

/**
 * Below the desktop layout, one menu holds the whole site: the header's three
 * menus as sections that open in place, every docs page (the current one
 * keyed), then search, the community links and the sound toggle. The light/dark switch stays
 * in the header, once. It's a bottom sheet, in reach of a thumb, that swipes
 * away (from the handle, or from anywhere once the list is at its top);
 * following a link puts it away too. Search is pinned to the sheet's bottom
 * edge, under the thumb, and opens the search sheet. Opening the menu focuses
 * the sheet itself, so a phone raises no keyboard and the page under it stays
 * where it was.
 */
export function MobileMenu({ nav, active }: { nav: HeaderNav; active: SectionId | undefined }) {
  const [open, setOpen] = useState(false)
  const sheet = useRef<HTMLDivElement>(null)
  const { tree, retry } = useDocsTree(open)
  const prefetch = () => void loadTree().catch(() => {})
  const pathname = usePathname()
  const { setOpenSearch } = useSearchContext()
  const close = () => setOpen(false)
  const cue = useSoundCue()

  // A navigation that didn't come from a link in here (back, search) still closes it.
  useEffect(() => setOpen(false), [pathname])

  return (
    <Drawer
      open={open}
      onOpenChange={(next) => {
        cue(next ? 'open' : 'close')
        setOpen(next)
      }}
    >
      <DrawerTrigger
        aria-label={open ? 'Close menu' : 'Open menu'}
        onPointerEnter={prefetch}
        onPointerDown={prefetch}
        onFocus={prefetch}
        className="inline-grid size-8 touch:size-11 place-items-center rounded-lg text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg focus-ring lg:hidden"
      >
        <MenuIcon size={18} strokeWidth={1.6} active={open} />
      </DrawerTrigger>
      {/* The body keeps its full height, so the sheet's bottom padding (the part of it below the screen's edge) follows the last row instead of covering it. */}
      <DrawerContent ref={sheet} initialFocus={sheet} className="max-h-[88dvh] *:data-[slot=drawer-body]:shrink-0">
        <DrawerTitle className="sr-only">Menu</DrawerTitle>
        <DrawerDescription className="sr-only">Docs, Components, Blocks and Visuals, every docs page, and search.</DrawerDescription>
        <div className="flex flex-col gap-5 pt-1 ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]">
          <nav aria-label="Main" className="flex flex-col">
            {nav.menus.map((menu) => (
              <MenuSection key={menu.id} menu={menu} active={active === menu.id} pathname={pathname} onNavigate={close} />
            ))}
          </nav>

          {tree && tree !== 'failed' ? (
            <PageTreeNav tree={withoutBlocks(tree)} keyId="menu-tree-key" onNavigate={close} />
          ) : tree === 'failed' ? (
            <p role="alert" className="flex flex-wrap items-center gap-3 text-ui text-fg-muted">
              The docs pages couldn’t be loaded.
              <button type="button" onClick={retry} className="rounded-md border border-line px-2.5 py-1 font-medium text-fg focus-ring">
                Try again
              </button>
            </p>
          ) : (
            <div aria-busy="true" className="loading-in flex flex-col gap-2 px-2.5">
              <span className="sr-only">Loading the docs pages…</span>
              {PLACEHOLDER.map((width, i) => (
                <span key={i} aria-hidden className="flex h-8 items-center">
                  <span className="h-2.5 rounded-sm bg-line" style={{ width: `${width}%` }} />
                </span>
              ))}
            </div>
          )}

          {/* Pinned to the sheet's bottom edge, where a thumb rests: the sheet's own padding (the 3rem it bleeds past the screen, plus the home indicator's inset) is already outside a sticky offset, so the bar rests on the screen's edge and its own padding covers the inset. Search is a button, not a field: it opens the search sheet, which raises the keyboard there. The community links and the sound toggle sit beside it. */}
          <div className="sticky bottom-[calc(-1*env(safe-area-inset-bottom))] z-10 -mx-4 -mt-1 flex items-center gap-2 border-t border-line bg-overlay px-4 pt-2.5 pb-[calc(0.625rem+env(safe-area-inset-bottom))] ps-[max(1rem,env(safe-area-inset-left))] pe-[max(1rem,env(safe-area-inset-right))]">
            <button
              type="button"
              onClick={() => {
                primeKeyboard()
                setOpen(false)
                setOpenSearch(true)
              }}
              className="flex h-12 min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-line bg-canvas px-3.5 text-base text-fg-muted transition-colors yj-duration-fast ease-standard active:bg-hover focus-ring"
            >
              <SearchIcon size={18} strokeWidth={1.75} />
              Search docs…
            </button>
            {communityLinks().map((link) => {
              const Icon = communityIcon[link.id]
              if (link.soon)
                return (
                  <SoonButton key={link.id} link={link} above className={SHEET_BUTTON}>
                    <Icon size={20} />
                  </SoonButton>
                )
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={link.label}
                  className={SHEET_BUTTON}
                >
                  <Icon size={20} />
                </a>
              )
            })}
            <SoundToggle variant="sheet" />
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
