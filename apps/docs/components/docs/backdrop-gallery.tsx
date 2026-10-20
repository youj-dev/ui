'use client'

import { ThemeScope } from '@youj/core'
import { internalPresetById } from '@youj/core/lib/youj/theme'
import { StatBreakdown, StatCard } from '@youj/react'
import { BACKDROPS, type Backdrop } from '@/lib/backdrops'
import { BackdropLayer } from './backdrop-layer'

/* The backdrops page's gallery (/docs/backdrops): each backdrop live, in the site's light or dark, with a card in
 * the preset drawn from the same colours, then its Wada combination and the story the docs show on it. The words
 * for machines are the page's table; this only draws. */

const PARTS = [
  { label: 'Direct', value: 38 },
  { label: 'Search', value: 27 },
  { label: 'Referral', value: 17 },
  { label: 'Social', value: 11 },
  { label: 'Email', value: 7 },
]

export function BackdropGallery() {
  return (
    <div className="not-prose my-6 grid gap-x-4 gap-y-7 sm:grid-cols-2">
      {BACKDROPS.map((backdrop) => (
        <Tile key={backdrop.id} backdrop={backdrop} />
      ))}
    </div>
  )
}

function Tile({ backdrop }: { backdrop: Backdrop }) {
  const preset = internalPresetById(backdrop.palette)
  return (
    <figure className="m-0">
      <div className="site-card relative isolate grid aspect-[16/10] place-items-center overflow-hidden rounded-xl">
        <BackdropLayer id={backdrop.id} className="-z-10" />
        <ThemeScope theme={preset}>
          <StatCard
            aria-hidden
            inert
            className="w-[min(17rem,80%)] shadow-xl"
            label="Visitors"
            value={18406}
            delta={0.124}
            comparison="vs. last week"
            chart={<StatBreakdown parts={PARTS} legend={false} />}
          />
        </ThemeScope>
      </div>
      <figcaption className="mt-3 grid gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="font-medium text-fg">{backdrop.name}</span>
          <a href={backdrop.showcase.href} className="text-ui-sm text-fg-muted underline-offset-4 hover:text-fg hover:underline">
            {backdrop.showcase.label} on it
          </a>
        </div>
        <p className="text-ui-sm text-fg-muted">
          {backdrop.technique}; the {preset.name} preset.
        </p>
        <div className="flex items-center gap-1.5">
          <span className="me-1 font-mono text-ui-xs text-fg-subtle">Wada {backdrop.wada.number}</span>
          {backdrop.wada.swatches.map((swatch) => (
            <span key={swatch.name} title={swatch.name} className="size-3.5 rounded-sm ring-1 ring-line" style={{ background: swatch.hex }}>
              <span className="sr-only">{swatch.name}</span>
            </span>
          ))}
        </div>
      </figcaption>
    </figure>
  )
}
