import { useMemo, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { grade } from '@youj/core/docs/lib/color'
import { Mono, Panel } from '@youj/core/docs/components/kit'
import { useTheme } from '@youj/core/lib/youj/provider'
import { Button } from '../components/ui/button'
import { Checkbox } from '../components/ui/checkbox'
import { Input } from '../components/ui/input'
import { Switch } from '../components/ui/switch'
import { cn } from '../lib/utils'
import uiCss from '../styles/ui.css?raw'
import youjCss from '../../../core/src/styles/youj.css?raw'
import { BOUNDARY_PAIRS, describeValue, forMode, parseTokens, TEXT_PAIRS, worstRatio } from './token-math'

const meta: Meta = {
  title: 'UI/Foundations/Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'The @youj/react token layer: the colour roles youj.css derives from a theme, and the UI-only tokens built on them (density, radius, type, focus, elevation). The roles are read from youj.css and the palette from the theme derivation, so this page cannot drift from either. It follows the Theme and Preset toolbars.',
      },
    },
  },
}
export default meta

/** The roles resolved against the toolbar's preset. */
function useTokens() {
  const theme = useTheme()
  return useMemo(() => parseTokens(`${uiCss}\n${youjCss}`, theme), [theme])
}

/* 11px text needs 4.5:1, so the eyebrow is muted-foreground, not fg-subtle. */
function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="font-mono text-[11px] font-medium tracking-[0.14em] text-fg-muted uppercase">{children}</div>
}

function Section({ eyebrow, title, children, note }: { eyebrow: string; title: string; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Eyebrow>{eyebrow}</Eyebrow>
        <h2 className="text-[22px] font-semibold tracking-tight text-fg">{title}</h2>
        {note && <p className="max-w-[72ch] text-ui text-fg-muted">{note}</p>}
      </div>
      {children}
    </section>
  )
}

/* ── Bridge ─────────────────────────────────────────────────────────────── */

