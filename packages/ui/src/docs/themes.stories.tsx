import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { CheckIcon, ExternalLinkIcon, GitBranchIcon, RotateCcwIcon } from '@youj/icons'
import { motion } from 'motion/react'
import { brutal, motionPersonalities, terminal, themes, ThemeScope, useYouj, type MotionPersonality, type RadiusScale, type Theme } from '@youj/core'
import { RADIUS } from '@youj/core/lib/youj/theme'
import { MeshGradient } from '@youj/motion/backgrounds'
import { Avatar, AvatarFallback, AvatarGroup } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Checkbox } from '../components/ui/checkbox'
import { Field, FieldContent, FieldDescription, FieldLabel, FieldTitle } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '../components/ui/popover'
import { Progress, ProgressLabel, ProgressValue } from '../components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select'
import { Slider } from '../components/ui/slider'
import { Spinner } from '../components/ui/spinner'
import { Switch } from '../components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { toast, Toaster } from '../components/ui/toast'
import { ThemeBuilder } from './theme-builder'
import { CharacterComparison } from './theme-character'
import { firstFamily, strokeSpec, Swatches, ThemeSample } from './theme-sample'

const meta: Meta = {
  title: 'Foundations/Themes',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A youj theme is a small contract: the neutral hue, chroma and wash, an accent, optional status colors, radius, density, fonts, a motion personality, and its character (stroke, shadow, titles and labels). Everything else is derived for light and dark: the neutral ramp, the shadcn names, focus ring, elevation, status inks, the radius scale, control heights, durations and curves. Apply one with CSS (`data-yj-theme` plus the contract variables), with JS (`<YoujProvider theme>` / `<ThemeScope theme>`), or both. The **Preset** toolbar re-themes every story. Here: a composed product screen that follows it, every preset side by side, character compared, a live editor with checks and export, the three motion personalities, and nested scopes whose overlays follow them.',
      },
    },
  },
}
export default meta

/* ── Shared ─────────────────────────────────────────────────────────────── */

function PageHeader({ eyebrow, title, children, aside }: { eyebrow: string; title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <header className="mx-auto flex w-full max-w-6xl flex-wrap items-end justify-between gap-4">
      <div className="flex max-w-[68ch] flex-col gap-2">
        <span className="font-mono text-ui-xs font-medium tracking-[0.14em] text-fg-muted uppercase">{eyebrow}</span>
        <h1 className="text-[32px] leading-[1.1] font-semibold tracking-[-0.03em] text-fg">{title}</h1>
        <p className="text-[15px] leading-relaxed text-fg-muted">{children}</p>
      </div>
      {aside}
    </header>
  )
}

/* ── Composition: a product screen that follows the Preset toolbar ─────── */

const DEPLOYS = [
  { id: 'd1', message: 'Tighten the deploy queue', branch: 'main', sha: '3f9c2a1', env: 'production', state: 'ready', age: '12m' },
  { id: 'd2', message: 'Add usage alerts to billing', branch: 'feat/alerts', sha: '9b1e0d4', env: 'preview', state: 'building', age: '3m' },
  { id: 'd3', message: 'Fix the flaky auth redirect', branch: 'fix/auth', sha: 'c47a2f8', env: 'preview', state: 'failed', age: '48m' },
  { id: 'd4', message: 'Upgrade the image optimiser', branch: 'main', sha: '71de9a3', env: 'production', state: 'ready', age: '5h' },
  { id: 'd5', message: 'Draft the pricing page copy', branch: 'copy/pricing', sha: 'e0f3b6c', env: 'preview', state: 'queued', age: '6h' },
] as const

const STATE = {
  ready: { label: 'Ready', variant: 'success' },
  building: { label: 'Building', variant: 'warning' },
  failed: { label: 'Failed', variant: 'danger' },
  queued: { label: 'Queued', variant: 'secondary' },
} as const

const REGIONS = { fra1: 'Frankfurt (fra1)', iad1: 'Washington (iad1)', sfo1: 'San Francisco (sfo1)', hnd1: 'Tokyo (hnd1)' }

