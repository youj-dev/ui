'use client'

import { useId, useLayoutEffect, useRef } from 'react'
import { useYouj } from '@youj/core'
import { CheckIcon, RotateCcwIcon, TrendingUpIcon } from '@youj/icons'
import { Avatar, AvatarFallback } from '../../../components/ui/avatar'
import { Badge, BadgeDot } from '../../../components/ui/badge'
import { buttonVariants } from '../../../components/ui/button'
import { cn } from '../../../lib/utils'
import { card, label, Swap, useMoment } from './moment'

/* The demo's window: a small deploy dashboard whose three parts are what the
 * three points are about. The part the camera is on plays its moment (a
 * preview goes from Building to Ready, a rollback lands, the traffic line
 * draws and the deploy that moved it drops onto it), and the rest dims a
 * little. A picture: the block renders it inert and hidden from assistive
 * tech. Demo content — edit after adding. */

/** The window's width the screen is laid out at (`w-140`); it's zoomed to the window it's in. */
const DESIGN_WIDTH = 560

function Production({ on, visit }: { on: boolean; visit: number }) {
  const beat = useMoment(on, visit, 2, 0)
  const back = beat >= 2
  return (
    <div className={card}>
      <span className="flex items-center justify-between gap-2">
        <span className={label}>Production</span>
        <span className="inline-flex items-center gap-1.5 text-ui-xs text-success-text">
          <span className="size-1.5 rounded-full bg-success" /> Live
        </span>
      </span>
      <Swap
        on={back}
        off={
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="font-mono text-ui-xs text-fg">dpl_8f2c</span>
            <span className="truncate text-ui-sm text-fg-muted">Klarna checkout</span>
          </span>
        }
        onNode={
          <span className="flex min-w-0 items-baseline gap-2">
            <span className="font-mono text-ui-xs text-fg">dpl_77c1</span>
            <span className="truncate text-ui-sm text-fg-muted">Checkout copy</span>
          </span>
        }
      />
      <Swap
        on={back}
        off={
          <span
            className={cn(
              buttonVariants({ size: 'xs', variant: 'outline' }),
              'w-full transition-[scale,background-color] yj-duration-fast ease-standard',
              beat === 1 && 'scale-95 bg-hover',
            )}
          >
            <RotateCcwIcon size={12} /> Roll back to dpl_77c1
          </span>
        }
        onNode={
          <span className="inline-flex h-control-xs w-full items-center justify-center gap-1.5 rounded-sm bg-success-subtle text-ui-sm font-medium text-success-text">
            <CheckIcon size={12} strokeWidth={2.5} /> Rolled back in 0.8&nbsp;s
          </span>
        }
      />
    </div>
  )
}

const BARS = [31, 33, 32, 36, 38, 37, 41, 44, 48]

function Visitors() {
  return (
    <div className={card}>
      <span className="flex items-center justify-between gap-2">
        <span className={label}>Visitors</span>
        <span className="inline-flex items-center gap-1 text-ui-xs text-success-text tabular-nums">
          <TrendingUpIcon size={12} /> 12.4%
        </span>
      </span>
      <span className="text-xl font-semibold tracking-tight text-fg tabular-nums">48,210</span>
      <span className="flex h-7 items-end gap-1">
        {BARS.map((v, i) => (
          <span key={i} className={cn('flex-1 rounded-xs', i === BARS.length - 1 ? 'bg-accent' : 'bg-well')} style={{ height: `${(v / 48) * 100}%` }} />
        ))}
      </span>
    </div>
  )
}

const TRAFFIC = [32, 41, 38, 52, 61, 57, 73]
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const W = 320
const H = 84
/** The day the deploy went out, where the line turns up. */
const DEPLOY_DAY = 3

const at = (i: number) => [(i / (TRAFFIC.length - 1)) * W, H - 6 - ((TRAFFIC[i]! - 24) / 52) * (H - 12)] as const
/** A smooth line through the days: each segment leaves and lands level. */
function linePath() {
  let d = `M${at(0).join(' ')}`
  for (let i = 1; i < TRAFFIC.length; i++) {
    const [x0, y0] = at(i - 1)
    const [x1, y1] = at(i)
    const dx = (x1 - x0) / 2.4
    d += ` C${x0 + dx} ${y0} ${x1 - dx} ${y1} ${x1} ${y1}`
  }
  return d
}
const LINE = linePath()

