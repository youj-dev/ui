'use client'

import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type MouseEvent, type Ref, type RefObject } from 'react'
import type { AnyMiniatureHandle, MiniatureKeyHint, MiniatureSnapshot } from '@youj/miniatures'
import { KeyboardIcon } from '@youj/icons/components/youj/icons/keyboard'
import { VolumeIcon } from '@youj/icons/components/youj/icons/volume'
import { useYouj } from '@youj/core'
import { IslandButton, returnFocus } from '@/components/explorer/island'
import { Popover, PopoverContent, PopoverTrigger } from '@youj/react'
import { PanelActions, PanelLink, ShowroomHero, StageReadout, type ShowroomHeroProps } from '@/components/showroom/hero'
import { useStageScheme } from '@/components/showroom/hooks'
import { cn } from '@/lib/cn'
import type { ComponentDoc } from '@/lib/props'
import { capLabel, capsOf, copySnippet, load, type Cap, type ShowroomMiniature, type StageMiniature } from './catalog'

/* The miniatures page's hero, on the showroom's (components/showroom/hero): the miniature on show, the real component
 * from @youj/miniatures, live and large on the paper stage, its readout printed on the paper (its `onStateChange`),
 * with the panel beside it: its name, model, description and spec, then its keys (each key hint as keycaps that press
 * the key through its handle) and the actions: Use it (the large code modal: the usage, the install, the props) and
 * Copy code. Each miniature is its own chunk (./catalog's `load`): the one on show stays until the next has arrived,
 * which then fades in over it (at once under reduced motion), so the stage never flashes empty. Light or dark follows
 * the site's theme unless the stage's switch overrides it (useStageScheme), passed as `scheme`; the stage's reduced
 * motion is its `reducedMotion`; sound is off until the stage's sound switch turns it on. */

/** The code modal comes with its first opening. */
const MiniatureCodeDialog = lazy(() => import('./code-dialog').then((m) => ({ default: m.MiniatureCodeDialog })))

interface Layer {
  id: string
  Component: StageMiniature
}

/** The miniatures on the stage: the one on show, and the last until the new one has faded in over it. */
function useStageLayers(id: string, instant: boolean, active: boolean) {
  const [layers, setLayers] = useState<Layer[]>([])
  const [failed, setFailed] = useState<string | null>(null)
  useEffect(() => {
    if (!active) return
    let live = true
    setFailed(null)
    load(id).then(
      ({ Component }) => {
        if (!live) return
        setLayers((all) => {
          if (all.at(-1)?.id === id) return all
          const next = { id, Component }
          return instant || !all.length ? [next] : [all.at(-1)!, next]
        })
      },
      () => live && setFailed(id),
    )
    return () => {
      live = false
    }
  }, [id, instant, active])
  const settle = (shown: string) => setLayers((all) => (all.length > 1 && all.at(-1)?.id === shown ? all.slice(-1) : all))
  return { layers, settle, failed: failed === id }
}

export interface MiniatureViewerProps {
  meta: ShowroomMiniature
  /** Its place in the explorer's order, from 1, and how many that order holds: announced as it changes. */
  index: number
  total: number
  /** False until the page knows which miniature to show: the stage loads nothing before. */
  active: boolean
  /** The props every miniature takes, for the code modal. */
  props?: ComponentDoc
  /** The explorer's viewfinder, beside the stage (a row under it on narrow screens). */
  viewfinder?: ShowroomHeroProps['viewfinder']
  /** Where it stands from lg: an island on the stage, a column beside it, or none here (a bar in the explorer). */
  presentation?: ShowroomHeroProps['presentation']
  /** The search beside the viewfinder. */
  search?: ShowroomHeroProps['search']
  ref?: Ref<HTMLElement>
}