const GROUPS: { title: string; names: string[]; note?: string }[] = [
  { title: 'Surfaces', names: ['canvas', 'fg', 'surface', 'overlay', 'well', 'field', 'key', 'control', 'chrome'], note: 'Overlays and keys step up in the dark, where lighter means closer; wells and fields sink below the card.' },
  { title: 'Actions', names: ['accent', 'on-accent', 'action', 'on-action', 'danger'] },
  { title: 'Quiet fills', names: ['hover', 'band', 'fg-muted'], note: 'Ink at low alpha, not solid grays, so they read the same on every surface.' },
  { title: 'Lines', names: ['line', 'line-control', 'focus'] },
  { title: 'Charts', names: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5'], note: 'The theme’s chart palette, held to 3:1 on every surface. Without one, a palette drawn from the accent: the accent, then four hues around the wheel from it, each at a lightness of its own.' },
  { title: 'Controls', names: ['well', 'field', 'key', 'control'] },
]
const INKS = ['accent', 'success', 'warning', 'danger']

function Swatch({ color, className }: { color: string; className?: string }) {
  return (
    <span className={cn('relative block size-7 shrink-0 overflow-hidden rounded-md border border-line', className)}>
      {/* A checker shows through translucent tokens. */}
      <span className="absolute inset-0 bg-[repeating-conic-gradient(var(--color-line)_0_25%,transparent_0_50%)] bg-size-[8px_8px]" />
      <span className="absolute inset-0" style={{ background: color }} />
    </span>
  )
}

/** One value when both themes agree; "light → dark" (emphasized) when the mapping itself changes. */
function Mapping({ name }: { name: string }) {
  const tokens = useTokens()
  if (!tokens.bridge[`color-${name}`]) return <span className="font-mono text-[11px] text-fg-muted">derived from the theme</span>
  const light = describeValue(forMode(tokens.bridge[`color-${name}`]!, 'light'))
  const dark = describeValue(forMode(tokens.bridge[`color-${name}`]!, 'dark'))
  if (light === dark) return <span className="font-mono text-[11px] text-fg-muted">{light}</span>
  return (
    <span className="font-mono text-[11px] text-fg">
      {light} <span className="text-fg-muted">→</span> {dark} <span className="text-fg-muted">dark</span>
    </span>
  )
}

function Bridge() {
  const tokens = useTokens()
  return (
    <Section
      eyebrow="Roles"
      title="Roles"
      note={
        <>
          Components speak youj&apos;s roles (<code>bg-surface</code>, <code>text-fg-muted</code>). Each role resolves per theme scope and tone. Load
          order matters: one Tailwind entry that imports youj.css, then ui.css. An app that speaks shadcn adds the opt-in shadcn.css.
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2">
        {GROUPS.map((group) => (
          <Panel key={group.title} className="overflow-hidden">
            <div className="flex items-baseline justify-between gap-3 border-b border-line px-4 py-3">
              <h3 className="text-ui font-semibold text-fg">{group.title}</h3>
              <Mono className="text-[11px]">maps to</Mono>
            </div>
            {group.note && <p className="border-b border-line px-4 py-2.5 text-ui-sm text-fg-muted">{group.note}</p>}
            <ul className="divide-y divide-line">
              {group.names.map((name) => (
                <li key={name} className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
                  <Swatch color={`var(--color-${name})`} />
                  <span className="truncate font-mono text-[12px] text-fg">{name}</span>
                  <Mapping name={name} />
                </li>
              ))}
            </ul>
          </Panel>
        ))}
        <Panel className="overflow-hidden">
          <div className="border-b border-line px-4 py-3">
            <h3 className="text-ui font-semibold text-fg">Status inks</h3>
          </div>
          <p className="border-b border-line px-4 py-2.5 text-ui-sm text-fg-muted">
            Status colors pass AA on surfaces but not on their own 10% tints in light mode. A fifth of fg mixed back in fixes both themes at
            once: darker in light, brighter in dark.
          </p>
          <ul className="divide-y divide-line">
            {INKS.map((ink) => (
              <li key={ink} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-4 py-2">
                <span
                  className="w-fit rounded-full px-2 py-0.5 text-ui-sm font-medium"
                  style={{ background: `color-mix(in oklab, var(--color-${ink}) 10%, transparent)`, color: `var(--color-${ink}-text)` }}
                >
                  {ink}-text
                </span>
                <Mono className="text-[11px]">{describeValue(tokens.themeInline[`color-${ink}-text`] ?? '')}</Mono>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </Section>
  )
}

/* ── Contrast ───────────────────────────────────────────────────────────── */

const GRADE_TONE = {
  AAA: 'bg-success-subtle text-success-text ring-success-line',
  AA: 'bg-success-subtle text-success-text ring-success-line',
  'AA Large': 'bg-warning-subtle text-warning-text ring-warning-line',
  Fail: 'bg-danger-subtle text-danger-text ring-danger-line',
} as const

/** Text contrast on the WCAG scale, set in the status inks so the badge itself passes AA. */
function TextBadge({ ratio }: { ratio: number }) {
  const g = grade(ratio)
  return (
    <span className={cn('inline-flex h-5 items-center gap-1 rounded-full px-1.5 font-mono text-[10.5px] font-medium ring-1 ring-inset', GRADE_TONE[g])}>
      {ratio.toFixed(2)}
      <span className="font-sans font-semibold">{g}</span>
    </span>
  )
}

/** Non-text marks are graded against WCAG 1.4.11's 3:1, not the text scale. */
function BoundaryBadge({ ratio }: { ratio: number }) {
  const pass = ratio >= 3
  return (
    <span
      className={cn(
        'inline-flex h-5 items-center gap-1 rounded-full px-1.5 font-mono text-[10.5px] font-medium ring-1 ring-inset',
        pass ? 'bg-success-subtle text-success-text ring-success-line' : 'bg-danger-subtle text-danger-text ring-danger-line',
      )}
    >
      {ratio.toFixed(2)}
      <span className="font-sans font-semibold">{pass ? '≥ 3:1' : '< 3:1'}</span>
    </span>
  )
}

function Contrast() {
  const tokens = useTokens()
  return (
    <Section
      eyebrow="Contrast"
      title="Every pair, both themes, worst surface"
      note="Each text pair the roles introduce, composited over canvas, surface and raised; the badge is the lowest of the three. The same arithmetic runs in src/styles/ui-tokens.test.ts, which fails the build below 4.5:1 for text and 3:1 for control boundaries."
    >
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-2.5 font-mono text-[11px] font-medium tracking-wide text-fg-muted uppercase">Text on fill</th>
              <th className="px-4 py-2.5 font-mono text-[11px] font-medium tracking-wide text-fg-muted uppercase">Live</th>
              <th className="px-4 py-2.5 font-mono text-[11px] font-medium tracking-wide text-fg-muted uppercase">Light</th>
              <th className="px-4 py-2.5 font-mono text-[11px] font-medium tracking-wide text-fg-muted uppercase">Dark</th>
            </tr>
          </thead>
          <tbody>
            {TEXT_PAIRS.map(([text, fill], i) => (
              // TEXT_PAIRS repeats some pairs, so the pair alone is not a unique key.
              <tr key={`${text}${fill}${i}`} className="border-b border-line last:border-0">
                <td className="px-4 py-2 font-mono text-[12px] text-fg">
                  {describeValue(text)} <span className="text-fg-muted">on</span> {describeValue(fill)}
                </td>
                <td className="px-4 py-1.5">
                  <span className="inline-flex h-7 items-center rounded-md px-2.5 text-ui font-medium" style={{ background: fill, color: text }}>
                    Aa
                  </span>
                </td>
                <td className="px-4 py-1.5">
                  <TextBadge ratio={worstRatio(tokens, 'light', text, fill)} />
                </td>
                <td className="px-4 py-1.5">
                  <TextBadge ratio={worstRatio(tokens, 'dark', text, fill)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <tbody>
            {BOUNDARY_PAIRS.map(([what, mark, against]) => (
              <tr key={what} className="border-b border-line last:border-0">
                <td className="px-4 py-2 text-ui text-fg">{what}</td>
                <td className="px-4 py-2 font-mono text-[11px] text-fg-muted">
                  {describeValue(mark)} vs {describeValue(against)}
                </td>
                <td className="px-4 py-1.5">
                  <BoundaryBadge ratio={worstRatio(tokens, 'light', mark, against)} />
                </td>
                <td className="px-4 py-1.5">
                  <BoundaryBadge ratio={worstRatio(tokens, 'dark', mark, against)} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Section>
  )
}

/* ── Density, radius, type ─────────────────────────────────────────────── */

const DENSITY = [
  { size: 'xs', bracket: 'h-control-xs', fine: 24, coarse: 32, use: 'inline actions, input-group buttons' },
  { size: 'sm', bracket: 'h-control-sm', fine: 28, coarse: 36, use: 'dense toolbars, table rows' },
  { size: 'default', bracket: 'h-control', fine: 32, coarse: 40, use: 'the working control' },
  { size: 'lg', bracket: 'h-control-lg', fine: 40, coarse: 48, use: 'primary calls to action' },
] as const

function Density() {
  return (
    <Section
      eyebrow="Control size"
      title="Control heights"
      note="A 4px grid with a 32px default: one 20px line box plus 6px of padding each side, the pro-tool density of Linear and Vercel. Every size clears the 24px WCAG 2.5.8 target minimum. On coarse pointers every size steps up 8px (the default becomes 40px) without a prop; small boxes (checkbox, radio, switch, slider thumb) grow invisible hit areas instead of visible size."
    >
      <Panel className="grid gap-6 p-6 sm:grid-cols-4">
        {DENSITY.map((d) => (
          <div key={d.size} className="flex flex-col gap-3">
            <div className="flex h-control-lg items-end gap-2">
              <Button size={d.size} variant={d.size === 'default' ? 'default' : 'outline'}>
                {d.size === 'default' ? 'Default' : d.size.toUpperCase()}
              </Button>
              {/* A dimension bracket sized by the same token, so it follows touch too. */}
              <span aria-hidden className={cn('w-1.5 border-y border-e border-fg-subtle', d.bracket)} />
              <Mono className="pb-0.5 text-[11px] text-fg">{d.fine}</Mono>
            </div>
            <div className="flex flex-col gap-0.5">
              <Mono className="text-[11px] text-fg">{d.bracket}</Mono>
              <Mono className="text-[11px]">{d.coarse}px on touch</Mono>
              <span className="text-ui-xs text-fg-muted">{d.use}</span>
            </div>
          </div>
        ))}
      </Panel>
    </Section>
  )
}

const RADII = [
  { token: 'sm', px: 4, use: 'xs controls, checkbox' },
  { token: 'md', px: 6, use: 'the 32px control' },
  { token: 'lg', px: 8, use: 'lg controls, segmented track' },
  { token: 'xl', px: 12, use: 'cards, panels' },
  { token: '2xl', px: 16, use: 'dialogs, sheets' },
] as const

const TYPE = [
  { token: 'text-ui-lg', size: '14/20', use: 'lg controls, section titles', className: 'text-ui-lg' },
  { token: 'text-ui', size: '13/20', use: 'the working size', className: 'text-ui' },
  { token: 'text-ui-sm', size: '12/16', use: 'descriptions, badges, errors', className: 'text-ui-sm' },
  { token: 'text-ui-xs', size: '11/16', use: 'keycaps, captions', className: 'text-ui-xs' },
] as const

function RadiusAndType() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Section eyebrow="Radius" title="Concentric corners" note="6px on the default control, stepping with size. Nested corners subtract the padding: a 2px-padded track of 6px keys is 8px.">
        <Panel className="flex flex-wrap gap-5 p-5">
          {RADII.map((r) => (
            <div key={r.token} className="flex flex-col items-center gap-2">
              <div
                className="size-14 border border-line bg-band"
                style={{ borderRadius: `var(--radius-${r.token})` }}
              />
              <Mono className="text-[11px] text-fg">rounded-{r.token}</Mono>
              <Mono className="-mt-1.5 text-[10.5px]">{r.px}px</Mono>
            </div>
          ))}
        </Panel>
      </Section>
      <Section eyebrow="Type" title="UI sizes" note="Inter at 13px is the working size. Line heights stay on the 4px grid.">
        <Panel className="divide-y divide-line">
          {TYPE.map((t) => (
            <div key={t.token} className="flex items-baseline justify-between gap-4 px-4 py-2.5">
              <span className={cn(t.className, 'text-fg')}>Deploy to production</span>
              <span className="flex shrink-0 gap-3">
                <Mono className="text-[11px] text-fg">{t.token}</Mono>
                <Mono className="text-[11px]">{t.size}</Mono>
              </span>
            </div>
          ))}
        </Panel>
      </Section>
    </div>
  )
}

/* ── Focus and elevation ───────────────────────────────────────────────── */

function FocusAndElevation() {
  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <Section
        eyebrow="Focus"
        title="Two treatments, one spec"
        note="Discrete controls: a 2px accent outline offset 2px (focus-ring). An outline follows the radius, needs no knowledge of the surface behind it and survives forced-colors mode, where box-shadow rings vanish. Text fields are their own focus container: the border turns accent inside a 3px halo (focus-field). Tab through the live row."
      >
        <Panel className="flex flex-col gap-5 p-5">
          <div className="flex flex-wrap items-center gap-6">
            <span className="inline-flex h-control items-center rounded-md bg-accent px-3 text-ui font-medium text-on-accent outline-2 outline-offset-2 outline-focus outline-solid">
              focus-ring
            </span>
            <span className="inline-flex h-control w-44 items-center rounded-md border border-focus px-2.5 text-ui text-fg shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-focus)_22%,transparent)]">
              focus-field
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-4 border-t border-line pt-4">
            <Button variant="outline" size="sm">
              Button
            </Button>
            <Checkbox aria-label="Checkbox" defaultChecked />
            <Switch aria-label="Switch" defaultChecked />
            <Input aria-label="Input" placeholder="Input" className="w-40" />
          </div>
        </Panel>
      </Section>
      <Section
        eyebrow="Elevation"
        title="Four levels"
        note="Light: ink-tinted ambient and key shadows. Dark: shadows need far more opacity to register, and an inner top highlight does the work a shadow cannot on a dark page."
      >
        <Panel className="grid grid-cols-2 gap-5 bg-canvas p-5">
          {[
            { s: 'shadow-xs', use: 'thumbs, outline buttons' },
            { s: 'shadow-sm', use: 'cards, raised keys' },
            { s: 'shadow-md', use: 'popovers, menus' },
            { s: 'shadow-lg', use: 'dialogs, palettes' },
          ].map(({ s, use }) => (
            <div key={s} className={cn('flex h-20 flex-col justify-end rounded-lg border border-line bg-overlay p-3', s)}>
              <Mono className="text-[11px] text-fg">{s}</Mono>
              <span className="text-ui-xs text-fg-muted">{use}</span>
            </div>
          ))}
        </Panel>
      </Section>
    </div>
  )
}

/* ── Motion ────────────────────────────────────────────────────────────── */

const MOTION = [
  ['Button, Toggle', 'press: scale 0.97', 'in on instant, out on fast (standard)', 'no scale'],
  ['Checkbox', 'youj CheckIcon draw, box fill', 'slow stroke (emphasized) + settle spring; fill on fast', 'check appears whole'],
  ['Switch', 'thumb travel, press squeeze', "k.spring('snappy') on --thumb-t; squeeze in on instant", 'thumb jumps'],
  ['RadioGroup', 'dot scale', 'fast, enter in / exit out', 'dot appears'],
  ['Select', 'popup scale + fade', 'fast (enter) in, instant (exit) out; fade only when aligned to the trigger', 'fade only'],
  ['Progress', 'bar scaleX', "k.spring('smooth'); indeterminate sweep 2× deliberate", 'jumps; stripes'],
  ['Skeleton', 'light band', '3× deliberate loop: cross, then rest', 'still block'],
  ['Slider', 'thumb halo', 'fast (enter), transform + opacity', 'opacity only'],
  ['FieldError', 'arrival', '4px drop on fast (enter), leave on instant (exit)', 'fade only'],
  ['Spinner', 'LoaderRingIcon', 'constant turn, breathing arc; pauses offscreen', 'still quarter arc'],
  ['Avatar', 'image fade-in', 'base (standard)', 'instant'],
] as const

function Motion() {
  return (
    <Section
      eyebrow="Motion"
      title="Where each primitive moves"
      note="No component hard-codes timing: everything goes through useYouj() or the --yj-duration-* variables and ease-* curves, so the Speed toolbar reaches it all. Components set data-reduced-motion from useYouj(), which drives the reduced: variant in CSS; this follows the provider (including Motion: reduced / full), not just the OS media query."
    >
      <Panel className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-line">
              {['Primitive', 'What moves', 'Tokens', 'Reduced motion'].map((h) => (
                <th key={h} className="px-4 py-2.5 font-mono text-[11px] font-medium tracking-wide text-fg-muted uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOTION.map(([what, moves, timing, reduced]) => (
              <tr key={what} className="border-b border-line last:border-0 align-top">
                <td className="px-4 py-2.5 text-ui font-medium text-fg">{what}</td>
                <td className="px-4 py-2.5 text-ui text-fg-muted">{moves}</td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-fg-muted">{timing}</td>
                <td className="px-4 py-2.5 text-ui text-fg-muted">{reduced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </Section>
  )
}

export const Tokens: StoryObj = {
  render: () => (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-2 py-6">
      <header className="flex flex-col gap-3">
        <Eyebrow>UI Foundations</Eyebrow>
        <h1 className="text-[40px] leading-[1.1] font-semibold tracking-[-0.035em] text-fg">Tokens</h1>
        <p className="max-w-[68ch] text-[15px] leading-relaxed text-fg-muted">
          @youj/react builds on the colour roles youj.css derives from a theme, and adds what a
          component library needs on top: density, radius, type, focus and elevation. Everything below is read from the source (youj.css, ui.css and the theme
          derivation) and follows the Theme and Preset toolbars.
        </p>
        <pre className="w-fit rounded-lg border border-line bg-surface px-4 py-3 font-mono text-[12px] leading-relaxed text-fg">
          {`/* one Tailwind entry, in this order */\n@import '@youj/core/styles/youj.css';\n@import '@youj/react/styles/ui.css';`}
        </pre>
      </header>
      <Bridge />
      <Contrast />
      <Density />
      <RadiusAndType />
      <FocusAndElevation />
      <Motion />
    </div>
  ),
}
