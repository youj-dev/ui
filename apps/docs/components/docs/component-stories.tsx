import { Children, isValidElement, type ReactElement, type ReactNode } from 'react'
import { ComponentPreview, previewFor } from './component-preview'
import { StoriesView, type StoryEntry } from './stories-view'

/* A component page's examples as one preview with a Story menu, and what
 * follows it (the tabs) able to read the story on show:
 *
 *   <ComponentStories>
 *   <Story id="demo" label="Demo">
 *   <ComponentPreview name="field/demo" height={560} />
 *   What it shows, and anything only this story needs said.
 *   </Story>
 *   …
 *   <Examples label="Get started">…<StoryDescription />…<StoryCode />…</Examples>
 *   </ComponentStories>
 *
 * Each Story keeps its ComponentPreview as written, so the scripts that read
 * a page's previews (lib/basics.ts, scripts/stage-heights.ts, the examples
 * test, the Markdown export) see them as on any other page. Here the preview
 * is read for its example and height, and the rest of the Story is its
 * description, which StoryDescription shows while it's on show. */

interface StoryProps {
  /** Its hash, `#validation`; the first story is the default and has none. */
  id: string
  label: string
  children: ReactNode
}

/** One story: a ComponentPreview and its description. Read by ComponentStories; renders nothing itself. */
export function Story(_: StoryProps) {
  return null
}

type PreviewProps = Parameters<typeof ComponentPreview>[0]

export function ComponentStories({ children }: { children: ReactNode }) {
  const nodes = Children.toArray(children)
  const stories: StoryEntry[] = nodes
    .filter((node): node is ReactElement<StoryProps> => isValidElement(node) && node.type === Story)
    .map(({ props }) => {
      const parts = Children.toArray(props.children)
      const preview = parts.find((part): part is ReactElement<PreviewProps> => isValidElement(part) && part.type === ComponentPreview)
      if (!preview) throw new Error(`Story "${props.id}" needs a <ComponentPreview>`)
      const { name, height, full } = preview.props
      return { id: props.id, label: props.label, frame: { ...previewFor(name), height, full }, description: parts.filter((part) => part !== preview) }
    })
  const rest = nodes.filter((node) => !(isValidElement(node) && node.type === Story))
  return <StoriesView stories={stories}>{rest}</StoriesView>
}
