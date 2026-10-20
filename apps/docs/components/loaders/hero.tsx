'use client'

import { lazy, Suspense, useRef, useState, type Ref } from 'react'
import { useYouj } from '@youj/core'
import { PlayIcon, RefreshIcon } from '@youj/icons'
import { IslandButton, returnFocus } from '@/components/explorer/island'
import type { Ink } from '@/components/icons/settings'
import { PanelActions, PanelLink, ShowroomHero, StageReadout, type ShowroomHeroProps, type StageView } from '@/components/showroom/hero'
import { useStageScheme } from '@/components/showroom/hooks'
import { modePreset } from '@/lib/preview'
import { useSiteTheme } from '@/lib/site-theme'
import type { ComponentDoc } from '@/lib/props'
import { copyCode, labelLines, loopSeconds, type LabelLook, type LoaderEntry, type Look } from './catalog'
import { LoaderStage } from './stage'
import { Tune } from './tune'

/* The loaders page's hero, on the showroom's (components/showroom/hero): the loader on show, live and large on the
 * paper stage (./stage), what it's doing printed on the paper (playing and its loop's length, held or still, and the
 * label it says first). The stage's toolbar has its playback (Replay, Hold, and the stage's speed: 1×, 2×, ½×, round
 * and round, a closer look that's never in the code) ahead of the shell's view (light or dark, reduced motion,
 * fullscreen) and In context, which sets the loader in the app window it would hold still and takes it away. The
 * panel is the loader's name, its category (a search of it) and its export and what it shows (its tags are the
 * search's words, not the panel's); then Tune (./tune: size, loop, the two colors, the label), which the code follows and the stage and the
 * thumbnails wear; and the actions: Use it, the large code modal (the usage with what's set here, the install, the
 * props, the source), and Copy code, the loader as tuned. */

/** The code modal comes with its first opening. */
const LoaderCodeDialog = lazy(() => import('./code-dialog').then((m) => ({ default: m.LoaderCodeDialog })))

/** The stage's playback speeds, in the order its button steps through them. */
const RATES = [1, 2, 0.5] as const
const rateName = (rate: number) => (rate === 0.5 ? '½×' : `${rate}×`)

const icon = { size: 15, strokeWidth: 1.75 } as const

/** The tuning the panel holds: it stays as the loader changes. */
export interface Tuning {
  size: number
  speed: number
  ink: Ink
  accent: Ink
  /** Its colored parts in the theme's colors (each `parts`, in order, Default its theme color), or Mono: its two colors alone. */
  tone: 'theme' | 'mono'
  parts: Ink[]
  label: LabelLook
}

export interface LoaderHeroProps {
  entry: LoaderEntry
  categoryTitle: string
  /** Its place in the gallery's order, from 1, and how many there are: announced as it changes. */
  index: number
  total: number
  tuning: Tuning
  onTuning: (patch: Partial<Tuning>) => void
  /** The look the stage draws and the code is written with (the tuning, with its colors as props). */
  look: Look
  /** The props every loader takes, for the code modal (read on the server). */
  props?: ComponentDoc
  /** Opens the search narrowed to the category. */
  onCategory: (category: string) => void
  viewfinder?: ShowroomHeroProps['viewfinder']
  presentation?: ShowroomHeroProps['presentation']
  search?: ShowroomHeroProps['search']
  ref?: Ref<HTMLElement>
}

