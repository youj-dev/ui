import type { Meta, StoryObj } from '@storybook/react-vite'
import { Specimen } from '../../stories/kit'
import { Field, FieldDescription, FieldError, FieldLabel } from './field'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from './select'

const meta: Meta<typeof Select> = {
  title: 'UI/Primitives/Select',
  component: Select,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Base UI select: typeahead, Home/End, and by default the macOS-style popup that lines the selected item up over the trigger. The popup scales in from its transform origin on the enter curve (fast token) and leaves on the instant exit; lined up over the trigger it only fades, because growing out of the item you are looking at reads as a jump. The chevron (youj ChevronDown) turns over with the open state. The trigger shares Input\'s border, hover and focus halo. Reduced motion: fades only.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Select>

const regions = {
  Americas: [
    { value: 'iad1', label: 'Washington, D.C.', code: 'iad1' },
    { value: 'sfo1', label: 'San Francisco', code: 'sfo1' },
    { value: 'gru1', label: 'São Paulo', code: 'gru1' },
  ],
  Europe: [
    { value: 'fra1', label: 'Frankfurt', code: 'fra1' },
    { value: 'cdg1', label: 'Paris', code: 'cdg1' },
    { value: 'arn1', label: 'Stockholm', code: 'arn1' },
  ],
  'Asia Pacific': [
    { value: 'hnd1', label: 'Tokyo', code: 'hnd1' },
    { value: 'sin1', label: 'Singapore', code: 'sin1' },
    { value: 'syd1', label: 'Sydney', code: 'syd1' },
  ],
}
const allRegions = Object.values(regions).flat()
const regionItems = Object.fromEntries(allRegions.map((r) => [r.value, r.label]))

function RegionSelect() {
  return (
    <Field className="w-72">
      <FieldLabel>Function region</FieldLabel>
      <Select items={regionItems} defaultValue="fra1">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(regions).map(([group, items], i) => (
            <SelectGroup key={group}>
              {i > 0 && <SelectSeparator />}
              <SelectLabel>{group}</SelectLabel>
              {items.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {/* The space keeps the option's name "Frankfurt fra1", not "Frankfurtfra1". */}
                  {r.label}{' '}
                  <span className="ms-auto font-mono text-ui-xs text-fg-muted">{r.code}</span>
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
      <FieldDescription>Closest to your database. Changing it redeploys.</FieldDescription>
    </Field>
  )
}

/** Grouped, with trailing detail. Open with the mouse, or focus and press Space/Enter/↓, then type to jump. */
export const Hero: Story = {
  render: () => <RegionSelect />,
}

const roles = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'billing', label: 'Billing (disabled)', disabled: true },
]

export const States: Story = {
  render: () => (
    <div className="grid w-full max-w-[560px] grid-cols-2 gap-x-6 gap-y-6">
      <Specimen label="placeholder">
        <Select items={roles}>
          <SelectTrigger aria-label="Role" className="w-full">
            <SelectValue placeholder="Choose a role" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value} disabled={r.disabled}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Specimen>
      <Specimen label="small, dropdown (not aligned to the trigger)">
        <Select items={roles} defaultValue="member">
          <SelectTrigger aria-label="Role" size="sm" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value} disabled={r.disabled}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Specimen>
      <Specimen label="disabled">
        <Select items={roles} defaultValue="owner" disabled>
          <SelectTrigger aria-label="Role" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Specimen>
      <Specimen label="ghost, small, no chevron (a dense row)">
        <Select items={roles} defaultValue="member">
          <SelectTrigger aria-label="Role" variant="ghost" size="sm" hideIcon>
            <SelectValue />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false}>
            {roles.map((r) => (
              <SelectItem key={r.value} value={r.value} disabled={r.disabled}>
                {r.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Specimen>
      <Specimen label="invalid, in a field">
        <Field invalid>
          <Select items={roles}>
            <SelectTrigger aria-label="Role" className="w-full">
              <SelectValue placeholder="Choose a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldError>Pick a role before sending the invite.</FieldError>
        </Field>
      </Specimen>
    </div>
  ),
}

const timezones = Intl.supportedValuesOf?.('timeZone') ?? ['UTC', 'Europe/Berlin', 'America/New_York']

/** A long list: the popup caps at the available height and grows scroll arrows. */
export const LongList: Story = {
  render: () => (
    <Field className="w-72">
      <FieldLabel>Time zone</FieldLabel>
      <Select defaultValue="Europe/Berlin">
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {timezones.map((tz) => (
            <SelectItem key={tz} value={tz}>
              {tz.replaceAll('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  ),
}
