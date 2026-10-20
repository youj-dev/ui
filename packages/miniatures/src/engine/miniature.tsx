import { type CSSProperties, type HTMLAttributes, type Ref, type RefObject, useEffect, useId, useImperativeHandle, useLayoutEffect, useMemo, useRef } from 'react'
import { mountFigure, type MountedFigure, type Settings } from './env'
import { shortcutName } from './keys'
import { createStore } from './store'
import type { FigureModule, MiniatureHandle, MiniatureMeta, MiniatureProgressHandle, MiniatureProgressProps } from './types'

/* useMiniature, and the shell every miniature renders with it: a host <div>
 * sized by the drawing's aspect ratio (so the server's empty stage already
 * takes its final space), which the figure draws into, inside the host's
 * shadow root, once mounted. The props a figure reads while running (mode,
 * keys, sound, motion) are read through a ref, so changing one never redraws
 * it; only `interactive` remounts the figure (it changes what can take
 * focus). */

const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export interface MiniatureShellProps<H extends MiniatureHandle> extends MiniatureProgressProps {
  meta: MiniatureMeta
  figure: FigureModule
  ref?: Ref<H>
}

/** The description assistive tech reads after the name: what it is and does, then its keys. */
export function describe(meta: MiniatureMeta) {
  const keys = meta.keys.map((k) => `${k.caps.join(' ')} ${k.label}`).join('; ')
  return keys ? `${meta.description} Keys: ${keys}.` : meta.description
}

/**
 * The controller every miniature runs on: mounts its figure into the host
 * element (in the host's shadow root, on the client), keeps the props the
 * figure reads live without redrawing it, publishes its snapshot, routes its
 * keys (see env.ts) and exposes its handle on `ref`. Returns the props for the
 * host element and the id of its description.
 */
export function useMiniature<H extends MiniatureHandle>({
  meta,
  figure,
  ref,
  mode = 'system',
  size,
  stage = false,
  interactive = true,
  keyboard = 'scoped',
  sound = false,
  autoPlay = true,
  reducedMotion = 'user',
  progress,
  done,
  onStateChange,
  className,
  style,
  'aria-label': ariaLabel,
  ...rest
}: MiniatureShellProps<H>) {
  const about = `yjm${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const host = useRef<HTMLDivElement>(null)
  const mounted = useRef<MountedFigure | null>(null)
  const store = useMemo(() => createStore(meta.initial), [meta])
  const settings = useRef<Settings>({ mode, keyboard, sound, reducedMotion, interactive })
  const report = useRef(onStateChange)
  const autoPlayAtMount = useRef(autoPlay)
  useClientLayoutEffect(() => {
    settings.current = { mode, keyboard, sound, reducedMotion, interactive }
    report.current = onStateChange
  })

  useEffect(() => {
    const m = mountFigure({
      host: host.current!,
      id: meta.id,
      figure,
      viewBox: meta.viewBox,
      store,
      settings: () => settings.current,
      autoPlay: autoPlayAtMount.current,
    })
    mounted.current = m
    return () => {
      m.destroy()
      mounted.current = null
    }
  }, [meta, figure, store, interactive])

  useEffect(() => mounted.current?.update(), [mode, keyboard, sound, reducedMotion])
  useEffect(() => store.subscribe(() => report.current?.(store.get())), [store])
  useEffect(() => {
    const m = mounted.current
    if (!m || !meta.progress) return
    if (done) m.done()
    else if (progress !== undefined) m.setProgress(progress)
  }, [meta.progress, progress, done, interactive])

  useImperativeHandle(
    ref,
    () =>
      ({
        press: (key: string) => mounted.current?.press(key),
        getSnapshot: store.get,
        subscribe: store.subscribe,
        pause: () => mounted.current?.pause(),
        play: () => mounted.current?.play(),
        setProgress: (p: number | null) => mounted.current?.setProgress(p),
        done: () => mounted.current?.done(),
        get element() {
          return host.current
        },
      }) satisfies MiniatureProgressHandle as unknown as H,
    [store],
  )

  const [, , w, h] = meta.viewBox.split(/[\s,]+/).map(Number)
  const shortcuts = interactive && keyboard !== 'off' ? [...new Set(meta.keys.flatMap((k) => k.keys))].map(shortcutName).join(' ') : undefined
  const side = typeof size === 'number' ? `${size}px` : size
  const hostProps = {
    ...rest,
    ref: host,
    className: className ? `yjm yjm-${meta.id} ${className}` : `yjm yjm-${meta.id}`,
    'data-mode': mode,
    'data-interactive': interactive ? undefined : 'false',
    'data-stage': stage ? '' : undefined,
    role: interactive ? 'group' : 'img',
    'aria-label': ariaLabel ?? meta.label,
    'aria-describedby': interactive ? about : undefined,
    'aria-keyshortcuts': shortcuts || undefined,
    tabIndex: interactive ? 0 : undefined,
    style: { aspectRatio: `${w} / ${h}`, width: side, height: side, ...style } satisfies CSSProperties,
  } satisfies HTMLAttributes<HTMLDivElement> & { ref: RefObject<HTMLDivElement | null> } & Record<`data-${string}`, string | undefined>
  return { hostProps, about: interactive ? about : undefined }
}

/** The shell every miniature renders: its host, with the description assistive tech reads after its name. */
export function Miniature<H extends MiniatureHandle>(props: MiniatureShellProps<H>) {
  const { hostProps, about } = useMiniature(props)
  return (
    <div {...hostProps}>
      {about && (
        <span id={about} hidden>
          {describe(props.meta)}
        </span>
      )}
    </div>
  )
}
