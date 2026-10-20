'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useSearchParams } from 'next/navigation'
import type { FrameConfig } from '@youj/react/docs/create/config'
import type { Theme } from '@youj/core/lib/youj/theme/contract'
import type { YoujLook } from '@youj/core/lib/youj/look'
import type { SizeConfig } from '@youj/react/docs/create/size-url'
import type { InternalThemeId as ThemeId } from '@youj/core/lib/youj/theme'
import { SITE_PRESET } from '@/lib/preview'
import { useModePreset } from '@/lib/site-theme'
import { CREATE_CHANNEL, createQuery, readCreate, readCreateMessage, type CreateMessage, type CreateState } from '@/lib/create'

export const STEPS = ['frame', 'parts', 'screens', 'theme', 'preview'] as const
export type Step = (typeof STEPS)[number]

/** The step a link names; null when it names none (each screen size opens on its own first step). */
const readStep = (value: string | null): Step | null => (STEPS.includes(value as Step) ? (value as Step) : null)

/**
 * Create's state: the frame, the theme, the style and the size, read from the URL once
 * and written back as they change (no navigation, no history entry), so the
 * address is always a link to what's on screen. The step is in the URL too,
 * so a link can open on the theme, and `step=export` while the code is open,
 * so a link can open on the code too. A link that names nothing starts in the
 * site's preset.
 */
export function useCreate() {
  const params = useSearchParams()
  // Where a link that names nothing starts: the site's preset for the mode (Graphite in light, Basalt in dark). The server
  // can't know the stored mode, so the first render (and hydration) takes the dark one, and once the mode is known a
  // link that names nothing moves to its preset, set while rendering, before anything has been changed.
  const modeStart = useModePreset()
  const startPreset = modeStart ?? SITE_PRESET.dark
  const [state, setState] = useState<CreateState>(() => readCreate(params.toString(), SITE_PRESET.dark))
  // The preset a link that names nothing wears for now (null once the link names one or a theme has been picked), and its theme.
  const [auto, setAuto] = useState(() => ([...params.keys()].some((key) => key !== 'step') ? null : { preset: SITE_PRESET.dark as ThemeId, theme: state.theme }))
  if (auto && auto.preset !== startPreset) {
    if (state.theme === auto.theme) {
      const theme = readCreate('', startPreset).theme
      setAuto({ preset: startPreset, theme })
      setState((s) => ({ ...s, theme }))
    } else setAuto(null)
  }
  const [step, setStep] = useState<Step | null>(() => readStep(params.get('step')))
  const [exporting, setExporting] = useState(() => params.get('step') === 'export')
  const query = useMemo(() => createQuery(state), [state])

  useEffect(() => {
    // Once per frame at most, however fast a slider moves.
    const id = requestAnimationFrame(() => {
      const next = new URLSearchParams(query)
      if (exporting) next.set('step', 'export')
      else if (step) next.set('step', step)
      const search = next.toString()
      if (search !== window.location.search.slice(1)) window.history.replaceState(null, '', search ? `?${search}` : window.location.pathname)
    })
    return () => cancelAnimationFrame(id)
  }, [query, step, exporting])

  const setFrame = useCallback((patch: Partial<FrameConfig>) => setState((s) => ({ ...s, frame: { ...s.frame, ...patch } })), [])
  const setTheme = useCallback((theme: Theme) => setState((s) => ({ ...s, theme })), [])
  const setLook = useCallback((style: YoujLook) => setState((s) => ({ ...s, style })), [])
  const setSize = useCallback((size: SizeConfig) => setState((s) => ({ ...s, size })), [])
  const replace = useCallback((next: CreateState) => setState(next), [])
  return { ...state, query, startPreset, setFrame, setTheme, setLook, setSize, replace, step, setStep, exporting, setExporting }
}

/**
 * Keeps the preview frame showing `query`: answers each hello from the frame
 * inside `root` (it asks until it hears, and again after a reload) and sends
 * every change.
 */
export function usePreviewChannel(root: RefObject<HTMLElement | null>, query: string) {
  const latest = useRef(query)
  latest.current = query

  const post = useCallback(() => {
    const message: CreateMessage = { channel: CREATE_CHANNEL, kind: 'state', query: latest.current }
    root.current?.querySelector('iframe')?.contentWindow?.postMessage(message, window.location.origin)
  }, [root])

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== root.current?.querySelector('iframe')?.contentWindow) return
      const message = readCreateMessage(event.data)
      if (message?.kind === 'hello') post()
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [root, post])

  useEffect(post, [query, post])
}
