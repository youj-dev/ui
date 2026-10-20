'use client'

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties } from 'react'
import { useInView } from 'motion/react'
import { useYouj } from '@youj/core'
import { BellOffIcon, LockIcon, MenuIcon, ThemeIcon, type YoujIconComponent } from '@youj/icons'
import { ToggleGroup, ToggleGroupItem } from '@youj/react'
import { cn } from '@/lib/cn'
import { PauseButton, StackToggle } from '../stack/controls'
import { LayerStack, type StackLayer } from '../stack/layer-stack'
import { useStackProgress } from '../stack/use-stack-progress'
import { useTransitionRecording, type RecordedFrame } from './use-transition-recording'

/* One state icon, pulled apart: the grid it's drawn on, its rest state, the
 * path between (onion skins recorded from the icon's own transition, frame
 * by frame), and its active state. Assembled, it's the icon in a key you can
 * press. Apart, a copy in the accent replays the transition over its path.
 * The picker swaps the icon; each kind of state icon shows its own craft: a
 * path morph with staggered rays, a masked slash, a spring that settles, a
 * sequence of transforms. */

const ICONS: { id: string; Icon: YoujIconComponent; label: string; craft: string }[] = [
  { id: 'theme', Icon: ThemeIcon, label: 'Light and dark', craft: 'path morph · staggered rays' },
  { id: 'bell', Icon: BellOffIcon, label: 'Notifications', craft: 'masked slash · swing' },
  { id: 'lock', Icon: LockIcon, label: 'Lock', craft: 'rise · settle spring' },
  { id: 'menu', Icon: MenuIcon, label: 'Menu', craft: 'transform sequence' },
]

/** The plane and the icon drawn on it, px. */
const PLANE = 240
const ICON = 168

/** Parts that aren't on the assembled icon fade in as it comes apart. */
const apart = { opacity: 'clamp(0, calc((var(--e, 1) - 0.06) * 3), 1)' } as CSSProperties

function Grid({ Icon }: { Icon: YoujIconComponent }) {
  const unit = ICON / 24
  const lines = Array.from({ length: 25 }, (_, i) => i)
  return (
    <div className="absolute inset-0 rounded-[28px] border border-line bg-surface shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_4%,transparent),0_16px_40px_-18px_color-mix(in_oklab,var(--color-shadow)_25%,transparent)]">
      <div className="absolute inset-0 grid place-items-center" style={apart}>
        <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" className="overflow-visible text-fg-subtle" aria-hidden>
          {lines.map((i) => (
            <g key={i} stroke="currentColor" strokeWidth={1 / unit} opacity={i % 4 === 0 ? 0.35 : 0.14}>
              <path d={`M${i} 0V24`} />
              <path d={`M0 ${i}H24`} />
            </g>
          ))}
          <g stroke="currentColor" strokeWidth={1 / unit} opacity={0.7}>
            <rect x={2} y={2} width={20} height={20} strokeDasharray={`${3 / unit} ${3 / unit}`} />
            <circle cx={12} cy={12} r={10} />
            <rect x={3} y={3} width={18} height={18} rx={2} />
          </g>
        </svg>
        <span className="absolute text-fg-muted">
          <Icon size={ICON} strokeWidth={0.3} trigger="none" />
        </span>
      </div>
    </div>
  )
}