function DeploymentRow({ d }: { d: (typeof DEPLOYS)[number] }) {
  const s = STATE[d.state]
  return (
    <li className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-1 px-5 py-3 sm:grid-cols-[minmax(0,1fr)_5.5rem_6.5rem_2.5rem]">
      <div className="min-w-0">
        <div className="truncate text-ui font-medium text-fg">{d.message}</div>
        <div className="flex items-center gap-1.5 font-mono text-ui-xs text-fg-subtle">
          <GitBranchIcon className="size-3" />
          <span className="truncate">
            {d.branch} · {d.sha}
          </span>
        </div>
      </div>
      <span className="hidden text-ui-sm text-fg-muted capitalize sm:block">{d.env}</span>
      <Badge variant={s.variant} className="justify-self-start">
        {d.state === 'building' && <Spinner size={12} label={null} />}
        {s.label}
      </Badge>
      <span className="hidden text-end font-mono text-ui-xs text-fg-subtle tabular-nums sm:block">{d.age}</span>
    </li>
  )
}

function DeployConsole() {
  const [builds, setBuilds] = useState([4])
  useEffect(() => {
    // Persistent, so the screen always shows one; dismissed when the story unmounts.
    const id = toast.success('Deployed to production', { description: 'orion · 3f9c2a1, built in 42s', timeout: 0 })
    return () => toast.dismiss(id)
  }, [])

  return (
    <div className="min-h-dvh bg-canvas font-sans text-fg">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8">
        <header className="flex flex-wrap items-center gap-4">
          <span aria-hidden className="grid size-10 place-items-center rounded-lg bg-accent text-ui-lg font-semibold text-on-accent">
            o
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[22px] leading-tight font-semibold tracking-tight">orion</h1>
              <Badge variant="outline">Pro</Badge>
            </div>
            <p className="font-mono text-ui-sm text-fg-muted">acme/orion · main</p>
          </div>
          <AvatarGroup className="max-sm:hidden">
            {['AL', 'GH', 'AT'].map((i) => (
              <Avatar key={i}>
                <AvatarFallback>{i}</AvatarFallback>
              </Avatar>
            ))}
          </AvatarGroup>
          <div className="flex gap-2">
            <Button variant="outline">
              <ExternalLinkIcon />
              Visit
            </Button>
            <Button>Redeploy</Button>
          </div>
        </header>

        <Card className="gap-0 overflow-hidden py-0">
          <div className="grid md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <div className="relative min-h-52 overflow-hidden border-b border-line md:border-e md:border-b-0">
              <MeshGradient className="absolute inset-0" />
              <span className="absolute start-4 bottom-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface/90 youj-allow-glass px-2 py-1 font-mono text-ui-xs text-fg backdrop-blur-sm">
                <span aria-hidden className="size-1.5 rounded-full bg-success" />
                orion.acme.dev
              </span>
            </div>
            <div className="flex flex-col gap-4 p-5">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-ui-lg font-semibold tracking-tight">Production</h2>
                <Badge variant="success">Ready</Badge>
              </div>
              <dl className="grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-2.5 text-ui">
                <dt className="text-fg-muted">Domains</dt>
                <dd className="truncate font-mono text-ui-sm">
                  orion.acme.dev <span className="text-fg-subtle">+2</span>
                </dd>
                <dt className="text-fg-muted">Source</dt>
                <dd className="truncate">Tighten the deploy queue</dd>
                <dt className="text-fg-muted">Commit</dt>
                <dd className="font-mono text-ui-sm">main · 3f9c2a1</dd>
                <dt className="text-fg-muted">Created</dt>
                <dd>
                  12 minutes ago <span className="text-fg-subtle">by Ada</span>
                </dd>
              </dl>
              <Progress value={72} getAriaValueText={(_, v) => `${v}% of this month's build minutes`}>
                <ProgressLabel>Build minutes</ProgressLabel>
                <ProgressValue />
              </Progress>
            </div>
          </div>
        </Card>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <Card className="gap-0 pb-0">
            <CardHeader className="pb-2">
              <CardTitle>Deployments</CardTitle>
              <CardDescription>Every push builds a preview; main goes to production.</CardDescription>
            </CardHeader>
            <Tabs defaultValue="all">
              <TabsList aria-label="Filter deployments" className="px-3">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="production">Production</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              {(['all', 'production', 'preview'] as const).map((env) => (
                <TabsContent key={env} value={env}>
                  <ul className="divide-y divide-line">
                    {DEPLOYS.filter((d) => env === 'all' || d.env === env).map((d) => (
                      <DeploymentRow key={d.id} d={d} />
                    ))}
                  </ul>
                </TabsContent>
              ))}
            </Tabs>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Project settings</CardTitle>
              <CardDescription>Applies to every new deployment.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <Field>
                <FieldLabel>Project name</FieldLabel>
                <Input defaultValue="orion" />
              </Field>
              <Field>
                <FieldLabel>Region</FieldLabel>
                <Select items={REGIONS} defaultValue="fra1">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIONS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field>
                <div className="flex items-baseline justify-between gap-3">
                  <FieldTitle>Concurrent builds</FieldTitle>
                  <span className="font-mono text-ui text-fg tabular-nums">{builds[0]}</span>
                </div>
                <Slider aria-label="Concurrent builds" value={builds} min={1} max={8} step={1} onValueChange={(v) => setBuilds(v as number[])} />
              </Field>
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldLabel>Protect previews</FieldLabel>
                  <FieldDescription>Require sign-in on preview URLs.</FieldDescription>
                </FieldContent>
                <Switch defaultChecked />
              </Field>
              <Field orientation="horizontal">
                <Checkbox defaultChecked />
                <FieldContent>
                  <FieldLabel>Email me when a build fails</FieldLabel>
                </FieldContent>
              </Field>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Button variant="ghost">Cancel</Button>
              <Button>Save</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
      <Toaster position="bottom-end" />
    </div>
  )
}