export function MiniatureViewer({ meta, index, total, active, props, viewfinder, presentation, search, ref }: MiniatureViewerProps) {
  const k = useYouj()
  const { scheme, setScheme, mounted } = useStageScheme(meta.id)
  const [reduced, setReduced] = useState(false)
  const [sound, setSound] = useState(false)
  const handle = useRef<AnyMiniatureHandle>(null)
  const { layers, settle, failed } = useStageLayers(meta.id, k.reduced || reduced, active)
  const ready = layers.at(-1)?.id === meta.id
  // The code modal, mounted with its first opening; focus goes back to the control that opened it.
  const [code, setCode] = useState<{ open: boolean } | null>(null)
  const opener = useRef<HTMLElement | null>(null)

  // What the miniature reports (a running one, several times a second), kept out of this component's state: only the
  // readout and the keys read it, so a report re-renders them and not the hero, its strip and its search.
  const [reports] = useState(createReports)

  return (
    <>
      <ShowroomHero
        ref={ref}
        eyebrow="Miniatures"
        ground="paper"
        links={<PanelLink href="/docs/miniatures">Docs</PanelLink>}
        itemKey={meta.id}
        name={meta.name}
        nameId="miniature-name"
        announce={`${meta.name}, ${index} of ${total}`}
        byline={[meta.model, meta.progress ? 'Progress indicator' : `Study ${meta.study}`]}
        description={meta.description}
        meta={<p className="font-mono text-[11px] leading-[1.6] tracking-[0.06em] text-pretty text-fg-subtle uppercase">{meta.spec}</p>}
        stage={
          <div className="absolute inset-0 grid place-items-center p-[clamp(1.5rem,6%,4rem)] pt-14 sm:pt-16">
            {mounted &&
              layers.map(({ id, Component }) => {
                const top = id === meta.id
                return (
                  <div
                    key={id}
                    inert={!top}
                    aria-hidden={!top || undefined}
                    onAnimationEnd={top ? (e) => e.target === e.currentTarget && settle(id) : undefined}
                    className={cn('col-start-1 row-start-1 size-full min-h-0 min-w-0', top && layers.length > 1 && 'swap-in')}
                  >
                    <Component
                      ref={top ? handle : undefined}
                      size="100%"
                      mode={scheme}
                      reducedMotion={reduced ? 'always' : 'user'}
                      sound={top && sound}
                      onStateChange={top ? (s) => reports.set({ id, snapshot: s }) : undefined}
                    />
                  </div>
                )
              })}
            {failed && <p className="col-start-1 row-start-1 type-small text-fg-muted">This miniature didn’t load. Check your connection and pick it again.</p>}
          </div>
        }
        readout={<Readout reports={reports} meta={meta} loading={!ready} />}
        keys={meta.keys.length > 0 ? <KeysButton key={meta.id} reports={reports} meta={meta} disabled={!ready} handle={handle} /> : undefined}
        scheme={scheme}
        onSchemeChange={setScheme}
        reduced={reduced}
        onReducedChange={setReduced}
        tool={
          <IslandButton label={sound ? 'Turn sound off' : 'Turn sound on'} aria-pressed={sound} onClick={() => setSound(!sound)}>
            <VolumeIcon size={15} strokeWidth={1.75} active={!sound} />
          </IslandButton>
        }
        toolbarLabel={`${meta.name}: view`}
        viewfinder={viewfinder}
        presentation={presentation}
        search={search}
        copy={copySnippet(meta.id)}
        actions={
          <PanelActions
            onUse={(from) => {
              opener.current = from
              setCode({ open: true })
            }}
          />
        }
      />
      {code && (
        <Suspense fallback={null}>
          <MiniatureCodeDialog meta={meta} props={props} scheme={scheme} open={code.open} onOpenChange={(open) => setCode({ open })} finalFocus={returnFocus(opener)} />
        </Suspense>
      )}
    </>
  )
}

type Report = { id: string; snapshot: MiniatureSnapshot } | null

/** The last report, and who's listening. */
function createReports() {
  let last: Report = null
  const listeners = new Set<() => void>()
  return {
    get: () => last,
    set(next: Report) {
      last = next
      for (const listen of listeners) listen()
    },
    subscribe(listen: () => void) {
      listeners.add(listen)
      return () => listeners.delete(listen)
    },
  }
}
type Reports = ReturnType<typeof createReports>

/** The miniature's snapshot: its first one in the catalogue until it reports its own. */
function useSnapshot(reports: Reports, meta: ShowroomMiniature) {
  const reported = useSyncExternalStore(reports.subscribe, reports.get, () => null)
  return reported?.id === meta.id ? reported.snapshot : meta.initial
}

/** The readout on the stage's paper: a leaf of its own, so a report re-renders it alone. */
function Readout({ reports, meta, loading }: { reports: Reports; meta: ShowroomMiniature; loading: boolean }) {
  const snapshot = useSnapshot(reports, meta)
  return <StageReadout label="Readout" value={snapshot.readout} state={snapshot.state} live={!loading && Boolean(snapshot.state)} loading={loading} />
}

/**
 * Its keys, a press away on the stage's toolbar: the keyboard icon opens every key hint as a two-column legend (the
 * keycaps, each pressing its key in the miniature, then what it does), a popover (a sheet on touch) that scrolls past
 * a dozen. The keys work on the miniature itself without it; a switch's caps are lit while it's on.
 */
