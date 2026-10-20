import type { Metadata } from 'next'
import { miniatures, type MiniatureMeta } from '@youj/miniatures'
import type { ShowroomMiniature } from '@/components/miniatures/catalog'
import { MiniaturesShowroom } from '@/components/miniatures/miniatures-showroom'
import { MINIATURE_PROPS } from '@/components/miniatures/props'

export const metadata: Metadata = {
  title: 'Miniatures',
  description: 'Interactive isometric models of real things, for React.',
}

/** The catalogue's metadata, cut to what the client needs up front (the search reads the maker and the description). */
const showroomMiniature = ({ id, name, model, maker, study, spec, description, keys, initial, progress }: MiniatureMeta): ShowroomMiniature => ({
  id,
  name,
  model,
  maker,
  study,
  spec,
  description,
  keys,
  initial,
  progress,
})

export default function MiniaturesPage() {
  return (
    <main id="main" tabIndex={-1} className="min-h-0 flex-1 outline-none">
      <p
        role="note"
        className="border-b border-line bg-[color-mix(in_oklab,var(--color-warning)_12%,var(--color-canvas))] px-4 py-2 text-center text-[13px] leading-snug text-fg"
      >
        <span className="font-medium">New.</span> Miniatures are ready to use; names, props and visuals may still change between releases before 1.0.
      </p>
      <MiniaturesShowroom miniatures={miniatures.map(showroomMiniature)} props={MINIATURE_PROPS} />
    </main>
  )
}
