import type { CSSProperties, ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { themeProps } from '../lib/youj/theme'

/* A sampler that paints every colour token and every text-on-surface pair the
 * library uses, with inline `var(--…)` so it needs no utility class. It is the
 * cheapest high-coverage pixel-diff: the token rename phases must not move a
 * pixel of it (scripts/codemods/pixel-diff.mjs shoots it in every preset).
 *
 * Each row is a fixed label and the token as `var(--…)` written out, so
 * scripts/codemods/token-rename.mjs rewrites the values with the rest of the
 * source while the labels, which are painted, stay put. It lists the CURRENT
 * names. When the roles land (token-audit/ARCHITECTURE.md 6.1) add a row per
 * role to these tables. */

type Fill = { label: string; value: string; texts?: Fill[] }
type Group = { title: string; fills: Fill[]; texts: Fill[] }

const v = (label: string, value: string): Fill => ({ label, value })

const NEUTRAL_TEXT = [v('fg', 'var(--color-fg)'), v('fg-muted', 'var(--color-fg-muted)'), v('fg-subtle', 'var(--color-fg-subtle)')]

const GROUPS: Group[] = [
  {
    title: 'Surfaces',
    fills: [
      v('canvas', 'var(--color-canvas)'),
      v('surface', 'var(--color-surface)'),
      v('yj-raised', 'var(--yj-raised)'),
      v('ui-paper', 'var(--yj-paper)'),
      v('popover', 'var(--color-overlay)'),
      v('bz-well', 'var(--color-well)'),
      v('bz-field', 'var(--color-field)'),
      v('bz-secondary', 'var(--color-control)'),
      v('bz-key', 'var(--color-key)'),
      v('bz-plate', 'var(--bz-plate)'),
      v('sidebar', 'var(--color-chrome)'),
    ],
    texts: NEUTRAL_TEXT,
  },
  {
    title: 'Tints over the surface',
    fills: [
      v('muted', 'var(--color-band)'),
      v('secondary', 'var(--color-hover)'),
      v('highlight', 'var(--color-hover)'),
      v('bz-band', 'var(--bz-band)'),
      v('ui-shimmer', 'var(--ui-shimmer)'),
      v('yj-dialog-dim', 'var(--yj-dialog-dim)'),
    ],
    texts: NEUTRAL_TEXT,
  },
  {
    title: 'Actions',
    fills: [
      v('accent', 'var(--color-accent)'),
      v('action', 'var(--color-action)'),
      v('destructive', 'var(--color-danger)'),
      v('success', 'var(--color-success)'),
      v('warning', 'var(--color-warning)'),
      v('danger', 'var(--color-danger)'),
    ],
    texts: [v('accent-contrast', 'var(--color-on-accent)'), v('action-foreground', 'var(--color-on-action)'), v('primary-foreground', 'var(--color-on-accent)')],
  },
  {
    title: 'Status ink on a 10% tint',
    fills: [
      v('accent tint', 'color-mix(in oklab, var(--color-accent) 10%, var(--color-surface))'),
      v('success tint', 'color-mix(in oklab, var(--color-success) 10%, var(--color-surface))'),
      v('warning tint', 'color-mix(in oklab, var(--color-warning) 10%, var(--color-surface))'),
      v('danger tint', 'color-mix(in oklab, var(--color-danger) 10%, var(--color-surface))'),
    ],
    texts: [v('accent-ink', 'var(--color-accent-text)'), v('success-ink', 'var(--color-success-text)'), v('warning-ink', 'var(--color-warning-text)'), v('danger-ink', 'var(--color-danger-text)')],
  },
  {
    title: 'Chart',
    fills: [
      v('chart-1', 'var(--color-chart-1)'),
      v('chart-2', 'var(--color-chart-2)'),
      v('chart-3', 'var(--color-chart-3)'),
      v('chart-4', 'var(--color-chart-4)'),
      v('chart-5', 'var(--color-chart-5)'),
      v('ui-mark-quiet', 'var(--color-chart-quiet)'),
    ],
    texts: [],
  },
]

const LINES: Fill[] = [
  v('line', 'var(--color-line)'),
  v('line-strong', 'var(--color-line-strong)'),
  v('border', 'var(--color-line)'),
  v('input', 'var(--color-line-control)'),
  v('ring', 'var(--color-focus)'),
  v('bz-field-edge', 'var(--color-line-control)'),
  v('bz-key-ring', 'var(--bz-key-ring)'),
  v('ui-shadow-color', 'var(--color-shadow)'),
]

const SHADOWS = [
  v('shadow-xs', 'var(--ui-shadow-xs)'),
  v('shadow-sm', 'var(--ui-shadow-sm)'),
  v('shadow-md', 'var(--ui-shadow-md)'),
  v('shadow-lg', 'var(--ui-shadow-lg)'),
]

const swatch: CSSProperties = { height: 56, borderRadius: 8, boxShadow: 'inset 0 0 0 1px var(--color-line)' }
const label: CSSProperties = { font: '500 11px/1.3 var(--font-mono)', color: 'var(--color-fg-muted)', wordBreak: 'break-all' }

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2 style={{ font: '600 13px/1 var(--font-sans)', color: 'var(--color-fg)', margin: '0 0 12px' }}>{title}</h2>
      {children}
    </section>
  )
}