/** A deploy console built from the UI kit and a motion background. It follows the Preset toolbar, so switch presets and themes to see each one on a real screen. */
export const Composition: StoryObj = {
  render: () => <DeployConsole />,
}

/* ── Presets: every preset, side by side ────────────────────────────────── */

function Spec({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-ui-xs text-fg-muted">{term}</dt>
      <dd className="font-mono text-ui-sm text-fg">{children}</dd>
    </div>
  )
}

const radiusPx = (radius: RadiusScale) => parseFloat(RADIUS[radius]) * 16
const CONTROL_PX = { compact: 28, default: 32, comfortable: 36 } as const

function PresetBand({ theme }: { theme: Theme }) {
  return (
    <ThemeScope theme={theme}>
      <section aria-label={theme.name} className="grid overflow-hidden rounded-2xl border border-line bg-canvas text-fg md:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="flex flex-col gap-5 border-b border-line p-6 md:border-e md:border-b-0">
          <div className="flex flex-col gap-1.5">
            <code className="font-mono text-ui-xs text-fg-muted">data-yj-theme=&quot;{theme.id}&quot;</code>
            <h2 className="text-[26px] leading-tight font-semibold tracking-tight">{theme.name}</h2>
            <p className="text-ui leading-relaxed text-fg-muted">{theme.description}</p>
          </div>
          <Swatches />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Spec term="Radius">
              {theme.radius} · {radiusPx(theme.radius ?? 'md')}px
            </Spec>
            <Spec term="Control size">
              {theme.controlSize} · {CONTROL_PX[theme.controlSize ?? 'default']}px
            </Spec>
            <Spec term="Motion">{theme.motionPersonality}</Spec>
            <Spec term="Type">{firstFamily(theme.fonts?.sans)}</Spec>
            <Spec term="Stroke">{strokeSpec(theme)}</Spec>
            <Spec term="Shadow">{theme.shadow ?? 'soft'}</Spec>
          </dl>
        </div>
        <ThemeSample wide className="p-5" />
      </section>
    </ThemeScope>
  )
}

