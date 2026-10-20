'use client'

import Link from 'next/link'
import { icons, ArrowRightIcon, SearchIcon, type YoujIconComponent } from '@youj/icons'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@youj/react'
import { ButtonLink } from '@/components/ui/button-link'
import { pairNames } from './catalog'

/* The docs' way into the explorer: a search that opens it, a row of icons
 * that play as you point at them (each opens in the inspector), and the
 * explorer's views with their counts. The full set lives at /icons. */

const PICKS = [
  'bell', 'check', 'copy', 'search', 'trash', 'heart', 'menu', 'play', 'eye', 'lock', 'send', 'download',
  'settings', 'star', 'sparkles', 'cloud-upload', 'refresh', 'theme', 'wifi', 'mic', 'calendar', 'user-plus', 'bookmark', 'git-branch',
]

const counts = {
  icons: icons.length,
  states: icons.filter((Icon) => Icon.meta.states).length,
  pairs: pairNames(icons.map((Icon) => Icon.meta.name)).length,
}

export function IconGalleryView({ type }: { type?: 'morph' }) {
  const morph = type === 'morph'
  const byName = new Map(icons.map((Icon) => [Icon.meta.name, Icon]))
  const shown: YoujIconComponent[] = morph
    ? icons.filter((Icon) => Icon.meta.states).slice(0, 24)
    : PICKS.map((name) => byName.get(name)).filter((Icon): Icon is YoujIconComponent => !!Icon)
  const base = morph ? '/icons?type=morph&' : '/icons?'
  const views = [
    { label: 'All', count: counts.icons, href: '/icons' },
    { label: 'Morph', count: counts.states, href: '/icons?type=morph' },
    { label: 'Swap', count: counts.pairs, href: '/icons?type=swap' },
  ]

  return (
    <div className="not-prose my-8 overflow-hidden rounded-2xl border border-line bg-surface">
      <form action="/icons" className="flex items-center gap-2 border-b border-line p-2">
        {morph && <input type="hidden" name="type" value="morph" />}
        <InputGroup data-yj-trigger className="min-w-0 flex-1">
          <InputGroupAddon>
            <SearchIcon size={16} strokeWidth={1.75} />
          </InputGroupAddon>
          <InputGroupInput
            name="q"
            type="search"
            aria-label={morph ? 'Search state icons in the explorer' : 'Search icons in the explorer'}
            placeholder={morph ? `Search ${counts.states} state icons…` : `Search ${counts.icons} icons…`}
            autoComplete="off"
          />
        </InputGroup>
        <ButtonLink href={morph ? '/icons?type=morph' : '/icons'} size="sm" className="shrink-0">
          {morph ? `All ${counts.states}` : 'Open the explorer'}
          <ArrowRightIcon size={14} strokeWidth={1.75} />
        </ButtonLink>
      </form>
      <ul aria-label={morph ? 'State icons' : 'Icons'} className="grid grid-cols-6 gap-px bg-line sm:grid-cols-8 md:grid-cols-12">
        {shown.map((Icon) => {
          const { name, states } = Icon.meta
          return (
            <li key={name} className="bg-surface">
              <Link prefetch={false}
                href={`${base}icon=${name}`}
                aria-label={states ? `${name}: ${states[0]} or ${states[1]}, open in the explorer` : `${name}, open in the explorer`}
                title={name}
                className="grid aspect-square place-items-center text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-canvas hover:text-fg focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
              >
                <Icon size={22} />
              </Link>
            </li>
          )
        })}
      </ul>
      <nav aria-label="Explorer views" className="flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line px-3 py-2.5 text-[12.5px]">
        {views.map((v) => (
          <Link prefetch={false} key={v.label} href={v.href} className="flex items-center gap-1.5 text-fg-muted transition-colors yj-duration-fast ease-standard hover:text-fg focus-ring">
            {v.label}
            <span className="type-small text-fg-muted">{v.count.toLocaleString('en-US')}</span>
          </Link>
        ))}
        <Link prefetch={false} href="/icons?chain=bell~bell-off" className="ms-auto flex items-center gap-1.5 font-medium text-fg focus-ring">
          <span aria-hidden className="particle size-[5px]" />
          Chain
        </Link>
      </nav>
    </div>
  )
}