function FillCard({ fill, texts: groupTexts }: { fill: Fill; texts: Fill[] }) {
  const texts = fill.texts ?? groupTexts
  return (
    <div style={{ display: 'grid', gap: 4 }}>
      <div style={{ ...swatch, background: fill.value, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 2, padding: '0 10px' }}>
        {texts.map((t) => (
          <span key={t.label} style={{ color: t.value, font: '500 12px/1.2 var(--font-sans)' }}>
            Aa {t.label}
          </span>
        ))}
      </div>
      <span style={label}>{fill.label}</span>
    </div>
  )
}

function RolesSampler() {
  return (
    <div style={{ background: 'var(--color-canvas)', color: 'var(--color-fg)', padding: 24, font: '14px/1.4 var(--font-sans)' }}>
      {GROUPS.map((group) => (
        <Section key={group.title} title={group.title}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {group.fills.map((fill) => (
              <FillCard key={fill.label} fill={fill} texts={group.texts} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="Lines, on the page and on a card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {LINES.map(({ label: name, value }) => (
            <div key={name} style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 56 }}>
                <div style={{ border: `2px solid ${value}`, borderRadius: 8, marginRight: 6 }} />
                <div style={{ border: `2px solid ${value}`, borderRadius: 8, background: 'var(--color-surface)' }} />
              </div>
              <span style={label}>{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Elevation">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20 }}>
          {SHADOWS.map(({ label: name, value }) => (
            <div key={name} style={{ display: 'grid', gap: 8, justifyItems: 'center' }}>
              <div style={{ width: 96, height: 64, borderRadius: 8, background: 'var(--color-surface)', boxShadow: value }} />
              <span style={label}>{name}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  )
}

/* The roles (youj.css section 3c), written as the role itself: `var(--color-<role>)`. A separate story, so the sampler above stays comparable
 * with the baseline taken before they existed. Each fill is shown with the text roles its matrix row holds to 4.5:1 (check.ts checkRoles). */
const role = (name: string, texts?: Fill[]): Fill => ({ label: name, value: `var(--color-${name})`, texts })

const ROLE_TEXT = [v('fg', 'var(--color-fg)'), v('fg-muted', 'var(--color-fg-muted)'), v('fg-subtle', 'var(--color-fg-subtle)')]
const KEY_TEXT = [v('fg', 'var(--color-fg)')]
const CONTROL_TEXT = [v('fg', 'var(--color-fg)'), v('fg-muted', 'var(--color-fg-muted)')]
const INKS = ['accent', 'success', 'warning', 'danger', 'info']

const ROLE_GROUPS: Group[] = [
  {
    title: 'Surfaces',
    fills: ['canvas', 'surface', 'overlay', 'well', 'field', 'chrome', 'chrome-float'].map((n) => role(n)),
    texts: ROLE_TEXT,
  },
  { title: 'Surfaces that carry less text', fills: [role('key'), role('inverse')], texts: KEY_TEXT },
  { title: 'Control', fills: [role('control')], texts: CONTROL_TEXT },
  {
    title: 'Tints over the card',
    fills: [role('hover'), role('selected', CONTROL_TEXT), role('band'), role('scrim', KEY_TEXT), role('line-subtle')],
    texts: ROLE_TEXT,
  },
  {
    title: 'Solid inks, with the text on them',
    fills: [...INKS.map((n) => role(n)), role('action')],
    texts: [v('on-accent', 'var(--color-on-accent)'), v('on-action', 'var(--color-on-action)')],
  },
  ...INKS.map((ink) => ({
    title: `${ink}: tint, line and text`,
    fills: [role(`${ink}-subtle`), role(`${ink}-line`, [])],
    texts: [v(`${ink}-text`, `var(--color-${ink}-text)`)],
  })),
  {
    title: 'Data',
    fills: [...[1, 2, 3, 4, 5].map((n) => role(`chart-${n}`)), role('chart-quiet')],
    texts: [],
  },
]

const ROLE_LINES: Fill[] = ['line-subtle', 'line', 'line-strong', 'line-control', 'focus', 'shadow'].map((n) => role(n))

/** A bar and a menu in each tone scope, on the page: with a two-tone theme (chrome held dark) the bar and what is inside it derive in dark. */
function ToneRow({ title, tone }: { title: string; tone: Parameters<typeof themeProps>[0] }) {
  const props = themeProps(tone)
  return (
    <Section title={title}>
      <div {...props} style={{ ...props.style, display: 'grid', gap: 12, background: 'var(--color-canvas)', padding: 16, borderRadius: 12 }}>
        {(['chrome', 'overlay', 'inverse'] as const).map((scope) => (
          <div
            key={scope}
            data-yj-tone={scope}
            style={{ background: `var(--color-${scope})`, color: 'var(--color-fg)', borderRadius: 8, padding: 12, boxShadow: 'inset 0 0 0 1px var(--color-line)', display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <span style={{ ...label, color: 'var(--color-fg-muted)' }}>tone {scope}</span>
            <span style={{ background: 'var(--color-control)', color: 'var(--color-fg)', borderRadius: 6, padding: '4px 10px', font: '500 12px/1.2 var(--font-sans)' }}>Control</span>
            <span style={{ background: 'var(--color-field)', color: 'var(--color-fg-subtle)', borderRadius: 6, padding: '4px 10px', boxShadow: 'inset 0 0 0 1px var(--color-line-control)', font: '500 12px/1.2 var(--font-sans)' }}>Field</span>
            <span style={{ background: 'var(--color-accent-subtle)', color: 'var(--color-accent-text)', borderRadius: 6, padding: '4px 10px', font: '500 12px/1.2 var(--font-sans)' }}>Accent</span>
            <span style={{ background: 'var(--color-selected)', color: 'var(--color-fg)', borderRadius: 6, padding: '4px 10px', font: '500 12px/1.2 var(--font-sans)' }}>Selected</span>
          </div>
        ))}
      </div>
    </Section>
  )
}

function NewRolesSampler() {
  return (
    <div style={{ background: 'var(--color-canvas)', color: 'var(--color-fg)', padding: 24, font: '14px/1.4 var(--font-sans)' }}>
      {ROLE_GROUPS.map((group) => (
        <Section key={group.title} title={group.title}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {group.fills.map((fill) => (
              <FillCard key={fill.label} fill={fill} texts={group.texts} />
            ))}
          </div>
        </Section>
      ))}

      <Section title="Lines, on the page and on a card">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
          {ROLE_LINES.map(({ label: name, value }) => (
            <div key={name} style={{ display: 'grid', gap: 4 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 56 }}>
                <div style={{ border: `2px solid ${value}`, borderRadius: 8, marginRight: 6 }} />
                <div style={{ border: `2px solid ${value}`, borderRadius: 8, background: 'var(--color-surface)' }} />
              </div>
              <span style={label}>{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <ToneRow title="Tone scopes, defaults (every scope is the page's own, the inverse its opposite)" tone={{}} />
      <ToneRow title="Tone scopes, chrome held dark (overlays follow the page)" tone={{ tone: { chrome: 'dark' } }} />
      <ToneRow title="Tone scopes, chrome held dark, overlays follow it" tone={{ tone: { chrome: 'dark', overlays: 'chrome' } }} />
    </div>
  )
}

const meta: Meta = {
  title: 'Foundations/Roles',
  parameters: { layout: 'fullscreen' },
}
export default meta

export const Sampler: StoryObj = { render: () => <RolesSampler /> }

export const NewRoles: StoryObj = { render: () => <NewRolesSampler /> }
