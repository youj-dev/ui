import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts'
import { YoujProvider } from '@youj/core'
import { BellIcon, GitBranchIcon, HomeIcon, LineChartIcon, RocketIcon, SearchIcon, SettingsIcon, UsersIcon } from '@youj/icons'
import { blueprint, inspector, layers, prism, renderPasses, trace, type EntranceRun } from '@youj/motion'
import { Avatar, AvatarFallback } from '@youj/react/components/ui/avatar'
import { Badge } from '@youj/react/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@youj/react/components/ui/card'
import { ChartContainer, type ChartConfig } from '@youj/react/components/ui/chart'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@youj/react/components/ui/input-group'
import { StatCard } from '@youj/react/components/ui/stat-card'
import { BRAND } from '../brand'
import { FPS } from '../film/beats'
import { Backdrop } from '../film/backdrop'
import { useFormat, type Format } from '../film/format'
import { tween } from '../lib/timing'
import { useEachFrame, useFrame, useFrameValue } from '../sim/simulation'
import { ENTRANCES_LOOP as E, TOPICS, type EntranceLook, type EntranceRegion } from './beats'

/* Entrances, as a loop (beats.ts has the story): one dashboard, built once,
 * each part by a different entrance look, handing over like a relay. The
 * looks are the motion package's own, run on the dashboard's real DOM: each
 * on its part (a look runs on any node), each held still by the runtime's
 * `paused` and shown at the loop's moment by `seek`, so a render is the same
 * picture for the same frame however it is chunked.
 *
 * A part waits behind a gate (an opacity wrapper the looks never touch)
 * until its look starts, so the looks before it don't read it: Blueprint
 * drafts the frame with its regions still empty. The tilt into Layers is a
 * second, still copy of the finished dashboard leaning back to the stack's
 * own angle, so the flat screen becomes the stack without a jump. */

const P = TOPICS.entrances.preroll
const ms = (frames: number) => (frames * 1000) / FPS

/** The dashboard, in its own px. */
const DASH = { w: 1180, h: 660 }

/* ── The dashboard ─────────────────────────────────────────────────────── */

const NAV = [
  { icon: HomeIcon, label: 'Overview', current: true },
  { icon: RocketIcon, label: 'Deploys' },
  { icon: LineChartIcon, label: 'Analytics' },
  { icon: UsersIcon, label: 'Team' },
  { icon: SettingsIcon, label: 'Settings' },
]

const TRAFFIC = [
  { day: 'Mon', requests: 4.1 },
  { day: 'Tue', requests: 4.6 },
  { day: 'Wed', requests: 4.3 },
  { day: 'Thu', requests: 5.4 },
  { day: 'Fri', requests: 5.1 },
  { day: 'Sat', requests: 3.6 },
  { day: 'Sun', requests: 3.9 },
  { day: 'Mon ', requests: 5.2 },
  { day: 'Tue ', requests: 5.9 },
  { day: 'Wed ', requests: 5.6 },
  { day: 'Thu ', requests: 6.6 },
  { day: 'Fri ', requests: 6.2 },
]
const CHART: ChartConfig = { requests: { label: 'Requests', color: 'var(--color-chart-1)' } }

const DEPLOYS = [
  { who: 'MO', title: 'Faster checkout', branch: 'main', when: '2 min ago', status: 'Ready', tone: 'success' },
  { who: 'TL', title: 'Search filters', branch: 'search', when: '18 min ago', status: 'Building', tone: 'warning' },
  { who: 'ID', title: 'Onboarding copy', branch: 'onboard', when: '1 h ago', status: 'Ready', tone: 'success' },
  { who: 'KM', title: 'Billing webhooks', branch: 'billing', when: '3 h ago', status: 'Ready', tone: 'success' },
  { who: 'AR', title: 'Dark mode charts', branch: 'charts', when: 'Yesterday', status: 'Ready', tone: 'success' },
] as const