export function LoaderHero({ entry, categoryTitle, index, total, tuning, onTuning, look, props, onCategory, viewfinder, presentation, search, ref }: LoaderHeroProps) {
  const site = useYouj()
  const { scheme, setScheme, mounted } = useStageScheme(entry.id)
  // The site's own look (the aurora, like a docs preview) while the stage is in the site's mode.
  const siteLook = modePreset(scheme === 'dark') === modePreset(useSiteTheme().dark)
  // In context by default: the item set in a screen it would live in; Raw is the item alone on the paper.
  const [view, setView] = useState<StageView>('context')
  const context = view === 'context'
  const [reduced, setReduced] = useState(false)
  const [rate, setRate] = useState<number>(1)
  const [held, setHeld] = useState(false)
  const [replay, setReplay] = useState(0)
  const [status, setStatus] = useState({ ready: false, failed: false })
  // Reduced motion, the stage's or the site's: the loader's still frame.
  const resting = reduced || site.reduced
  const base = loopSeconds(entry)
  const nextRate = RATES[(RATES.indexOf(rate as (typeof RATES)[number]) + 1) % RATES.length]!
  const lines = labelLines(tuning.label.text)
  // The code modal, mounted with its first opening; focus goes back to the control that opened it.
  const [code, setCode] = useState<{ open: boolean } | null>(null)
  const opener = useRef<HTMLElement | null>(null)

  return (
    <>
      <ShowroomHero
        ref={ref}
        viewfinder={viewfinder}
        presentation={presentation}
        search={search}
        eyebrow="Loaders"
        links={<PanelLink href="/docs/loaders">Docs</PanelLink>}
        itemKey={entry.id}
        itemClassName="in-data-[loader-link]:invisible"
        name={entry.title}
        nameId="loader-name"
        announce={`${entry.title}, ${index} of ${total}`}
        byline={[
          <button
            key="category"
            type="button"
            onClick={() => onCategory(entry.category)}
            className="rounded-sm underline-offset-4 hover:underline focus-ring"
            aria-label={`${categoryTitle}: search the category`}
          >
            {categoryTitle}
          </button>,
          <code key="component" className="font-mono text-[12.5px]">
            {entry.component}
          </code>,
        ]}
        description={entry.description || undefined}
        siteLook={siteLook}
        stage={
          mounted ? (
            <LoaderStage entry={entry} look={look} context={context} scheme={scheme} reduced={reduced} rate={rate} held={held} replay={replay} onStatus={setStatus} />
          ) : null
        }
        readout={
          <StageReadout
            label="Status"
            value={
              !status.ready
                ? status.failed
                  ? 'Didn’t load'
                  : 'Loading'
                : resting
                  ? 'Still · reduced motion'
                  : held
                    ? 'Held on this frame'
                    : `Playing · ${(base / tuning.speed).toFixed(1)} s a loop${rate !== 1 ? ` · ${rateName(rate)}` : ''}`
            }
            // What it says: its first label, what assistive technology hears first, and how many take turns after it.
            state={`Says “${lines[0] ?? 'Loading'}”${lines.length > 1 ? ` then ${lines.length - 1} more` : ''}`}
            live={status.ready && !resting && !held}
          />
        }
        scheme={scheme}
        onSchemeChange={setScheme}
        reduced={resting}
        onReducedChange={setReduced}
        transport={
          <>
            <IslandButton
              label="Replay from the top"
              disabled={resting}
              onClick={() => {
                setHeld(false)
                setReplay((r) => r + 1)
              }}
            >
              <RefreshIcon {...icon} />
            </IslandButton>
            <IslandButton label="Hold this frame" aria-pressed={held} disabled={resting} onClick={() => setHeld(!held)}>
              <PlayIcon {...icon} active={!held} />
            </IslandButton>
            <IslandButton label={`Playback ${rateName(rate)}: show it at ${rateName(nextRate)}`} onClick={() => setRate(nextRate)} className="h-control-xs w-auto min-w-control-xs px-1.5 touch:h-8 touch:w-auto touch:min-w-8">
              <span className="font-mono text-[11px] leading-none font-medium tabular-nums">{rateName(rate)}</span>
            </IslandButton>
          </>
        }
        view={view}
        onViewChange={setView}
        toolbarLabel={`${entry.title}: view`}
        copy={copyCode(entry, look)}
        actions={
          <PanelActions
            onUse={(from) => {
              opener.current = from
              setCode({ open: true })
            }}
          />
        }
      >
        <Tune
          size={tuning.size}
          onSize={(size) => onTuning({ size })}
          speed={tuning.speed}
          onSpeed={(speed) => onTuning({ speed })}
          base={base}
          ink={tuning.ink}
          accent={tuning.accent}
          onInk={(ink) => onTuning({ ink })}
          onAccent={(accent) => onTuning({ accent })}
          partColors={entry.colors}
          tone={tuning.tone}
          onTone={(tone) => onTuning({ tone })}
          parts={tuning.parts}
          onPart={(i, ink) => onTuning({ parts: tuning.parts.map((part, at) => (at === i ? ink : part)) })}
          label={tuning.label}
          onLabel={(patch) => onTuning({ label: { ...tuning.label, ...patch } })}
        />
      </ShowroomHero>
      {code && (
        <Suspense fallback={null}>
          <LoaderCodeDialog
            entry={entry}
            look={look}
            categoryTitle={categoryTitle}
            props={props}
            scheme={scheme}
            open={code.open}
            onOpenChange={(open) => setCode({ open })}
            finalFocus={returnFocus(opener)}
          />
        </Suspense>
      )}
    </>
  )
}
