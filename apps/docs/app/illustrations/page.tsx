import type { Metadata } from 'next'
import type { SceneDetail } from '@/components/illustrations/catalog'
import { SCENE_LINK_SCRIPT } from '@/components/illustrations/query'
import { IllustrationShowroom } from '@/components/illustrations/showroom'
import { componentDoc } from '@/lib/props'
import { registryItems } from '@/lib/registry'
import { itemHref } from '@/lib/block-docs'
import { blocks } from '@/lib/showcase'
import { InlineScript } from '@/components/inline-script'

export const metadata: Metadata = {
  title: 'Illustration explorer',
  description:
    'Explore every Youj illustration: isometric scenes drawn from your theme. Search by name, category or tag, preview any scene live in any preset, light or dark, copy the code or the install command, and download it as SVG or PNG.',
}

/** What each scene's registry item (`illustration-<id>`) says about it: its export name and what it shows. */
function sceneDetails(): Record<string, SceneDetail> {
  const out: Record<string, SceneDetail> = {}
  for (const item of registryItems().values()) {
    const meta = (item as { meta?: { scene?: string; component?: string } }).meta
    if (!item.name.startsWith('illustration-') || !meta?.scene || !meta.component) continue
    out[meta.scene] = { component: meta.component, description: (item.description ?? '').split(/(?<=\.)\s/)[0] ?? '' }
  }
  return out
}

export default function IllustrationsPage() {
  return (
    <main id="main" tabIndex={-1} className="min-h-0 flex-1 outline-none">
      <InlineScript code={SCENE_LINK_SCRIPT} />
      <IllustrationShowroom
        details={sceneDetails()}
        blocks={blocks()
          .filter((b) => b.illustration)
          .map((b) => ({ href: itemHref(b)!, title: b.title, group: b.group }))}
        props={componentDoc('IllustrationProps')}
      />
    </main>
  )
}