/** A part waits behind it until its look starts; `region` marks the node the look runs on. */
function Gate({ region, className, children }: { region: EntranceRegion; className?: string; children: ReactNode }) {
  const open = useFrameValue((f) => gateOpen(region, f - P))
  return (
    <div className={className} style={open ? undefined : { opacity: 0 }}>
      {children}
    </div>
  )
}

/** The still copy's stand-in for a gate: it is the finished screen. */
function Open({ className, children }: { region: EntranceRegion; className?: string; children: ReactNode }) {
  return <div className={className}>{children}</div>
}

function Dashboard({ copy }: { copy?: boolean }) {
  const G = copy ? Open : Gate
  return (
    <div data-relay={copy ? undefined : 'frame'} className="flex flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg" style={{ width: DASH.w, height: DASH.h }}>
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-line px-5">
        <span aria-hidden className="grid size-7 place-items-center rounded-md bg-accent text-on-accent">
          <GitBranchIcon size={15} />
        </span>
        <span className="font-semibold tracking-tight">Meridian</span>
        <span aria-hidden className="text-fg-subtle">/</span>
        <span className="text-ui-sm text-fg-muted">Overview</span>
        <InputGroup className="ms-auto w-60">
          <InputGroupAddon>
            <SearchIcon size={15} />
          </InputGroupAddon>
          <InputGroupInput type="search" aria-label="Search" placeholder="Search" tabIndex={-1} />
        </InputGroup>
        <span aria-hidden className="grid size-8 place-items-center rounded-md border border-line text-fg-muted">
          <BellIcon size={15} />
        </span>
        <Avatar className="size-8">
          <AvatarFallback>HS</AvatarFallback>
        </Avatar>
      </header>
      <div className="flex min-h-0 flex-1">
        <aside aria-label="Workspace" className="w-56 shrink-0">
          <G region="sidebar" className="h-full">
            <div data-relay={copy ? undefined : 'sidebar'} className="flex h-full flex-col gap-1 border-e border-line bg-surface p-3">
              <p className="px-2 pt-1 pb-2 text-ui-xs font-medium tracking-wide text-fg-subtle uppercase">Workspace</p>
              <nav aria-label="Main" className="flex flex-col gap-0.5">
                {NAV.map(({ icon: Icon, label, current }) => (
                  <a
                    key={label}
                    href={`#${label}`}
                    tabIndex={-1}
                    aria-current={current ? 'page' : undefined}
                    className={`flex h-8 items-center gap-2.5 rounded-md px-2 text-ui-sm ${current ? 'bg-well font-medium text-fg' : 'text-fg-muted'}`}
                  >
                    <Icon size={16} />
                    {label}
                  </a>
                ))}
              </nav>
              <div className="mt-auto rounded-lg border border-line bg-canvas p-3">
                <p className="text-ui-sm font-medium">Build minutes</p>
                <p className="mt-0.5 text-ui-xs text-fg-muted">Renews on the first</p>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-well">
                  <div className="h-full w-[62%] rounded-full bg-accent" />
                </div>
              </div>
            </div>
          </G>
        </aside>
        <main className="flex min-w-0 flex-1 flex-col gap-5 p-6">
          <section aria-label="Key figures" className="shrink-0">
            <G region="stats">
              <div data-relay={copy ? undefined : 'stats'} className="grid grid-cols-3 gap-4">
                <StatCard label="Deploys" value={128} previous={114} comparison="vs. last week" />
                <StatCard label="Uptime" value={0.9998} format={{ style: 'percent', maximumFractionDigits: 2 }} comparison="this month" />
                <StatCard label="P95 latency" value={182} unit="ms" previous={198} invert comparison="vs. last week" />
              </div>
            </G>
          </section>
          <div className="flex min-h-0 flex-1 gap-5">
            <section aria-label="Traffic" className="min-w-0 flex-[3]">
              <G region="chart" className="h-full">
                <Card data-relay={copy ? undefined : 'chart'} className="h-full">
                  <CardHeader>
                    <CardTitle>Requests</CardTitle>
                    <CardDescription>Millions a day, the last two weeks</CardDescription>
                  </CardHeader>
                  <CardContent className="min-h-0 flex-1">
                    <ChartContainer config={CHART} className="aspect-auto h-full w-full" title="Requests" summary="Requests a day, rising">
                      <AreaChart data={TRAFFIC} margin={{ left: 4, right: 4, top: 8 }}>
                        <defs>
                          <linearGradient id="relay-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-requests)" stopOpacity={0.35} />
                            <stop offset="100%" stopColor="var(--color-requests)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid vertical={false} />
                        <XAxis dataKey="day" tickLine={false} axisLine={false} tickMargin={8} interval={1} />
                        <Area dataKey="requests" type="monotone" stroke="var(--color-requests)" strokeWidth={2} fill="url(#relay-fill)" isAnimationActive={false} />
                      </AreaChart>
                    </ChartContainer>
                  </CardContent>
                </Card>
              </G>
            </section>
            <section aria-label="Recent deploys" className="min-w-0 flex-[2]">
              <G region="list" className="h-full">
                <Card data-relay={copy ? undefined : 'list'} className="h-full">
                  <CardHeader>
                    <CardTitle>Recent deploys</CardTitle>
                    <CardDescription>Across every project</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="-mx-2 flex flex-col">
                      {DEPLOYS.map((d) => (
                        <li key={d.title} className="flex items-center gap-3 rounded-md px-2 py-2">
                          <Avatar className="size-7">
                            <AvatarFallback className="text-[11px]">{d.who}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-ui-sm font-medium">{d.title}</p>
                            <p className="truncate text-ui-xs text-fg-muted">
                              {d.branch} · {d.when}
                            </p>
                          </div>
                          <Badge variant={d.tone === 'success' ? 'success' : 'warning'}>{d.status}</Badge>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </G>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

/* Made once: the looks hold and restore the dashboard's own styles, so it never re-renders under them. */
const DASHBOARD = (
  <YoujProvider reducedMotion="always">
    <Dashboard />
  </YoujProvider>
)
const STILL = (
  <YoujProvider reducedMotion="always">
    <Dashboard copy />
  </YoujProvider>
)

/* ── The relay ─────────────────────────────────────────────────────────── */

const RELAY = E.relay
const at = (look: EntranceLook) => RELAY.find((r) => r.look === look)!
const CLEARED = E.clear + E.clearLength
const LAYERS = at('layers')

/** Whether a region shows: always while the finished screen is up, then from its look's start. */
function gateOpen(region: EntranceRegion, f: number) {
  if (f < CLEARED) return true
  const item = RELAY.find((r) => r.region === region && r.look !== 'layers')
  return !item || f >= item.at
}

type Start = (node: HTMLElement, options: { paused: true; reduced: false; duration: number }) => EntranceRun
const STARTS: Record<EntranceLook, Start> = {
  blueprint: (node, o) => blueprint(node, { ...o, columns: 'none' }),
  trace: (node, o) => trace(node, { ...o, accent: true }),
  prism: (node, o) => prism(node, o),
  // the chart is the last piece to composite: give the composite room, so it lands before the list takes over
  passes: (node, o) => renderPasses(node, { ...o, phases: { layout: 24, paint: 28, composite: 48 } }),
  inspector: (node, o) => inspector(node, o),
  layers: (node, o) => layers(node, o),
}

/** What each look is called in its caption. */
const NAMES: Record<EntranceLook, string> = {
  blueprint: 'Blueprint',
  trace: 'Trace',
  prism: 'Prism',
  passes: 'Render passes',
  inspector: 'Inspector',
  layers: 'Layers',
}

/**
 * Runs the relay on the dashboard under `host`: each look made as its moment
 * comes and seeked to the frame, every frame, until it ends. Going back (a
 * scrub in the Studio) starts a look over.
 */
function useRelay(host: RefObject<HTMLDivElement | null>) {
  const runs = useRef(new Map<EntranceLook, { run: EntranceRun; t: number }>())
  useEachFrame((frame) => {
    const f = frame - P
    for (const item of RELAY) {
      const t = ms(f - item.at + (item.from ?? 0))
      const length = ms(item.length)
      const live = runs.current.get(item.look)
      if (live && t < live.t) {
        live.run.cancel()
        runs.current.delete(item.look)
      }
      if (f < item.at || t > length + ms(2)) continue
      let entry = runs.current.get(item.look)
      if (!entry) {
        const node = host.current?.querySelector<HTMLElement>(`[data-relay="${item.region}"]`)
        if (!node) continue
        entry = { run: STARTS[item.look](node, { paused: true, reduced: false, duration: length }), t }
        runs.current.set(item.look, entry)
      }
      entry.t = t
      entry.run.seek(t)
    }
  })
}

/* ── The tilt into Layers ──────────────────────────────────────────────── */

/* Layers' camera (packages/motion/…/layers/engine.ts): tilted back and turned, fitted so its exploded stack stays inside its overlay. */
const LY = { margin: 40, lane: 104, tilt: 55, turn: -36, layers: 4 }

/** The transform Layers' stage wears at `on` (0 flat, 1 its angle), about the dashboard's centre, for the dashboard's own box. */
function layersCamera(on: number) {
  const { w: W, h: H } = DASH
  const CW = W + 2 * LY.margin
  const CH = H + 2 * LY.margin
  const gap = Math.max(36, Math.min(110, Math.min(W, H) * 0.2))
  const P3 = Math.max(W, H) * 3
  const project = (s: number) => {
    const m = new DOMMatrix().scaleSelf(s, s, s).rotateSelf(LY.tilt, 0, 0).rotateSelf(0, 0, LY.turn)
    let x0 = Infinity
    let y0 = Infinity
    let x1 = -Infinity
    let y1 = -Infinity
    for (const z of [0, (LY.layers - 1) * gap])
      for (const [x, y] of [
        [-W / 2, -H / 2],
        [W / 2, -H / 2],
        [W / 2, H / 2],
        [-W / 2, H / 2],
      ] as const) {
        const p = m.transformPoint(new DOMPoint(x, y, z))
        const k = P3 / (P3 - p.z)
        x0 = Math.min(x0, p.x * k)
        x1 = Math.max(x1, p.x * k)
        y0 = Math.min(y0, p.y * k)
        y1 = Math.max(y1, p.y * k)
      }
    return { w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
  }
  let s = 1
  for (let i = 0; i < 3; i++) {
    const b = project(s)
    s *= Math.min((CW - 16 - LY.lane) / b.w, (CH - 16) / b.h)
  }
  s = Math.min(1, s)
  const fit = project(s)
  const dx = LY.lane / 2 - fit.cx
  const k = 1 + (s - 1) * on
  return `translate(${(dx * on).toFixed(2)}px, ${(-fit.cy * on).toFixed(2)}px) perspective(${Math.round(P3)}px) scale3d(${k}, ${k}, ${k}) rotateX(${LY.tilt * on}deg) rotateZ(${LY.turn * on}deg)`
}

/* ── The batons ───────────────────────────────────────────────────────── */

type Box = { l: number; t: number; r: number; b: number }
type Pt = [number, number]

/** Each part's box in the dashboard's own px, measured once it has laid out (it never moves). */
function useBoxes(host: RefObject<HTMLDivElement | null>, scale: number) {
  const [boxes, setBoxes] = useState<Partial<Record<EntranceRegion, Box>>>({})
  useLayoutEffect(() => {
    const root = host.current?.getBoundingClientRect()
    if (!root) return
    const out: Partial<Record<EntranceRegion, Box>> = {}
    for (const el of host.current!.querySelectorAll<HTMLElement>('[data-relay]')) {
      const r = el.getBoundingClientRect()
      const at = (v: number, o: number) => Math.round((v - o) / scale)
      out[el.dataset.relay as EntranceRegion] = { l: at(r.left, root.left), t: at(r.top, root.top), r: at(r.right, root.left), b: at(r.bottom, root.top) }
    }
    setBoxes(out)
  }, [host, scale])
  return boxes
}

/** Where each baton runs: from where one look lands to where the next starts, along the gutters between the parts. */
function batonPaths(b: Partial<Record<EntranceRegion, Box>>): Pt[][] {
  const { sidebar: sb, stats: st, chart: ch, list: li } = b
  if (!sb || !st || !ch || !li) return []
  const gapY = (st.b + ch.t) / 2
  const gapX = (ch.r + li.l) / 2
  return [
    // up the sidebar's edge from the foot the trace reached last, and across to the stat cards' corner
    [
      [sb.r, sb.b - 24],
      [sb.r, st.t],
      [st.l, st.t],
    ],
    // along the gutter under the stat cards, back to the chart's corner
    [
      [st.r, gapY],
      [ch.l, gapY],
      [ch.l, ch.t],
    ],
    // down the gutter beside the chart and across to the list's corner
    [
      [ch.r, ch.b],
      [gapX, ch.b],
      [gapX, li.t],
      [li.l, li.t],
    ],
  ]
}

const lengthOf = (path: Pt[]) => path.slice(1).reduce((n, [x, y], i) => n + Math.hypot(x - path[i]![0], y - path[i]![1]), 0)
/** The first `d` px of a path, and where its head is. */
function upTo(path: Pt[], d: number): { points: Pt[]; head: Pt } {
  const points: Pt[] = [path[0]!]
  let left = d
  for (let i = 1; i < path.length; i++) {
    const [x0, y0] = path[i - 1]!
    const [x1, y1] = path[i]!
    const n = Math.hypot(x1 - x0, y1 - y0)
    if (left >= n) {
      points.push([x1, y1])
      left -= n
      continue
    }
    const k = n ? left / n : 0
    const head: Pt = [x0 + (x1 - x0) * k, y0 + (y1 - y0) * k]
    points.push(head)
    return { points, head }
  }
  return { points, head: path.at(-1)! }
}

/**
 * The hand-offs: a signal in the accent, like Trace's, runs from the part
 * just landing to the corner where the next look starts, leaving a faint
 * etch that fades as the next look takes over.
 */
function Batons({ f, boxes }: { f: number; boxes: Partial<Record<EntranceRegion, Box>> }) {
  const paths = batonPaths(boxes)
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 overflow-visible" width={DASH.w} height={DASH.h}>
      {paths.map((path, i) => {
        const { at, length } = E.batons[i]!
        const run = tween(f, at, length, 'standard')
        const fade = 1 - tween(f, at + length, E.batonFade, 'exit')
        if (run <= 0 || fade <= 0) return null
        const { points, head } = upTo(path, run * lengthOf(path))
        const headShows = run < 1 ? Math.min(1, run * 6) : fade
        return (
          <g key={i}>
            <polyline points={points.map((p) => p.join(',')).join(' ')} fill="none" stroke="var(--color-accent)" strokeWidth={1} opacity={0.5 * fade} />
            <circle cx={head[0]} cy={head[1]} r={5} fill="var(--color-accent)" opacity={0.25 * headShows} />
            <circle cx={head[0]} cy={head[1]} r={1.75} fill="var(--color-accent)" opacity={headShows} />
          </g>
        )
      })}
    </svg>
  )
}

/* ── Layout per cut ────────────────────────────────────────────────────── */

interface Layout {
  /** Where the dashboard sits on the stage, and its scale. */
  x: number
  y: number
  scale: number
  /** The caption's corner. */
  caption: CSSProperties
}

function layoutFor(format: Format): Layout {
  if (format.tile) {
    const scale = 0.6
    return { x: (format.width - DASH.w * scale) / 2, y: 22, scale, caption: { left: 24, bottom: 18 } }
  }
  if (format.tall) {
    const scale = 0.66
    return { x: (format.width - DASH.w * scale) / 2, y: 280, scale, caption: { left: 48, bottom: 72 } }
  }
  return { x: (format.width - DASH.w) / 2, y: 46, scale: 1, caption: { left: 130, bottom: 34 } }
}

/* ── The scene ─────────────────────────────────────────────────────────── */

export function EntrancesLoop() {
  const frame = useFrame()
  const f = frame - P
  const format = useFormat()
  // biome-ignore lint/correctness/useExhaustiveDependencies: deps are chosen by hand
  const layout = useMemo(() => layoutFor(format), [format.width, format.height])
  const host = useRef<HTMLDivElement>(null)
  useRelay(host)
  const boxes = useBoxes(host, layout.scale)

  // The finished screen dissolves to the paper; the frame comes back with Blueprint, which holds it until it's drafted.
  const shown = f < E.clear ? 1 : f < CLEARED ? 1 - tween(f, E.clear, E.clearLength, 'exit') : f < at('blueprint').at ? 0 : 1
  // The tilt: the still copy leans back to Layers' angle, and fades as the stack rises out of it.
  const tiltLength = LAYERS.at - E.tilt
  const lean = tween(f, E.tilt, tiltLength, 'emphasized')
  const tilting = f >= E.tilt && f < LAYERS.at + E.handover
  // it holds while the stack's first planes rise behind it, so the screen never dims between the two
  const stillShows = 1 - tween(f, LAYERS.at + 10, E.handover - 10, 'standard')

  const place: CSSProperties = { left: layout.x, top: layout.y, width: DASH.w, height: DASH.h, transform: `scale(${layout.scale})`, transformOrigin: '0 0' }
  return (
    <div className="absolute inset-0">
      <Backdrop grid={0.6} glow={0.16} glowAt={{ x: 50, y: 46 }} />
      <div ref={host} className="absolute" style={{ ...place, opacity: tilting && f < LAYERS.at ? 0 : shown }}>
        {DASHBOARD}
      </div>
      <div className="pointer-events-none absolute" style={place}>
        <Batons f={f} boxes={boxes} />
      </div>
      {f >= E.tilt - 40 && f < LAYERS.at + E.handover && (
        // out of hit tests: the looks ask the page what shows each line of text, and it must answer with the real dashboard
        <div className="pointer-events-none absolute" style={{ ...place, opacity: tilting ? stillShows : 0 }}>
          <div style={{ width: DASH.w, height: DASH.h, transform: layersCamera(lean), transformOrigin: '50% 50%' }}>{STILL}</div>
        </div>
      )}
      <Captions f={f} layout={layout} />
    </div>
  )
}

/* ── Captions ──────────────────────────────────────────────────────────── */

const MONO = 'font-mono leading-none whitespace-nowrap'

/** The look building now, named small in the corner as it takes over; at the end, the line that installs the first. */
function Captions({ f, layout }: { f: number; layout: Layout }) {
  const end = tween(f, E.install, E.installLength, 'enter')
  // the install line holds from the end round to the start of the next loop, and leaves as the screen clears
  const install = f >= E.install ? end : 1 - tween(f, E.clear, E.clearLength * 0.6, 'exit')
  const names = RELAY.map((r, i) => {
    const next = RELAY[i + 1]
    // one name at a time: the last one sinks away just before the next rises
    const on = tween(f, r.at, 12, 'enter') * (1 - tween(f, (next ? next.at : E.install) - 10, 10, 'exit'))
    return { look: r.look, on }
  })
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {names.map(({ look, on }) =>
        on > 0 ? (
          <p key={look} className={`absolute flex items-center gap-3 ${MONO}`} style={{ ...layout.caption, opacity: on, transform: `translateY(${(1 - on) * 6}px)` }}>
            <span className="size-2 rounded-[1.5px] bg-accent" />
            <span className="text-[14px] tracking-[0.1em] text-fg uppercase">{NAMES[look]}</span>
          </p>
        ) : null,
      )}
      {install > 0 && (
        <p className={`absolute flex items-center gap-2.5 rounded-lg border border-line bg-surface px-3.5 py-2.5 ${MONO}`} style={{ ...layout.caption, opacity: install, transform: `translateY(${(1 - install) * 6}px)` }}>
          <span className="text-[14px] text-fg-subtle">$</span>
          <span className="text-[14px] text-fg">{BRAND.install.entrance}</span>
        </p>
      )}
    </div>
  )
}

