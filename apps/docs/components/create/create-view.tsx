'use client'

import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { YoujProvider, ThemeScope } from '@youj/core'
import { SettledEntrances } from '@youj/motion'
import { sitePreset } from '@/lib/preview'
import { useThemeFonts } from '@youj/react/docs/create/load-fonts'
import { FramePreview } from '@youj/react/docs/create/render'
import { CREATE_CHANNEL, readCreate, readCreateMessage, type CreateMessage } from '@/lib/create'
import { useFrameState, type FrameState } from '@/lib/frame-sync'
// The frame is built from blocks, whose utilities global.css leaves out.
import '@/app/gallery.css'

/** How long a framed preview waits for the page before it shows its own URL's frame. */
const WAIT = 1500

/**
 * The frame Create is building, on its own page: what Create's preview loads
 * in an iframe, so the frame's breakpoints answer to the device width. In the
 * iframe, the page sends the frame and theme (lib/create) and the site's mode
 * and motion (lib/frame-sync) live, with no reload; the frame keeps its own
 * URL in step, so a reload or a new tab shows the same frame. The theme's
 * typefaces load as they're chosen.
 */
export function CreateView() {
  const [query, setQuery] = useState<string | null>(null)

  useEffect(() => {
    if (window.parent === window) {
      setQuery(window.location.search.slice(1))
      return
    }
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== window.parent) return
      const message = readCreateMessage(event.data)
      if (message?.kind !== 'state') return
      setQuery(message.query)
      window.history.replaceState(null, '', message.query ? `?${message.query}` : window.location.pathname)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  // Ask the page for the state until it answers: it may still be hydrating when the frame first asks.
  const heard = query !== null
  useEffect(() => {
    if (window.parent === window || heard) return
    const hello: CreateMessage = { channel: CREATE_CHANNEL, kind: 'hello' }
    const say = () => window.parent.postMessage(hello, window.location.origin)
    say()
    const id = setInterval(say, 200)
    return () => clearInterval(id)
  }, [heard])

  const frame = useFrameState()
  const [gaveUp, setGaveUp] = useState(false)
  useEffect(() => {
    if (!frame.framed || (query !== null && frame.state)) return
    const timer = setTimeout(() => {
      setGaveUp(true)
      setQuery((q) => q ?? window.location.search.slice(1))
    }, WAIT)
    return () => clearTimeout(timer)
  }, [frame.framed, frame.state, query])

  const state = useMemo(() => (query === null ? null : readCreate(query)), [query])
  useThemeFonts(state?.theme.fonts)
  if (!state || (frame.framed && !frame.state && !gaveUp)) {
    return (
      <div aria-busy className="grid min-h-dvh flex-1 place-items-center text-ui text-fg-muted">
        Loading…
      </div>
    )
  }
  // The style and the size are Create's own (the link's), not the site's previews': they're what the export's provider tag sets (the standard size, roomy at 100%, until another is picked).
  return (
    <FrameMotion state={frame.state}>
      <ThemeScope theme={state.theme} look={state.style} {...state.size}>
        <Painted onPaint={frame.ready}>
          <SettledEntrances>
            <FramePreview config={state.frame} />
          </SettledEntrances>
        </Painted>
      </ThemeScope>
    </FrameMotion>
  )
}

/** The frame's speed and reduced motion (its toolbar's) from the page, as the showcase's frames take them. */
function FrameMotion({ state, children }: { state: FrameState | null; children: ReactNode }) {
  if (!state) return children
  return (
    <YoujProvider theme={sitePreset(state.preset)} timeScale={1 / state.speed} reducedMotion={state.reduced ? 'always' : 'user'}>
      {children}
    </YoujProvider>
  )
}

/** Tells the page once the frame's first frame is on screen, so it fades in with no flash. */
function Painted({ onPaint, children }: { onPaint: () => void; children: ReactNode }) {
  useEffect(() => {
    let inner = 0
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(onPaint)
    })
    return () => {
      cancelAnimationFrame(outer)
      cancelAnimationFrame(inner)
    }
  }, [onPaint])
  return children
}
