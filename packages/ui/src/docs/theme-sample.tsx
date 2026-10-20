'use client'

import type { ReactNode } from 'react'
import { ThemeScope, type Theme, type ThemeInput } from '@youj/core'
import { MeshGradient } from '@youj/motion/backgrounds'
import { Avatar, AvatarFallback } from '../components/ui/avatar'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card'
import { Field, FieldContent, FieldDescription, FieldLabel } from '../components/ui/field'
import { Input } from '../components/ui/input'
import { Switch } from '../components/ui/switch'
import { cn } from '../lib/utils'

/* Shared by the Foundations/Themes stories and the docs site's Theming page:
 * a small product moment to preview a theme on, and preset cards.
 *
 * The sample avoids the components that style themselves with Tailwind's
 * `dark:` variant (tabs, segmented toggles, tooltips…). That variant matches
 * any dark ancestor, so they would render wrongly in a light preview pane
 * placed inside a dark page. */

const PEOPLE = [
  { name: 'Ada Lovelace', email: 'ada@acme.com', initials: 'AL', status: 'Owner', tone: 'default' },
  { name: 'Grace Hopper', email: 'grace@acme.com', initials: 'GH', status: 'Active', tone: 'success' },
  { name: 'Alan Turing', email: 'alan@acme.com', initials: 'AT', status: 'Invited', tone: 'warning' },
] as const

/** `'Inter Variable', ui-sans-serif…` → `Inter`. */
export function firstFamily(stack: string | undefined): string {
  return (stack ?? '').split(',')[0]!.replace(/['"]/g, '').replace(/ Variable$/, '').trim()
}

/** A theme's lines in a few words: `1px hairline`, `2px ink`. */
export function strokeSpec(theme: Theme): string {
  const width = theme.stroke?.width ?? 1
  const ink = theme.stroke?.ink ?? 0
  return `${width}px ${ink >= 0.5 ? 'ink' : 'hairline'}`
}

/**
 * A product moment built from the UI kit: a deployment preview, an invite
 * form and a member list. `wide` sets the form and the list side by side.
 */
export function ThemeSample({ className, wide = false }: { className?: string; wide?: boolean }) {
  return (
    <div className={cn('grid gap-3 bg-canvas p-4 font-sans text-fg', wide && 'md:grid-cols-2', className)}>
      <div className={cn('relative h-28 overflow-hidden rounded-xl border border-line bg-band', wide && 'md:col-span-2')}>
        <MeshGradient className="absolute inset-0" interactive={false} intensity={1.25} />
        <span className="absolute start-3 bottom-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface/90 youj-allow-glass px-2 py-1 font-mono text-ui-xs text-fg backdrop-blur-sm">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          orion.acme.dev
        </span>
      </div>
      <Card size="sm">
        <CardHeader>
          <CardTitle>Invite your team</CardTitle>
          <CardDescription>They get every project in Acme.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Field>
            <FieldLabel>Email</FieldLabel>
            <Input defaultValue="grace@acme.com" />
          </Field>
          <Field orientation="horizontal">
            <FieldContent>
              <FieldLabel>Admin access</FieldLabel>
              <FieldDescription>Deploys and billing.</FieldDescription>
            </FieldContent>
            <Switch defaultChecked />
          </Field>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button variant="ghost">Cancel</Button>
          <Button>Send invite</Button>
        </CardFooter>
      </Card>
      <ul className="h-fit divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
        {PEOPLE.map((p) => (
          <li key={p.email} className="flex items-center gap-3 px-3 py-2.5">
            <Avatar size="sm">
              <AvatarFallback>{p.initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="truncate text-ui font-medium text-fg">{p.name}</div>
              <div className="truncate text-ui-sm text-fg-subtle">{p.email}</div>
            </div>
            <Badge variant={p.tone}>{p.status}</Badge>
          </li>
        ))}
      </ul>
    </div>
  )
}

const SWATCHES = ['canvas', 'surface', 'well', 'line', 'fg-subtle', 'fg', 'accent', 'success', 'warning', 'danger'] as const
const SWATCH_CLASS: Record<(typeof SWATCHES)[number], string> = {
  canvas: 'bg-canvas',
  surface: 'bg-surface',
  well: 'bg-well',
  line: 'bg-line',
  'fg-subtle': 'bg-fg-subtle',
  fg: 'bg-fg',
  accent: 'bg-accent',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
}

/** The theme's palette as a strip of chips, from the page to the status colors. */
export function Swatches({ className }: { className?: string }) {
  return (
    <div role="img" aria-label="Palette: surfaces, lines, text, accent and status colors" className={cn('flex h-7 overflow-hidden rounded-md border border-line', className)}>
      {SWATCHES.map((s) => (
        <span key={s} title={s} className={cn('flex-1', SWATCH_CLASS[s])} />
      ))}
    </div>
  )
}

function Spec({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-ui-xs text-fg-muted">{term}</dt>
      <dd className="font-mono text-ui-sm text-fg">{children}</dd>
    </div>
  )
}

/** One preset, rendered in itself: name, personality, spec, palette and a sample. */
export function PresetCard({ theme, sample = false, className }: { theme: Theme; sample?: boolean; className?: string }) {
  return (
    <ThemeScope theme={theme}>
      <section className={cn('flex flex-col overflow-hidden rounded-xl border border-line bg-canvas text-fg', className)}>
        <div className="flex flex-col gap-4 p-5">
          <div className="flex flex-col gap-1">
            <code className="font-mono text-ui-xs text-fg-muted">data-yj-theme=&quot;{theme.id}&quot;</code>
            <p className="text-[20px] leading-tight font-semibold tracking-tight">{theme.name}</p>
            <p className="text-ui text-fg-muted">{theme.description}</p>
          </div>
          <Swatches />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
            <Spec term="Radius">{theme.radius}</Spec>
            <Spec term="Control size">{theme.controlSize}</Spec>
            <Spec term="Motion">{theme.motionPersonality}</Spec>
            <Spec term="Type">{firstFamily(theme.fonts?.sans)}</Spec>
            <Spec term="Stroke">{strokeSpec(theme)}</Spec>
            <Spec term="Shadow">{theme.shadow ?? 'soft'}</Spec>
          </dl>
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm">Deploy</Button>
            <Button size="sm" variant="outline">
              Preview
            </Button>
            <Badge variant="success">Ready</Badge>
            <Badge variant="warning">Queued</Badge>
          </div>
        </div>
        {sample && <ThemeSample className="border-t border-line" />}
      </section>
    </ThemeScope>
  )
}

/** Every preset as a card, for the docs. The first, the default, spans the row. */
export function PresetCards({ themes, className }: { themes: readonly ThemeInput[]; className?: string }) {
  return (
    <div className={cn('grid gap-4 sm:grid-cols-2', className)}>
      {themes.map((t, i) => (
        <PresetCard key={t.id} theme={t} className={cn(i === 0 && 'sm:col-span-2')} />
      ))}
    </div>
  )
}