/** Each band is a `<ThemeScope theme={preset}>`: presets are complete, so a band ignores the Preset toolbar around it. */
export const Presets: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8 bg-canvas px-6 py-10 font-sans">
      <PageHeader eyebrow="Presets" title={`${themes.length} presets, one contract`}>
        Basalt is the default. The others are complete themes and double as examples: each is a stylesheet that sets only the contract
        (themes/&lt;id&gt;.css) and the same theme as a defineTheme object (themes/&lt;id&gt;.ts).
      </PageHeader>
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        {themes.map((t) => (
          <PresetBand key={t.id} theme={t} />
        ))}
      </div>
    </div>
  ),
}

/* ── Character: stroke, shadow, titles and labels ───────────────────────── */

/** The same card in Graphite, in Graphite's colors with Brutal's character, and in Brutal. Each pane is a complete theme, so the toolbar's preset doesn't reach it; switch light and dark to see both. */
export const Character: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8 bg-canvas px-6 py-10 font-sans">
      <PageHeader eyebrow="Character" title="Not just color, corners and type">
        A theme also sets how it draws: line weight and ink (stroke), how it shows depth (shadow: soft, hard or none), and the voice of its
        titles and labels. The middle pane keeps Graphite&apos;s palette and takes only Brutal&apos;s character.
      </PageHeader>
      <CharacterComparison className="mx-auto w-full max-w-6xl" />
    </div>
  ),
}

/* ── Editor ─────────────────────────────────────────────────────────────── */

/** Edit the contract live: the previews, checks and export update as you go. Slide the chroma and wash to the ends to see the guardrails at work. */
export const Editor: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-8 bg-canvas px-6 py-10 font-sans">
      <PageHeader eyebrow="Editor" title="Build a theme">
        Every control is a contract field. The previews are the same theme in light and dark; the checks are checkTheme and the same contrast
        maths the tests run; the export is themeCss and the defineTheme source.
      </PageHeader>
      <ThemeBuilder className="mx-auto w-full max-w-6xl" />
    </div>
  ),
}

/* ── Motion personalities ───────────────────────────────────────────────── */

const NOTES: Record<MotionPersonality, string> = {
  precise: 'Fast and confident, and lands without overshoot. Only settle bounces. The default.',
  calm: 'About 1.4× longer and soft at both ends. Nothing overshoots, not even settle.',
  lively: 'About 15% quicker. Arrivals overshoot a touch, and springs keep some bounce.',
}

const ROWS = ['Queued build', 'Installed dependencies', 'Compiled 214 modules', 'Deployed to the edge']

/** The enter curve as a graph: time along, progress up. Lines mark the start and the target. */
function EaseCurve({ bezier }: { bezier: readonly [number, number, number, number] }) {
  const [x1, y1, x2, y2] = bezier
  const W = 240
  const H = 84
  const X = (x: number) => 8 + x * (W - 16)
  const Y = (y: number) => H - 10 - y * (H - 34)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label={`Enter curve: cubic-bezier(${bezier.join(', ')})`}>
      <line x1={X(0)} x2={X(1)} y1={Y(1)} y2={Y(1)} className="stroke-line" strokeDasharray="3 3" />
      <line x1={X(0)} x2={X(1)} y1={Y(0)} y2={Y(0)} className="stroke-line" />
      <path
        d={`M ${X(0)} ${Y(0)} C ${X(x1)} ${Y(y1)}, ${X(x2)} ${Y(y2)}, ${X(1)} ${Y(1)}`}
        fill="none"
        className="stroke-accent"
        strokeWidth={2}
        strokeLinecap="round"
      />
    </svg>
  )
}

function useTrack() {
  const ref = useRef<HTMLDivElement>(null)
  const [size, setSize] = useState({ width: 0, dir: 1 })
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const measure = () => setSize({ width: el.clientWidth, dir: getComputedStyle(el).direction === 'rtl' ? -1 : 1 })
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, size] as const
}

