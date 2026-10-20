'use client'

import { createContext, use, useEffect, useRef, useState, type ReactNode } from 'react'
import { CodePanel, type CodeFile, type CodeInstall } from '@/components/showcase/code-panel'
import type { BackdropId } from '@/lib/backdrops'
import type { BlockRefData } from '@/lib/block-ref'
import { cn } from '@/lib/cn'
import type { PreviewSize } from '@/lib/preview'
import type { Framing } from '@/lib/showcase'
import { BlockPreview } from './block-preview'
import { CreateBadge } from './create-badge'
import { BlockReferenceView, BlockUsageView } from './block-ref-view'
import { StoryContext, useStory, useStoryAddress, type StoryLike } from './story-context'
import { frugal } from '@/components/site/intent-link'

/* The client half of BlockStories (./block-stories): one preview
 * (./block-preview, a docs example's aurora panel and island) whose block is
 * the story on show, picked from the island's Story menu. The preview stays
 * mounted, so the reader's look, device, zoom, motion and size stay as they set
 * them; a new story loads its block's /view page in a second frame while the
 * old block stays, softened, and the two crossfade once the new one has
 * painted (./block-preview, ./story-switch). Pointing at a story's item
 * prefetches its page. A screen fills a tall
 * stage, a card or section is as tall as it is (the block's `framing`). The
 * story is the address's hash, as in ./stories-view, and what follows the
 * preview reads it through StoryDescription, BlockInstall, BlockCode and
 * BlockReference. The page carries the first story's install, usage and
 * reference; another story's is fetched when it's picked (app/code/ref), and
 * until it's here the last one stays in its place, so nothing jumps. */

export interface BlockStoryEntry extends StoryLike {
  /** The block's title: `Feature bento`. */
  title: string
  /** In the theme's own colour rather than the docs' monochrome ink. */
  accent: boolean
  /** What the block stands on (BlockStory's `backdrop`). */
  backdrop?: 'own' | 'glass' | BackdropId
  /** Its /view page with the story: `/view/blocks/marketing-feature-bento?story=Default`. */
  src: string
  framing: Framing
  size: PreviewSize
  /** The block's files as `youj add` writes them. */
  files: CodeFile[]
  install?: CodeInstall
  /** The .zip's name. */
  download: string
  /** Where its block's install, usage and reference are published: `/code/ref/blocks/app-error.json`. */
  ref: string
  /** A screen Create adds to a frame: its screen id there (`billing`). */
  create?: string
}

const refs = new Map<string, Promise<BlockRefData>>()

const prefetched = new Set<string>()

/** A story's /view page, fetched ahead when its item is pointed at or focused, so its frame loads from the cache. */
function prefetchPage(src: string) {
  if (prefetched.has(src) || frugal()) return
  prefetched.add(src)
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.href = src
  document.head.append(link)
}

/** A block's reference, fetched once per visit; a failed fetch is forgotten, so asking again retries it. */
function loadRef(src: string): Promise<BlockRefData> {
  let data = refs.get(src)
  if (!data) {
    data = fetch(src).then((res) => {
      if (!res.ok) throw new Error(`${src}: ${res.status}`)
      return res.json() as Promise<BlockRefData>
    })
    data.catch(() => refs.delete(src))
    refs.set(src, data)
  }
  return data
}

/** The reference on show: the story's once it's here, the last one (dimmed, inert) while it loads. */
interface RefShown {
  id: string
  data: BlockRefData
  pending: boolean
  retry?: () => void
}

const RefContext = createContext<RefShown | null>(null)