function Frames({ frames }: { frames: RecordedFrame[] }) {
  return (
    <div className="absolute inset-0 grid place-items-center text-accent" style={apart}>
      <svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={0.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        {frames.map((f, i) => (
          // biome-ignore lint/security/noDangerouslySetInnerHtml: markup is SVG recorded from our own icon render
          <g key={f.t} opacity={0.22 + 0.5 * (i / Math.max(1, frames.length - 1))} dangerouslySetInnerHTML={{ __html: f.markup }} />
        ))}
      </svg>
    </div>
  )
}

/** Steps of the deliberate token while `playing`: the replay's clock. */
function useToggle(playing: boolean, every = 3) {
  const k = useYouj()
  const [on, setOn] = useState(false)
  const step = k.ms('deliberate') * every
  useEffect(() => {
    if (!playing) {
      setOn(false)
      return
    }
    const id = setInterval(() => setOn((v) => !v), step)
    return () => clearInterval(id)
  }, [playing, step])
  return on
}

function Timeline({ frames, duration }: { frames: RecordedFrame[]; duration: number }) {
  const w = 170
  const at = (t: number) => 4 + (t / Math.max(1, duration)) * (w - 8)
  return (
    <div className="text-accent">
      <svg width={w} height={14} className="overflow-visible" aria-hidden>
        <path d={`M4 7H${w - 4}`} className="stroke-line-strong" strokeWidth={1} />
        <circle cx={at(0)} cy={7} r={3} className="fill-canvas stroke-fg" strokeWidth={1.25} />
        {frames.map((f) => (
          <circle key={f.t} cx={at(f.t)} cy={7} r={2} fill="currentColor" />
        ))}
        <circle cx={at(duration)} cy={7} r={3} className="fill-fg" />
      </svg>
      <p className="mt-1 font-sans text-[9.5px] leading-4 text-fg-muted">
        {duration ? `${duration} ms` : 'recording'} · hover, loop or active
      </p>
    </div>
  )
}

export function IconLayers({ className }: { className?: string }) {
  const k = useYouj()
  const captionId = useId()
  const figure = useRef<HTMLElement>(null)
  const [choice, setChoice] = useState(ICONS[0]!.id)
  const spec = ICONS.find((i) => i.id === choice) ?? ICONS[0]!
  const { Icon } = spec
  const [rest, active] = Icon.meta.states ?? ['rest', 'active']
  const { frames, duration, recorder } = useTransitionRecording(Icon)

  const { explode, mode, choose } = useStackProgress({ target: figure, offset: ['start 0.85', 'start 0.3'] })
  const [paused, setPaused] = useState(false)
  const [flat, setFlat] = useState(true)
  const inView = useInView(figure, { amount: 0.25 })
  const ambient = !paused && !k.reduced
  const replaying = useToggle(ambient && !flat && inView)
  const [pressed, setPressed] = useState(false)

  const layers = useMemo<StackLayer[]>(
    () => [
      { id: 'grid', name: 'Grid', detail: '24 units · 2 px safe area', content: <Grid Icon={Icon} />, anchor: [PLANE, PLANE * 0.72] },
      {
        id: 'rest',
        name: 'Rest',
        detail: `state · ${rest}`,
        content: (
          <div className="absolute inset-0 grid place-items-center text-fg">
            <Icon size={ICON} active={false} trigger="none" />
          </div>
        ),
      },
      {
        id: 'path',
        name: 'Path',
        detail: spec.craft,
        content: (
          <>
            <Frames frames={frames} />
            {ambient && (
              <div className="absolute inset-0 grid place-items-center text-accent" style={apart}>
                <Icon size={ICON} strokeWidth={1.25} active={replaying} />
              </div>
            )}
          </>
        ),
        legend: <Timeline frames={frames} duration={duration} />,
      },
      {
        id: 'active',
        name: 'Active',
        detail: `state · ${active}`,
        content: (
          <div className="absolute inset-0 grid place-items-center text-fg" style={apart}>
            <Icon size={ICON} active trigger="none" />
          </div>
        ),
      },
    ],
    [Icon, rest, active, spec.craft, frames, duration, ambient, replaying],
  )

  return (
    <figure ref={figure} aria-labelledby={captionId} className={cn('not-prose relative m-0', className)}>
      {recorder}
      <LayerStack
        layers={layers}
        explode={explode}
        width={PLANE}
        height={PLANE}
        live={ambient}
        onFlatChange={setFlat}
        assembled={
          <button
            type="button"
            aria-label={`${rest} or ${active}`}
            aria-pressed={pressed}
            onClick={() => setPressed((p) => !p)}
            className="grid size-60 place-items-center rounded-[28px] border border-line bg-surface text-fg shadow-[0_1px_2px_color-mix(in_oklab,var(--color-shadow)_4%,transparent),0_16px_40px_-18px_color-mix(in_oklab,var(--color-shadow)_25%,transparent)] transition-[scale] yj-duration-fast ease-standard focus-ring active:scale-[0.98]"
          >
            <Icon size={ICON} active={pressed} />
          </button>
        }
      />
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2 px-4 pt-2 pb-4">
        <StackToggle mode={mode} onChange={choose} labels={['Assembled', 'Layers']} />
        <span aria-hidden className="h-4 w-px bg-line max-sm:hidden" />
        <ToggleGroup
          size="sm"
          spacing={0}
          aria-label="Icon"
          value={[choice]}
          onValueChange={(value) => {
            if (!value[0]) return
            setChoice(value[0])
            setPressed(false)
          }}
          className="gap-0.5"
        >
          {ICONS.map(({ id, Icon: Option, label }) => (
            // shape: a stage toolbar key, the docs stage's 32px (40px on touch)
            <ToggleGroupItem key={id} value={id} aria-label={label} title={label} className="size-8 min-w-0 p-0 pointer-coarse:size-10">
              <Option size={16} strokeWidth={1.75} trigger="none" />
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <PauseButton paused={paused} onChange={setPaused} disabled={k.reduced} />
      </div>
      <figcaption id={captionId} className="sr-only">
        The {spec.label.toLowerCase()} icon pulled apart into four layers: the 24-unit grid it is drawn on, its {rest} state, the path
        between its states drawn as frames of its own transition ({spec.craft}, {duration} milliseconds), and its {active} state.
        Assembled, it is a key that switches between the two states.
      </figcaption>
    </figure>
  )
}
