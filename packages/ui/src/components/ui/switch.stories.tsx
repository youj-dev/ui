import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider, ThemeScope } from '@youj/core/lib/youj/provider'
import { Specimen } from '../../stories/kit'
import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from './field'
import { Label } from './label'
import { Switch } from './switch'

const meta: Meta<typeof Switch> = {
  title: 'UI/Primitives/Switch',
  component: Switch,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI switch (role="switch"). The thumb travels on k.spring(\'snappy\'): the spring drives a single --thumb-t value that CSS turns into one thumb-width of translate, negated under RTL, so toggling mid-flight retargets without a jump. Pressing squeezes the thumb; the track color crossfades on the fast token. Off is a page-colored thumb on an fg-subtle track, on is the same thumb on the accent: both clear 3:1 against the track and the page. Space toggles. Use it for settings that apply immediately; use a Checkbox for values a form submits.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    variant: { control: 'inline-radio', options: ['default', 'liquid'] },
  },
  args: { defaultChecked: true, size: 'default', variant: 'default' },
}
export default meta
type Story = StoryObj<typeof Switch>

const rows = [
  { id: 'push', label: 'Push notifications', desc: 'On this device, for mentions and assignments.', on: true },
  { id: 'digest', label: 'Weekly digest', desc: 'A Monday summary of what changed in your projects.', on: false },
  { id: 'sounds', label: 'Sounds', desc: 'A soft tick when something needs you.', on: true },
  { id: 'beta', label: 'Early access', desc: 'Try features before they ship. Things may break.', on: false },
]

function Preferences({ variant }: { variant?: 'default' | 'liquid' }) {
  const [state, setState] = useState(() => Object.fromEntries(rows.map((r) => [r.id, r.on])))
  return (
    <FieldGroup className="w-full max-w-[440px] gap-0 divide-y divide-line rounded-xl border border-line bg-surface">
      {rows.map((r) => (
        <Field key={r.id} orientation="horizontal" className="px-4 py-3.5">
          <FieldContent>
            <FieldLabel>{r.label}</FieldLabel>
            <FieldDescription>{r.desc}</FieldDescription>
          </FieldContent>
          <Switch variant={variant} checked={state[r.id]} onCheckedChange={(next) => setState((s) => ({ ...s, [r.id]: next }))} />
        </Field>
      ))}
    </FieldGroup>
  )
}

/** A settings list: what it does on the left, the control on the right. Toggle rapidly to feel the retargeting. */
export const Hero: Story = {
  render: () => <Preferences />,
}

export const Playground: Story = {
  render: (args) => (
    <div className="flex items-center gap-2.5">
      <Switch id="sw-playground" {...args} />
      <Label htmlFor="sw-playground">Airplane mode</Label>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="grid grid-cols-3 gap-x-10 gap-y-6">
      <Specimen label="off">
        <Switch aria-label="Off" />
      </Specimen>
      <Specimen label="on">
        <Switch aria-label="On" defaultChecked />
      </Specimen>
      <Specimen label="small">
        <div className="flex gap-3">
          <Switch aria-label="Small off" size="sm" />
          <Switch aria-label="Small on" size="sm" defaultChecked />
        </div>
      </Specimen>
      <Specimen label="disabled off">
        <Switch aria-label="Disabled off" disabled />
      </Specimen>
      <Specimen label="disabled on">
        <Switch aria-label="Disabled on" disabled defaultChecked />
      </Specimen>
      <Specimen label="read-only on">
        <Switch aria-label="Read only" readOnly defaultChecked />
      </Specimen>
    </div>
  ),
}

/** Under dir="rtl" the thumb rests on the right and travels left: the direction is declarative CSS. */
export const RightToLeft: Story = {
  render: () => (
    <ThemeScope dir="rtl">
      <div dir="rtl" className="flex items-center gap-2.5">
        <Switch id="sw-rtl" defaultChecked />
        <Label htmlFor="sw-rtl">الإشعارات</Label>
      </div>
    </ThemeScope>
  ),
}

/** Reduced motion: the thumb jumps, no squeeze; color still changes. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <Preferences />
    </YoujProvider>
  ),
}

/** The liquid switch: a glass droplet that stretches as it travels, overshoots and settles, and pours the accent into the track behind it. */
export const LiquidPlayground: Story = {
  name: 'Liquid: Playground',
  args: { variant: 'liquid' },
  render: (args) => (
    <div className="flex items-center gap-2.5">
      <Switch id="sw-liquid" {...args} />
      <Label htmlFor="sw-liquid">Low power mode</Label>
    </div>
  ),
}

/** The same settings list with liquid switches. Toggle rapidly: the spring retargets from wherever the droplet is. */
export const LiquidSettingsList: Story = {
  name: 'Liquid: Settings list',
  render: () => <Preferences variant="liquid" />,
}

export const LiquidSizes: Story = {
  name: 'Liquid: Sizes',
  render: () => (
    <div className="grid grid-cols-3 gap-x-10 gap-y-6">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Specimen key={size} label={size}>
          <div className="flex gap-3">
            <Switch variant="liquid" size={size} aria-label={`${size} off`} />
            <Switch variant="liquid" size={size} aria-label={`${size} on`} defaultChecked />
          </div>
        </Specimen>
      ))}
      <Specimen label="disabled off">
        <Switch variant="liquid" aria-label="Disabled off" disabled />
      </Specimen>
      <Specimen label="disabled on">
        <Switch variant="liquid" aria-label="Disabled on" disabled defaultChecked />
      </Specimen>
      <Specimen label="right to left">
        <ThemeScope dir="rtl">
          <div dir="rtl">
            <Switch variant="liquid" aria-label="RTL" defaultChecked />
          </div>
        </ThemeScope>
      </Specimen>
    </div>
  ),
}

/** Reduced motion: the plain switch's motion. The droplet jumps to its end, doesn't stretch or swell, and the fill fills at once. */
export const LiquidReducedMotion: Story = {
  name: 'Liquid: Reduced motion',
  render: () => (
    <YoujProvider reducedMotion="always">
      <Preferences variant="liquid" />
    </YoujProvider>
  ),
}