export function BlockStoriesView({ stories, first, children }: { stories: BlockStoryEntry[]; first: { ref: string; data: BlockRefData }; children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null)
  const [value, setValue] = useState(stories[0]!.id)
  const story = stories.find((s) => s.id === value) ?? stories[0]!

  const [loaded, setLoaded] = useState<Record<string, BlockRefData>>(() => ({ [first.ref]: first.data }))
  const [failed, setFailed] = useState<string | null>(null)
  const [attempt, setAttempt] = useState(0)
  const data = loaded[story.ref]
  const [last, setLast] = useState({ id: stories[0]!.id, data: first.data })
  if (data && last.id !== story.id) setLast({ id: story.id, data })
  useEffect(() => {
    if (loaded[story.ref]) return
    let live = true
    loadRef(story.ref).then(
      (d) => live && setLoaded((l) => ({ ...l, [story.ref]: d })),
      () => live && setFailed(story.ref),
    )
    return () => {
      live = false
    }
  }, [story.ref, loaded, attempt])
  const shown: RefShown = data
    ? { id: story.id, data, pending: false }
    : {
        ...last,
        pending: true,
        retry:
          failed === story.ref
            ? () => {
                setFailed(null)
                setAttempt((n) => n + 1)
              }
            : undefined,
      }

  const select = (id: string) => {
    if (id === value) return
    history.replaceState(history.state, '', id === stories[0]!.id ? location.pathname + location.search : `#${id}`)
    setValue(id)
  }
  useStoryAddress(stories.map((s) => s.id), root, setValue, select)
  const onIntent = (id: string) => {
    const s = stories.find((s) => s.id === id)
    if (s && id !== value) prefetchPage(s.src)
  }

  return (
    <StoryContext value={{ stories, story, select }}>
      <RefContext value={shown}>
      <div ref={root} data-stories="" className="scroll-mt-22">
        <BlockPreview
          src={story.src}
          title={story.title}
          framing={story.framing}
          size={story.size}
          install={story.install}
          accent={story.accent}
          backdrop={story.backdrop}
          story={{ value, options: stories.map(({ id, label }) => ({ id, label })), onChange: select, onIntent }}
        />
        {/* Under the preview, a screen that works in Create says so; the row holds its place on a page where any story does, so switching stories never moves the page. */}
        {stories.some((s) => s.create) && (
          <div className="not-prose mt-3 flex min-h-6">{story.create && <CreateBadge key={story.create} screen={story.create} />}</div>
        )}
      </div>
      {children}
      </RefContext>
    </StoryContext>
  )
}

function useShownRef(): RefShown {
  const shown = use(RefContext)
  if (!shown) throw new Error('BlockInstall and BlockReference go inside <BlockStories>')
  return shown
}

/** The reference on show; while another story's loads, the last one keeps its place, dimmed after a beat so a quick fetch doesn't flash. */
function RefFrame({ shown, children }: { shown: RefShown; children: ReactNode }) {
  return (
    <div
      aria-busy={shown.pending || undefined}
      inert={shown.pending}
      className={cn('transition-opacity duration-(--yj-duration-fast) ease-standard', shown.pending && 'opacity-50 delay-150')}
    >
      {shown.retry && (
        <p role="alert" className="not-prose mb-3 type-small text-fg-muted">
          This story’s reference didn’t load.{' '}
          <button type="button" onClick={shown.retry} className="underline underline-offset-2 hover:text-fg">
            Try again
          </button>
        </p>
      )}
      {children}
    </div>
  )
}

/** The story's block: its install command, what the CLI writes and the usage that feeds it your data. */
export function BlockInstall() {
  const shown = useShownRef()
  return (
    <RefFrame key={shown.id} shown={shown}>
      <BlockUsageView data={shown.data} />
    </RefFrame>
  )
}

/** The story's block's files, fetched once its tab is first seen. */
export function BlockCode() {
  const { story } = useStory<BlockStoryEntry>()
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
  return (
    <div ref={box} className="not-prose">
      <p className="mb-3 type-small text-fg-muted">
        {story.title}, the {story.label} story: the files <code className="code-inline">youj add</code> writes.
      </p>
      <div className="flex h-[32rem] flex-col overflow-hidden rounded-xl bg-(--code-bg)">
        <CodePanel key={story.id} idBase={`block-code-${story.id}`} files={story.files} install={story.install} download={story.download} height="100%" open={seen} collapsibleTree />
      </div>
    </div>
  )
}

/** The story's block's Props, Strings and what it is built from. */
export function BlockReference() {
  const shown = useShownRef()
  return (
    <RefFrame key={shown.id} shown={shown}>
      <BlockReferenceView data={shown.data} />
    </RefFrame>
  )
}
