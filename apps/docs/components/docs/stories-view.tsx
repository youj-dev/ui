'use client'

import { startTransition, useEffect, useRef, useState, type ReactNode } from 'react'
import { useYouj } from '@youj/core/lib/youj/provider'
import { CodePanel } from '@/components/showcase/code-panel'
import { CodeSource } from '@/components/ui/code-source'
import { codeUrl, useCode } from '@/lib/code-load'
import { PreviewFrame, type PreviewFrameProps } from './preview-frame'
import { StoryContext, useStory, useStoryAddress, type StoryLike } from './story-context'
import { frugal } from '@/components/site/intent-link'
import { sharpen, soften } from './story-switch'

/* The client half of ComponentStories (./component-stories.tsx): one preview
 * frame whose example is the story on show, picked from the Story menu in its
 * strip. The frame stays mounted, so the reader's look, motion and size stay
 * as they set them. A pick plays the switch (./story-switch): the old demo
 * softens at once and stays, under the stage's breathing, while the new one's
 * chunk loads (a transition holds it committed), and once the new one has
 * painted the two crossfade while the stage eases to its height (preview-live.tsx).
 * A story's chunk loads ahead when its menu item is pointed at or focused, and
 * the stories either side of the one on show load at idle (not on Save-Data).
 * The story is the address's hash (`#validation`, none for the first), so a
 * story can be linked and the anchors of the old Examples tabs land on it.
 * What follows the frame (the tabs) reads the story through StoryDescription
 * and StoryCode. The other stories' descriptions stay in the page, hidden
 * until found, so find-in-page opens the story whose text matches. */

export { StoryDescription } from './story-context'

export interface StoryEntry extends StoryLike {
  frame: Pick<PreviewFrameProps, 'name' | 'file' | 'reserve' | 'view' | 'height' | 'full'>
}

export function StoriesView({ stories, children }: { stories: StoryEntry[]; children: ReactNode }) {
  const k = useYouj()
  const root = useRef<HTMLDivElement>(null)
  // The story on show, and the one picked (ahead of it while the switch plays).
  const [value, setValue] = useState(stories[0]!.id)
  const [target, setTarget] = useState(value)
  const story = stories.find((s) => s.id === value) ?? stories[0]!

  const preload = (id: string) => {
    const name = stories.find((s) => s.id === id)?.frame.name
    // The examples index is preview-live's chunk, here once the frame is live.
    if (name) import('@/examples').then(({ examples }) => examples[name]?.preload()).catch(() => {})
  }

  // A transition: the old demo stays committed (softened) while the new one's chunk loads, never the empty shell.
  const commit = (id: string) => startTransition(() => setValue(id))

  const go = (id: string) => {
    setTarget(id)
    const content = root.current?.querySelector<HTMLElement>('[data-live] .stage-scroll, [data-live] [data-phone]')
    if (content) (id === value ? sharpen : soften)(content, k)
    if (id !== value) preload(id)
    commit(id)
  }

  const select = (id: string) => {
    if (id === target) return
    history.replaceState(history.state, '', id === stories[0]!.id ? location.pathname + location.search : `#${id}`)
    go(id)
  }

  useStoryAddress(
    stories.map((s) => s.id),
    root,
    (id, arriving) => {
      if (!arriving) return go(id)
      setValue(id)
      setTarget(id)
    },
    (id) => select(id),
  )

  // The stories either side of the one on show, once its frame is live and the browser idle (preview-live.tsx).
  const onIdle = () => {
    if (frugal()) return
    const at = stories.findIndex((s) => s.id === value)
    for (const s of [stories[at - 1], stories[at + 1]]) if (s) preload(s.id)
  }

  return (
    <StoryContext value={{ stories, story, select }}>
      <div ref={root} data-stories="" className="scroll-mt-22">
        <PreviewFrame
          {...story.frame}
          story={{ value: target, options: stories.map(({ id, label }) => ({ id, label })), onChange: select, named: true, pending: target !== value, onIntent: preload, onIdle }}
        />
      </div>
      {children}
    </StoryContext>
  )
}

/** The story on show's source, fetched once its tab is first seen. */
export function StoryCode() {
  const { story } = useStory<StoryEntry>()
  const { name, file } = story.frame
  const box = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = box.current
    if (!el || seen) return
    if (!window.IntersectionObserver) return setSeen(true)
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && setSeen(true))
    observer.observe(el)
    return () => observer.disconnect()
  }, [seen])
  const src = codeUrl.example(name)
  const state = useCode(seen ? src : null)
  return (
    <div ref={box} className="not-prose">
      <p className="mb-3 type-small text-fg-muted">
        <code className="code-inline">{file}</code>, the {story.label} story. The component itself comes from the package.
      </p>
      <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl bg-(--code-bg)">
        {state.status === 'ready' ? (
          <CodePanel key={name} idBase={`story-code-${name.replace(/\W/g, '-')}`} files={[{ path: `examples/${name}.tsx`, src, lines: state.body.code.split('\n').length }]} download={name.replace(/\W/g, '-')} height="100%" collapsibleTree />
        ) : (
          <div aria-busy={state.status === 'loading' || undefined} className="min-h-0 flex-1 overflow-auto">
            <CodeSource state={state} />
          </div>
        )}
      </div>
    </div>
  )
}
