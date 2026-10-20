import type { Meta, StoryObj } from '@storybook/react-vite'
import { DownloadIcon, PlusIcon } from '@youj/icons'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Field, FieldGroup, FieldLabel } from '../../components/ui/field'
import { Input } from '../../components/ui/input'
import { Stat, StatDelta, StatGroup, StatValue } from '../../components/ui/stat-card'
import { DEFAULT_FRAME } from '../../docs/create/config'
import { FramePreview } from '../../docs/create/render'
import { EventTimeline } from '../app/event-timeline'

const meta: Meta<typeof FramePreview> = {
  title: 'Blocks/Frame/Shell',
  component: FramePreview,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Build your app around a shared layout for the sidebar, top bar and page content.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof FramePreview>

export const Default: Story = {
  name: 'Default',
  args: {},
}

export const TabBar: Story = {
  name: 'Phone tab bar',
  args: { config: { ...DEFAULT_FRAME, mobile: 'tabs' } },
}

export const Logo: Story = {
  name: 'With a logo',
  args: { config: { ...DEFAULT_FRAME, brand: 'logo', upgrade: false } },
}

const FIGURES = [
  { label: 'Requests', value: 4_820_000, previous: 4_610_000 },
  { label: 'Replicas', value: 9, previous: 8 },
  { label: 'Headroom', value: 0.31, previous: 0.38, percent: true },
  { label: 'Open incidents', value: 2, previous: 3, invert: true },
]

/** A page of your own in AppPage: its header, the figures (two to a row, four with room), a form beside a list, and an embedded block at its natural width. */
function OwnPage() {
  return (
    <AppPage
      title="Capacity"
      description="Forecast demand against what you have provisioned."
      actions={
        <>
          <Button variant="outline">
            <DownloadIcon size={16} strokeWidth={1.75} /> Export
          </Button>
          <Button>
            <PlusIcon size={16} strokeWidth={1.75} /> Request quota
          </Button>
        </>
      }
    >
      <StatGroup aria-label="This week" className="grid-cols-2 @4xl:grid-cols-4">
        {FIGURES.map((f) => (
          <Stat key={f.label} label={f.label}>
            <StatValue value={f.value} from={f.value} format={f.percent ? { style: 'percent' } : undefined} />
            <StatDelta value={(f.value - f.previous) / f.previous} invert={f.invert}>
              vs. last week
            </StatDelta>
          </Stat>
        ))}
      </StatGroup>
      <div className="grid grid-cols-1 gap-4 @4xl:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] @3xl:gap-5">
        <Card>
          <CardHeader>
            <CardTitle>Assumptions</CardTitle>
            <CardDescription>What the forecast is built from.</CardDescription>
          </CardHeader>
          <CardContent>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="own-service">Service</FieldLabel>
                <Input id="own-service" defaultValue="checkout-api" />
              </Field>
              <Field>
                <FieldLabel htmlFor="own-replicas">Replicas</FieldLabel>
                <Input id="own-replicas" type="number" defaultValue={9} />
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Regions</CardTitle>
            <CardDescription>Where the load lands.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-line">
              {['eu-central-1', 'us-east-2', 'ap-southeast-1'].map((region, i) => (
                <li key={region} className="flex min-h-(--ui--row) items-center justify-between gap-3 text-ui">
                  <span className="font-mono text-fg">{region}</span>
                  <span className="text-fg-muted tabular-nums">{[2.4, 2, 1.1][i]}K req/s</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
      {/* An embedded block stops at its natural width; `fill` would take the row. */}
      <EventTimeline embedded />
    </AppPage>
  )
}

export const YourOwnPage: Story = {
  name: 'Your own page',
  parameters: {
    docs: {
      description: {
        story:
          'A page of your own in `AppPage`: the frame pages’ density, container and gutter, the title, description and actions, and the page width past which a wide screen gets margins (`width="fill"` to span, `width="readable"` for a form). The figures go from two to four a row by the page’s own width, and the embedded block stops at its natural width.',
      },
    },
  },
  args: { children: <OwnPage /> },
}
