'use client'

import type { ComponentType, ReactNode } from 'react'
// The blocks' utilities, which global.css leaves out: whatever renders a story loads them.
import '@/app/gallery.css'

/* Just enough of Storybook's CSF shape to render a story outside Storybook:
 * the story's `render` with the merged args, else the component with them. */

type Args = Record<string, unknown>

interface StoryObject {
  args?: Args
  render?: (args: Args, context: object) => ReactNode
  component?: ComponentType<Args>
}

interface Meta extends StoryObject {
  title?: string
}

/** A story file (a CSF default export of meta), or a lone demo (its default export is the component: what a component's card renders). */
export type StoryModule = { default: Meta | ComponentType } & Record<string, unknown>

/** The story's named exports, in file order (`__namedExportsOrder` when present). */
export function storyIds(mod: StoryModule): string[] {
  const order = mod.__namedExportsOrder
  const ids = Array.isArray(order) ? (order as string[]) : Object.keys(mod)
  return ids.filter((id) => id !== 'default' && /^[A-Z]/.test(id) && typeof mod[id] === 'object' && mod[id] !== null)
}

/** `extra` args go over the story's own: the frame passes a demo the theme to show it in. */
export function renderStory(mod: StoryModule, id: string | undefined, extra?: Args): ReactNode {
  if (typeof mod.default === 'function') {
    const Demo = mod.default
    return <Demo />
  }
  const meta = mod.default
  const key = id && storyIds(mod).includes(id) ? id : storyIds(mod)[0]
  const story = (key ? mod[key] : {}) as StoryObject
  const args = { ...meta.args, ...story.args, ...extra }
  const render = story.render ?? meta.render
  if (render) return render(args, { args })
  const Component = story.component ?? meta.component
  return Component ? <Component {...args} /> : null
}
