import type { Metadata } from 'next'
import { IconLayers } from '@/components/graphics/icons/icon-layers'
import { IconsShowroom } from '@/components/icons/showroom'
import { iconSvgs } from '@/lib/icon-svgs'
import { registryItems } from '@/lib/registry'

export const metadata: Metadata = {
  title: 'Icon explorer',
  description: 'Explore every Youj icon: static, animated, morphing and swapping. Search by meaning, preview at your size, stroke and color, and copy React, SVG, JSX or the install command.',
}

/** Each icon's choreography, from its doc comment via the registry. */
function descriptions() {
  const out: Record<string, string> = {}
  for (const item of registryItems().values()) {
    if (item.name.startsWith('icon-') && item.files?.[0]?.path.endsWith(`/icons/${item.name.slice('icon-'.length)}.tsx`)) out[item.name.slice('icon-'.length)] = item.description ?? ''
  }
  return out
}

function MorphIntro() {
  return (
    <div className="grid items-center gap-x-8 gap-y-2 pt-1 pb-2 2xl:grid-cols-[minmax(0,20rem)_minmax(0,1fr)]">
      <div className="max-w-md">
        <h2 className="type-heading text-fg">Two poses on one grid, and the path between.</h2>
        <p className="mt-2 text-[13.5px] leading-relaxed text-pretty text-fg-muted">
          A state icon rests in one state and morphs to the other on the motion tokens, reversing from wherever it is. Pull one apart here, then hover any icon below, or press
          Morph all to turn them in a wave.
        </p>
      </div>
      <IconLayers />
    </div>
  )
}

export default function IconsPage() {
  return (
    <main id="main" tabIndex={-1} className="min-h-0 flex-1 outline-none">
      <IconsShowroom svgs={iconSvgs()} descriptions={descriptions()} morphIntro={<MorphIntro />} />
    </main>
  )
}
