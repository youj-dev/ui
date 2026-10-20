'use client'

import { useYouj } from '@youj/core'
import { PresenceItem, PresenceList, SpotlightGroup, SpotlightSurface } from '@youj/motion'
import { ArrowRightIcon } from '@youj/icons'
import { Skeleton } from '../../../components/ui/skeleton'
import { cn } from '../../../lib/utils'
import type { SocialProofCopy, SocialProofLogo } from './data'

/* The customer wall: wordmarks on a hairline grid, one frame around them all,
 * lit by the kit Spotlight (the light follows the pointer along the lines
 * between the cells, and glides between them under the keyboard). The grid
 * re-flows as the industry filter changes (the ones that stay glide to their
 * new places, the rest fade where they stand). A customer with a story is a
 * button: a dot marks it, and pointing at it or focusing it lifts the
 * wordmark and slides "Read the story" in under it; the open one keeps its
 * wordmark in full ink over a bar in the accent. The others are named
 * images. Reduced motion: no light and no lift, the label simply appears. */

function Wordmark({ name, logo, mark }: SocialProofLogo) {
  return (
    logo ?? (
      <span className="flex items-center gap-2">
        {mark && (
          <svg viewBox="0 0 24 24" aria-hidden className="size-6 fill-current">
            {mark}
          </svg>
        )}
        <span aria-hidden className="text-xl font-semibold tracking-tight">
          {name}
        </span>
      </span>
    )
  )
}

const CELL = 'relative flex h-24 w-full flex-col items-center justify-center text-fg-muted transition-colors yj-duration-fast ease-standard'

interface LogoWallProps {
  logos: SocialProofLogo[]
  /** Which customers have a story to open, and which one is open. */
  stories: Set<string>
  openCustomer: string | undefined
  onOpen: (customer: string) => void
  loading: boolean
  copy: SocialProofCopy
  label: string
}

export function LogoWall({ logos, stories, openCustomer, onOpen, loading, copy, label }: LogoWallProps) {
  // Reduced motion: the wordmark stays put and the label simply appears (it sits clear of the wordmark either way).
  const { reduced } = useYouj()
  if (loading)
    return (
      <div aria-hidden className="overflow-hidden rounded-2xl border border-line">
        <div className="-me-px -mb-px grid grid-cols-2 sm:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="flex h-24 items-center justify-center border-e border-b border-line">
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    )
  if (logos.length === 0) return <p className="rounded-2xl border border-dashed border-line py-10 text-center text-ui text-fg-muted">{copy.noLogos}</p>
  return (
    <SpotlightGroup radius={200} className="overflow-hidden rounded-2xl border border-line">
      {/* The grid runs a hairline past the frame on its end and foot, so only lines between cells show. */}
      <PresenceList aria-label={label} className="-me-px -mb-px grid grid-cols-2 sm:grid-cols-4">
        {logos.map((logo) => {
          const open = openCustomer === logo.name
          return (
            <PresenceItem key={logo.name} className="flex">
              <SpotlightSurface className="flex w-full border-e border-b border-line">
                {stories.has(logo.name) ? (
                  <button
                    type="button"
                    aria-label={copy.openStory(logo.name)}
                    aria-pressed={open}
                    onClick={() => onOpen(logo.name)}
                    className={cn(CELL, 'group/logo -outline-offset-2 hover:text-fg focus-ring', open && 'text-fg')}
                  >
                    <span className={cn(!reduced && 'transition-transform yj-duration-base ease-standard group-hover/logo:-translate-y-2.5 group-focus-visible/logo:-translate-y-2.5')}>
                      <Wordmark {...logo} />
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        'absolute inset-x-0 bottom-3 flex items-center justify-center gap-1 text-ui-xs font-medium text-fg opacity-0 transition-[opacity,translate] yj-duration-base ease-standard',
                        'group-hover/logo:opacity-100 group-focus-visible/logo:opacity-100',
                        !reduced && 'translate-y-1 group-hover/logo:translate-y-0 group-focus-visible/logo:translate-y-0',
                      )}
                    >
                      {copy.readStory}
                      <ArrowRightIcon size={12} className="rtl:-scale-x-100" />
                    </span>
                    <span aria-hidden className={cn('absolute end-3 top-3 size-1.5 rounded-full', open ? 'bg-accent' : 'bg-line-strong')} />
                    {open && <span aria-hidden className="absolute inset-x-6 bottom-0 h-0.5 rounded-full bg-accent" />}
                  </button>
                ) : (
                  <span role="img" aria-label={logo.name} className={cn(CELL, 'hover:text-fg')}>
                    <Wordmark {...logo} />
                  </span>
                )}
              </SpotlightSurface>
            </PresenceItem>
          )
        })}
      </PresenceList>
    </SpotlightGroup>
  )
}