function KeysButton({ reports, meta, disabled, handle }: { reports: Reports; meta: ShowroomMiniature; disabled: boolean; handle: RefObject<AnyMiniatureHandle | null> }) {
  const snapshot = useSnapshot(reports, meta)
  return (
    <Popover>
      <IslandButton label="Keys" render={<PopoverTrigger />}>
        <KeyboardIcon size={15} strokeWidth={1.75} />
      </IslandButton>
      <PopoverContent align="end" aria-label={`${meta.name}: keys`} className="w-[min(25rem,calc(100vw-1rem))] gap-0 overflow-hidden p-0">
        <div className="flex h-11 shrink-0 items-center justify-between gap-4 border-b border-line px-4">
          <p className="type-label">Keys</p>
          <p className="truncate text-[11.5px] text-fg-subtle">Press them here, or on the miniature</p>
        </div>
        <ul className="grid max-h-[min(30rem,60dvh)] grid-cols-[auto_minmax(0,1fr)] content-start gap-x-5 gap-y-1 overflow-y-auto overscroll-contain px-4 py-3">
          {meta.keys.map((hint) => (
            <KeyRow key={hint.label} hint={hint} on={hint.toggle ? Boolean(snapshot.pressed[hint.keys[0]!]) : undefined} disabled={disabled} handle={handle} />
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

/** A key hint in the list of every key: its caps, then what it does. */
function KeyRow({ hint, on, disabled, handle }: { hint: MiniatureKeyHint; on: boolean | undefined; disabled: boolean; handle: RefObject<AnyMiniatureHandle | null> }) {
  return (
    <li className="col-span-2 grid min-h-9 grid-cols-subgrid items-center">
      <span className="flex flex-wrap items-center justify-end gap-1">
        <Caps hint={hint} on={on} disabled={disabled} handle={handle} />
      </span>
      <span className="min-w-0 text-[13px] leading-5 text-pretty text-fg-muted">{hint.label}</span>
    </li>
  )
}

/** A hint's caps as buttons, a range by its two ends with its joiner between. */
function Caps({ hint, on, disabled, handle }: { hint: MiniatureKeyHint; on: boolean | undefined; disabled: boolean; handle: RefObject<AnyMiniatureHandle | null> }) {
  const groups = capsOf(hint)
  const single = groups.length === 1 && groups[0]!.caps.length === 1
  const joiner = 'text-[12px] text-fg-subtle'
  return (
    <span className="flex items-center gap-1">
      {groups.map((group, g) => (
        <span key={g} className="contents">
          {group.caps.map((cap, i) => (
            <span key={`${cap.label}-${i}`} className="contents">
              {i > 0 && group.joiner && <span className={joiner}>{group.joiner}</span>}
              <KeyCap cap={cap} hint={hint} on={on} pressed={single ? on : undefined} disabled={disabled} handle={handle} />
            </span>
          ))}
          {group.caps.length === 1 && group.joiner && <span className={joiner}>{group.joiner}</span>}
        </span>
      ))}
    </span>
  )
}

const capClass = cn(
  'inline-flex h-7 min-w-7 items-center justify-center rounded-md border border-line bg-key px-1.5 font-mono text-[12px] leading-none font-medium text-fg select-none touch:h-10 touch:min-w-10',
  'shadow-[inset_0_-1.5px_0_var(--color-line)]',
)

/** A keycap that presses its key in the miniature; a pointer's press also hands the miniature focus, so the keyboard carries on there. */
function KeyCap({
  cap,
  hint,
  on,
  pressed,
  disabled,
  handle,
}: {
  cap: Cap
  hint: MiniatureKeyHint
  on: boolean | undefined
  pressed: boolean | undefined
  disabled: boolean
  handle: RefObject<AnyMiniatureHandle | null>
}) {
  if (cap.key === null)
    return (
      <kbd title={`Hold ${cap.label} with the keys beside it`} className={capClass}>
        {cap.label}
      </kbd>
    )
  const key = cap.key
  const press = (e: MouseEvent<HTMLButtonElement>) => {
    handle.current?.press(key)
    if (e.detail > 0) handle.current?.element?.focus({ preventScroll: true })
  }
  return (
    <button
      type="button"
      aria-label={capLabel(cap, hint)}
      aria-pressed={pressed}
      aria-disabled={disabled || undefined}
      data-on={on || undefined}
      onClick={disabled ? undefined : press}
      className={cn(
        capClass,
        'transition-[translate,box-shadow,background-color,border-color,color] duration-(--yj-duration-instant) ease-standard',
        'hover:border-line-strong focus-ring active:translate-y-px active:border-accent active:bg-accent-subtle active:shadow-none motion-reduce:active:translate-y-0',
        'data-on:border-accent-line data-on:text-accent',
        'aria-disabled:opacity-60',
      )}
    >
      {cap.label}
    </button>
  )
}
