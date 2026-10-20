import { Suspense } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { InertLinks } from '@/components/docs/inert-links'
import { ShowcaseView } from '@/components/showcase/showcase-view'
import { BUILT_BLOCKS } from '@/components/site/ui-generation/built-blocks'
import { basics } from '@/lib/basics'
import { showcaseFiles } from '@/lib/code-files'
import { codeUrl } from '@/lib/code-url'
import { demoItems } from '@/lib/demo-views'
import type { BasicLevel } from '@/lib/level-paths'
import { block, blocks, framing } from '@/lib/showcase'

type Props = { params: Promise<{ kind: string; slug: string }> }

function entry(kind: string, slug: string) {
  return kind === 'blocks' ? block(slug) : undefined
}

/* A primitive's or pattern's main docs demo: the capture target of the Primitives and Patterns lists. */
const isDemo = (kind: string, slug: string) => demoItems().some((i) => i.kind === kind && i.slug === slug)

/* The bare demo behind every Blocks frame. The header hides
 * itself on /view, so the page is the demo alone, landmarks included: apps
 * and most blocks bring their own <main>, so this wrapper isn't one. A card or a section stands on the white page
 * in light, the stage a list and the viewer draw it on (a card's stage takes the docs' gradient and the card is
 * white on it, styles/site.css); a whole page keeps its own. */
export default async function View({ params }: Props) {
  const { kind, slug } = await params
  if (isDemo(kind, slug)) {
    // `?story=button/sizes`: any other live example of its docs page (the viewer's stories); the main demo by default.
    const demos = basics(kind as BasicLevel).find((e) => e.slug === slug)?.demos.map((d) => d.id) ?? []
    return (
      <InertLinks id="main" data-frame-view="" className="flex flex-1 flex-col">
        <Suspense>
          <ShowcaseView id={`${kind}/${slug}`} themed={false} page="white" framing="card" stories={demos} demos />
        </Suspense>
      </InertLinks>
    )
  }
  const found = entry(kind, slug)
  if (!found) notFound()
  // its main file, for the Code entrance (components/site/ui-generation)
  const main = showcaseFiles()[`${kind}/${slug}`]?.[0]?.path
  return (
    <InertLinks id="main" data-frame-view="" className="flex flex-1 flex-col">
      <Suspense>
        <ShowcaseView
          id={`${kind}/${slug}`}
          themed={found.themed}
          page={framing(found) === 'screen' ? found.page : 'white'}
          framing={framing(found)}
          stories={found.stories.map((s) => s.id)}
          build={BUILT_BLOCKS.has(`${kind}/${slug}`)}
          code={main ? codeUrl.item('blocks', slug, main) : undefined}
        />
      </Suspense>
    </InertLinks>
  )
}

export function generateStaticParams() {
  return [...blocks(), ...demoItems()].map((e) => ({ kind: e.kind as string, slug: e.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { kind, slug } = await params
  if (isDemo(kind, slug)) return { title: slug, robots: { index: false } }
  const found = entry(kind, slug)
  if (!found) notFound()
  // Frames, not destinations: keep them out of search results.
  return { title: found.title, robots: { index: false } }
}