/** One personality's lane. Every animation reads useYouj, so the scope around it sets the timing. */
function MotionLane({ run }: { run: number }) {
  const k = useYouj()
  const t = motionPersonalities[k.motionPersonality]
  const [track, { width, dir }] = useTrack()
  const [on, setOn] = useState(false)
  useEffect(() => {
    if (run > 0) setOn((v) => !v)
  }, [run])
  const still = { duration: 0 }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="capitalize">{k.motionPersonality}</CardTitle>
        <CardDescription>{NOTES[k.motionPersonality]}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <EaseCurve bezier={t.easings.enter} />
        <dl className="grid grid-cols-3 gap-2 font-mono text-ui-xs">
          <div>
            <dt className="text-fg-muted">base</dt>
            <dd className="text-fg">{t.durations.base}ms</dd>
          </div>
          <div>
            <dt className="text-fg-muted">slow</dt>
            <dd className="text-fg">{t.durations.slow}ms</dd>
          </div>
          <div>
            <dt className="text-fg-muted">settle</dt>
            <dd className="text-fg">bounce {t.springs.settle.bounce}</dd>
          </div>
        </dl>
        <div ref={track} className="relative h-9 rounded-full border border-line bg-band">
          {width > 0 && (
            <motion.span
              key={run}
              aria-hidden
              className="absolute start-1 top-1 size-6.5 rounded-full bg-accent shadow-sm"
              initial={k.reduced ? false : { x: 0 }}
              animate={{ x: (width - 34) * dir }}
              transition={k.reduced ? still : k.tween('slow', 'enter')}
            />
          )}
        </div>
        <ul className="flex flex-col gap-1.5">
          {ROWS.map((row, i) => (
            <motion.li
              key={`${run}-${row}`}
              className="flex items-center gap-2 rounded-md border border-line bg-surface px-2.5 py-1.5 text-ui-sm text-fg"
              initial={k.reduced ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={k.reduced ? still : { ...k.tween('base', 'enter'), delay: i * k.stagger('base') }}
            >
              <span aria-hidden className="size-1.5 rounded-full bg-accent" />
              {row}
            </motion.li>
          ))}
        </ul>
        <div className="flex items-center justify-between gap-3">
          <motion.span
            key={run}
            className="inline-flex items-center gap-1.5 rounded-full bg-success-subtle px-2.5 py-1 text-ui-sm font-medium text-success-text"
            initial={k.reduced ? false : { scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={k.reduced ? still : k.spring('settle')}
          >
            <CheckIcon className="size-3.5" />
            Saved
          </motion.span>
          <Switch checked={on} onCheckedChange={setOn} aria-label={`Auto-deploy (${k.motionPersonality})`} />
        </div>
      </CardContent>
    </Card>
  )
}

function MotionComparison() {
  const k = useYouj()
  const [run, setRun] = useState(0)
  return (
    <div className="flex flex-col gap-8 bg-canvas px-6 py-10 font-sans">
      <PageHeader
        eyebrow="Motion"
        title="Three personalities, one set of tokens"
        aside={
          <Button variant="outline" onClick={() => setRun((r) => r + 1)} disabled={k.reduced}>
            <RotateCcwIcon />
            Replay
          </Button>
        }
      >
        Each lane is a <code className="font-mono text-[13px]">{'<ThemeScope theme={{ motionPersonality }}>'}</code>. The components and token names are
        the same (tween base and slow on enter, the stagger step, the settle spring and the switch&apos;s snappy spring); only the values change.
        {k.reduced && ' Reduced motion is on, so every lane shows its end state.'}
      </PageHeader>
      <div className="mx-auto grid w-full max-w-6xl gap-4 md:grid-cols-3">
        {(['precise', 'calm', 'lively'] as const).map((m) => (
          <ThemeScope key={m} theme={{ motionPersonality: m }}>
            <MotionLane run={run} />
          </ThemeScope>
        ))}
      </div>
    </div>
  )
}

/** The same animations under precise, calm and lively. Replay starts all three at once, so the difference in timing is side by side. */
export const MotionPersonalities: StoryObj = {
  name: 'Motion personalities',
  render: () => <MotionComparison />,
}

/* ── Scopes: nesting, overrides, CSS scopes and portals ─────────────────── */

function ScopeTag({ children }: { children: ReactNode }) {
  return (
    <code className="absolute start-4 -top-2.5 z-10 rounded-sm border border-line bg-canvas px-1.5 py-px font-mono text-[11px] text-fg-muted">
      {children}
    </code>
  )
}

function RegionSelect({ label }: { label: string }) {
  return (
    <Select items={REGIONS} defaultValue="fra1">
      <SelectTrigger aria-label={label} className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(REGIONS).map(([value, name]) => (
          <SelectItem key={value} value={value}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ScopesDemo() {
  return (
    <ThemeScope theme={brutal}>
      <div className="min-h-dvh bg-canvas px-6 py-12 text-fg">
        <article className="relative mx-auto flex max-w-4xl flex-col gap-10 rounded-2xl border border-dashed border-line p-8">
          <ScopeTag>{'<ThemeScope theme={brutal}>'}</ScopeTag>
          <div className="flex flex-col gap-3">
            <p className="text-ui-sm text-fg-muted">Field notes · Issue 12</p>
            <h1 className="text-[34px] leading-tight font-semibold tracking-tight">Shipping calmer interfaces</h1>
            <p className="max-w-prose text-[15px] leading-relaxed text-fg-muted">
              A page in Brutal. Its overlays are portaled to the end of the document, yet they open in Brutal too: the scope travels with them
              through useYoujScope.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <RegionSelect label="Region (Brutal)" />
              <Button>Subscribe</Button>
            </div>
          </div>

          <ThemeScope theme={{ accent: 'oklch(0.55 0.19 255)' }}>
            <section className="relative flex flex-col gap-4 rounded-xl border border-dashed border-line bg-surface p-6">
              <ScopeTag>{"<ThemeScope theme={{ accent: 'oklch(0.55 0.19 255)' }}>"}</ScopeTag>
              <h2 className="text-[22px] font-semibold tracking-tight">A section in its own accent</h2>
              <p className="max-w-prose text-ui leading-relaxed text-fg-muted">
                An override: it sets only the accent, so Brutal&apos;s surfaces, outlines and hard shadows carry on around it.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Button>Start a trial</Button>
                <Popover>
                  <PopoverTrigger render={<Button variant="outline" />}>Compare plans</PopoverTrigger>
                  <PopoverContent>
                    <PopoverHeader>
                      <PopoverTitle>Pro and Team</PopoverTitle>
                      <PopoverDescription>This popover is portaled, and still wears the section&apos;s accent.</PopoverDescription>
                    </PopoverHeader>
                    <Button size="sm">Choose Team</Button>
                  </PopoverContent>
                </Popover>
                <Badge>New</Badge>
              </div>

              <ThemeScope theme={terminal}>
                <div className="relative flex flex-col gap-3 rounded-lg border border-line bg-canvas p-5 text-fg">
                  <ScopeTag>{'<ThemeScope theme={terminal}>'}</ScopeTag>
                  <p className="font-mono text-ui">$ youj deploy --prod</p>
                  <p className="text-ui-sm text-fg-muted">A complete preset, nested: nothing from the page or the section leaks in.</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <RegionSelect label="Region (Terminal)" />
                    <Button size="sm">Run</Button>
                    <Badge variant="success">passing</Badge>
                  </div>
                </div>
              </ThemeScope>
            </section>
          </ThemeScope>

          <section data-yj-theme="basalt" data-yj-motion="precise" className="relative flex flex-col gap-4 rounded-xl border border-dashed border-line bg-canvas p-6 text-fg">
            <ScopeTag>{'<section data-yj-theme="basalt">'}</ScopeTag>
            <h2 className="text-[22px] font-semibold tracking-tight">The CSS route</h2>
            <p className="max-w-prose text-ui leading-relaxed text-fg-muted">
              No JavaScript: basalt.css is keyed on this attribute. Overlays render at the end of the document, outside a CSS-only scope, so wrap
              a scope that opens menus or popovers in ThemeScope instead.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Button>Commit</Button>
              <Button variant="outline">Later</Button>
              <Badge variant="success">Set in stone</Badge>
            </div>
          </section>
        </article>
      </div>
    </ThemeScope>
  )
}

/** Scopes nest: a Brutal page, a section overriding only the accent, a complete Terminal preset inside it, and a CSS-only Basalt scope. Open the selects and the popover: overlays follow the scope they were opened from. */
export const Scopes: StoryObj = {
  render: () => <ScopesDemo />,
}