function Traffic({ on, visit }: { on: boolean; visit: number }) {
  const k = useYouj()
  const fill = useId().replace(/[^\w-]/g, '')
  const beat = useMoment(on, visit, 2, 2)
  // It draws only on the way in; going back to the start of a replay is instant.
  const drawing = on && !k.reduced && beat >= 1
  const [mx, my] = at(DEPLOY_DAY)
  return (
    <div className={card}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-ui-sm font-medium text-fg">
          Traffic <span className="font-normal text-fg-muted">· Last 7 days</span>
        </span>
        <span className={cn('inline-flex items-center gap-1.5 text-ui-xs transition-opacity yj-duration-base ease-standard', beat >= 2 ? 'opacity-100' : 'opacity-0')}>
          <span className="font-mono text-fg">dpl_8f2c</span>
          <span className="text-success-text tabular-nums">+18%</span>
        </span>
      </span>
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-24 w-full overflow-visible text-accent">
        <defs>
          <linearGradient id={fill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="currentColor" stopOpacity="0.16" />
            <stop offset="1" stopColor="currentColor" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.33, 0.66].map((f) => (
          <line key={f} x1="0" x2={W} y1={H * f} y2={H * f} className="stroke-line" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
        ))}
        {/* The line draws in as a wipe from the start of the week: a clip, so the stroke keeps its width at any size. */}
        <g
          className={drawing ? 'transition-[clip-path] ease-emphasized' : 'transition-none'}
          style={{ clipPath: beat >= 1 ? 'inset(0 0 0 0)' : 'inset(0 100% 0 0)', transitionDuration: drawing ? `${Math.round(k.ms('deliberate') * 1.6)}ms` : undefined }}
        >
          <path d={`${LINE} L${W} ${H} L0 ${H}Z`} fill={`url(#${fill})`} />
          <path d={LINE} fill="none" stroke="currentColor" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </g>
        <g className={cn('transition-opacity yj-duration-base ease-standard', beat >= 2 ? 'opacity-100' : 'opacity-0')}>
          <line x1={mx} x2={mx} y1="0" y2={H} className="stroke-fg-subtle" strokeDasharray="2 3" vectorEffect="non-scaling-stroke" />
        </g>
      </svg>
      {/* The deploy's dot sits outside the stretched drawing, so it stays round. */}
      <span className="relative -mt-24 h-24" aria-hidden>
        <span
          className={cn(
            'absolute size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent transition-[opacity,scale] yj-duration-base ease-enter rtl:translate-x-1/2',
            beat >= 2 ? 'scale-100 opacity-100' : 'scale-50 opacity-0',
          )}
          style={{ insetInlineStart: `${(mx / W) * 100}%`, top: `${(my / H) * 100}%` }}
        />
      </span>
      <span className="flex justify-between text-ui-xs text-fg-subtle">
        {DAYS.map((d) => (
          <span key={d}>{d}</span>
        ))}
      </span>
    </div>
  )
}

const DEPLOYS = [
  { who: 'MO', branch: 'feat/klarna', when: 'just now' },
  { who: 'TB', branch: 'main', when: '12m' },
  { who: 'PR', branch: 'fix/timeouts', when: '1h' },
]

function Deployments({ on, visit }: { on: boolean; visit: number }) {
  const beat = useMoment(on, visit, 2, 2)
  return (
    <div className={cn(card, 'gap-1.5')}>
      <span className={label}>Deployments</span>
      <ul className="flex flex-col divide-y divide-line">
        {DEPLOYS.map((d, i) => {
          const fresh = i === 0
          return (
            <li key={d.branch} className="flex items-center gap-2.5 py-1.5">
              <Avatar size="sm">
                <AvatarFallback>{d.who}</AvatarFallback>
              </Avatar>
              <span className="w-24 truncate font-mono text-ui-xs text-fg">{d.branch}</span>
              {fresh ? (
                <Swap
                  on={beat >= 1}
                  off={
                    <Badge variant="warning">
                      <BadgeDot />
                      Building
                    </Badge>
                  }
                  onNode={
                    <Badge variant="success">
                      <BadgeDot />
                      Ready
                    </Badge>
                  }
                />
              ) : (
                <Badge variant="success">
                  <BadgeDot />
                  Ready
                </Badge>
              )}
              {fresh && (
                <span
                  className={cn(
                    'min-w-0 truncate rounded-md bg-band px-2 py-0.5 text-ui-xs text-fg transition-[opacity,translate] yj-duration-slow ease-enter',
                    beat >= 2 ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 rtl:translate-x-1',
                  )}
                >
                  klarna.acme.app
                </span>
              )}
              <span className="ms-auto shrink-0 text-ui-xs text-fg-subtle tabular-nums">{d.when}</span>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** The demo's window. `focus` is the point the camera is on (none at rest), `visit` counts its arrivals so a moment replays. */
export function DemoProduct({ focus, visit }: { focus: string | null; visit: number }) {
  const part = (id: string | null) => cn('transition-opacity yj-duration-slow ease-standard', focus && focus !== id && 'opacity-45')
  const ref = useRef<HTMLDivElement>(null)
  // Laid out at the width it was drawn for, and zoomed to the window's: the same screen on a phone as on a desktop.
  useLayoutEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host) return
    const fit = () => {
      if (host.clientWidth) el.style.zoom = String(host.clientWidth / DESIGN_WIDTH)
    }
    fit()
    if (typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(fit)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="flex w-140 flex-col gap-3 bg-canvas p-4 text-ui-sm">
      <div className={cn('flex items-center gap-2', part(null))}>
        <span className="grid size-6 place-items-center rounded-md bg-accent text-ui-xs font-semibold text-on-accent">N</span>
        <span className="font-medium text-fg">acme</span>
        <span className="text-fg-subtle">/</span>
        <span className="text-fg-muted">storefront</span>
        <Avatar size="sm" className="ms-auto">
          <AvatarFallback>MO</AvatarFallback>
        </Avatar>
        <span className={buttonVariants({ size: 'xs' })}>Deploy</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className={part('rollbacks')}>
          <Production on={focus === 'rollbacks'} visit={visit} />
        </div>
        <div className={part(null)}>
          <Visitors />
        </div>
      </div>
      <div className={part('analytics')}>
        <Traffic on={focus === 'analytics'} visit={visit} />
      </div>
      <div className={part('previews')}>
        <Deployments on={focus === 'previews'} visit={visit} />
      </div>
    </div>
  )
}
