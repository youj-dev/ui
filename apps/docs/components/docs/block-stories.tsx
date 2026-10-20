import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import type { BlockStoryEntry } from './block-stories-view'
import { BlockStoriesView } from '@/components/mdx-lazy'
import { installedFiles, registryInstall, stackInstall, viewUrl } from '@/components/showcase/install-parts'
import { BACKDROP_IDS, isBackdropId, type BackdropId } from '@/lib/backdrops'
import { blockRef } from '@/lib/block-ref'
import { codeUrl } from '@/lib/code-url'
import { defaultSize } from '@/lib/preview'
import { block, framing, type Block } from '@/lib/showcase'
import { taxonomyOf } from '@/lib/taxonomy'

/* A block-family page's examples as one live preview with a Story menu, and
 * what follows it (the tabs, the Reference) able to read the story on show.
 * Where ComponentStories shows one component's examples, each story here can
 * be a different block of the family:
 *
 *   <BlockStories>
 *   <BlockStory id="bento" label="Bento" block="marketing-feature-bento" story="Default">
 *   What it shows, and anything only this story needs said.
 *   </BlockStory>
 *   …
 *   <Examples label="Get started" buttons>…<BlockInstall />…<StoryDescription />…<BlockCode />…</Examples>
 *
 *   ## Reference
 *   <BlockReference />
 *   <ReferenceRow title="Accessibility" summary="…">…</ReferenceRow>
 *   </BlockStories>
 *
 * The block's install, usage and reference are data (lib/block-ref.ts): the
 * page carries the first story's, and the client half (./block-stories-view)
 * fetches another story's when it's picked (app/code/ref). The preview is the block's /view page in the viewer's frame
 * (components/showcase/viewport-frame.tsx), so it is exactly what the block's
 * own page and gallery show. */

interface BlockStoryProps {
  /** Its hash, `#bento`; the first story is the default and has none. */
  id: string
  label: string
  /** The block's slug: `marketing-feature-bento`. */
  block: string
  /** The story's export in the block's stories file: `Default`. The first story when omitted. */
  story?: string
  /** Shown in the theme's own colour, not the docs' monochrome ink: a block that reads wrong without it (a support chat). */
  accent?: boolean
  /**
   * What the block stands on: the aurora (default); `own`, its own background filling the whole preview (a hero that
   * is about its backdrop); `glass`, a frosted panel on the aurora; or a backdrop by name (lib/backdrops: `meadow`,
   * `sandstone`, `cinnabar`, `umber`, `seaglass`, `heather`), painted in the site's light or dark, the block in the
   * preset of the same name until the reader picks another.
   */
  backdrop?: 'own' | 'glass' | BackdropId
  children: ReactNode
}

/** One story: a block, which of its stories to show, and a description. Read by BlockStories; renders nothing itself. */
export function BlockStory(_: BlockStoryProps) {
  return null
}

export async function BlockStories({ children }: { children: ReactNode }) {
  const nodes = Children.toArray(children)
  const stories: (BlockStoryEntry & { item: Block })[] = nodes
    .filter((node): node is ReactElement<BlockStoryProps> => isValidElement(node) && node.type === BlockStory)
    .flatMap(({ props }) => {
      const b = block(props.block)
      if (!b) throw new Error(`Story "${props.id}": no block "${props.block}"`)
      const story = props.story ?? b.stories[0]?.id
      if (!story || !b.stories.some((s) => s.id === story)) throw new Error(`Story "${props.id}": "${props.block}" has no story "${props.story}" (${b.stories.map((s) => s.id).join(', ')})`)
      if (props.backdrop && props.backdrop !== 'own' && props.backdrop !== 'glass' && !isBackdropId(props.backdrop))
        throw new Error(`Story "${props.id}": no backdrop "${props.backdrop}" (own, glass, ${BACKDROP_IDS.join(', ')})`)
      const entry = {
        id: props.id,
        label: props.label,
        accent: props.accent ?? false,
        backdrop: props.backdrop,
        description: props.children,
        title: b.title,
        src: `${viewUrl(b)}?story=${story}`,
        framing: framing(b),
        size: defaultSize(),
        files: installedFiles(b),
        install: 'stack' in b && b.stack ? stackInstall(b.stack) : registryInstall(b.registry),
        download: b.slug,
        ref: codeUrl.ref(b.kind, b.slug),
        // A screen Create offers to add to a frame (taxonomy.json's inApp), by Create's screen id.
        create: taxonomyOf(props.block)?.inApp ? props.block.replace(/^[a-z]+-/, '') : undefined,
        item: b,
      }
      // An in-app screen draws as a page of your frame by default; its full standalone page (`embedded={false}`) follows as a story of its own.
      const standalone = entry.create && story !== 'Standalone' && b.stories.some((s) => s.id === 'Standalone')
      return standalone ? [entry, { ...entry, id: `${props.id}-standalone`, label: `${props.label}, standalone`, src: `${viewUrl(b)}?story=Standalone` }] : [entry]
    })
  if (!stories.length) throw new Error('BlockStories needs at least one <BlockStory>')
  // The first story's reference comes with the page (and any other story of the same block reads it); the rest are fetched when picked.
  const first = stories[0]!
  const data = await blockRef(first.item)
  const rest = nodes.filter((node) => !(isValidElement(node) && node.type === BlockStory))
  return (
    <BlockStoriesView stories={stories.map(({ item: _, ...s }) => s)} first={{ ref: first.ref, data }}>
      {rest}
    </BlockStoriesView>
  )
}
