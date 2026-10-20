'use client'

import { createContext, use, useEffect, useLayoutEffect, useRef, type ReactNode, type RefObject } from 'react'

/* What a story page's tabs read, whatever the page shows the story with: a
 * component's examples (./stories-view) or a family of blocks
 * (./block-stories-view). Both provide this context, so StoryDescription
 * works in either, and both take the story from the address the same way. */

export interface StoryLike {
  id: string
  label: string
  description: ReactNode
}

export interface StoryState<T extends StoryLike = StoryLike> {
  stories: T[]
  story: T
  select: (id: string) => void
}

export const StoryContext = createContext<StoryState<any> | null>(null)

export function useStory<T extends StoryLike = StoryLike>(): StoryState<T> {
  const context = use(StoryContext)
  if (!context) throw new Error('Story tabs go inside <ComponentStories> or <BlockStories>')
  return context
}

/** React has no `until-found`: a hidden panel is upgraded where it mounts, so find-in-page can open it. */
const untilFound = (el: HTMLElement | null) => {
  if (el?.hidden) el.setAttribute('hidden', 'until-found')
}

/**
 * The story is the address's hash (`#validation`, none for the first), so a
 * story can be linked: read on arrival (before paint, so the default never
 * shows first) and when it changes, when `show` is told it isn't `arriving`, so
 * it can play the switch. A match find-in-page makes inside a hidden story's
 * text shows that story too.
 */
export function useStoryAddress(ids: string[], root: RefObject<HTMLElement | null>, show: (id: string, arriving: boolean) => void, select: (id: string) => void) {
  const ref = useRef({ ids, show, select })
  ref.current = { ids, show, select }

  useLayoutEffect(() => {
    const read = (arriving: boolean) => {
      const id = decodeURIComponent(location.hash.slice(1))
      if (!ref.current.ids.includes(id)) return false
      ref.current.show(id, arriving)
      return true
    }
    read(true)
    const onHash = () => {
      if (read(false)) root.current?.scrollIntoView({ block: 'start' })
    }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    const onMatch = (event: Event) => {
      const id = (event.target as HTMLElement).closest<HTMLElement>('[data-story]')?.dataset.story
      if (id) ref.current.select(id)
    }
    document.addEventListener('beforematch', onMatch)
    return () => document.removeEventListener('beforematch', onMatch)
  }, [])
}

/** Each story's description (what its <Story> holds besides the preview): the one on show, the rest found by find-in-page. */
export function StoryDescription() {
  const { stories, story } = useStory()
  return stories.map((s) => (
    <div key={s.id} data-story={s.id} hidden={s.id !== story.id} ref={untilFound}>
      {s.description}
    </div>
  ))
}
