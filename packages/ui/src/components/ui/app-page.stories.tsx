import type { Meta, StoryObj } from '@storybook/react-vite'
import { DownloadIcon, PlusIcon } from '@youj/icons'
import { AppPage } from './app-page'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { Field, FieldGroup, FieldLabel } from './field'
import { Input } from './input'

const meta: Meta<typeof AppPage> = {
  title: 'UI/Navigation/AppPage',
  component: AppPage,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A page inside an app’s frame: the title, a line under it and the actions at the end, over the page’s sections on one gutter, so every page of the app starts at the same place. `width` sets how far the body runs: `page` (1280px at 100% scale, centered on a wider screen), `fill` for a dashboard, table, board or canvas, and `readable` (1024px, centered) for a page that is one form, such as settings; pages of tables, cards and lists fill. Under a top bar that already names the page, AppFrame folds the title to screen readers.',
      },
    },
  },
  args: {
    title: 'Capacity',
    description: 'Forecast demand against what you have provisioned.',
    actions: (
      <>
        <Button variant="outline">
          <DownloadIcon size={16} /> Export
        </Button>
        <Button>
          <PlusIcon size={16} /> Request quota
        </Button>
      </>
    ),
  },
}
export default meta
type Story = StoryObj<typeof AppPage>

const panels = (
  <div className="grid gap-4 @3xl:grid-cols-3 @3xl:gap-5">
    {['Requests', 'Replicas', 'Headroom'].map((label) => (
      <Card key={label}>
        <CardHeader>
          <CardTitle>{label}</CardTitle>
          <CardDescription>This week</CardDescription>
        </CardHeader>
        <CardContent className="h-24" />
      </Card>
    ))}
  </div>
)

export const Default: Story = { args: { children: panels } }

export const Fill: Story = {
  parameters: { docs: { description: { story: '`width="fill"` takes the whole width: dashboards, tables, boards and canvases.' } } },
  args: { width: 'fill', children: panels },
}

export const Readable: Story = {
  parameters: { docs: { description: { story: '`width="readable"` stops at 1024px and centers in the content area: a page that is one form, whose lines stay easy to follow.' } } },
  args: {
    title: 'Settings',
    description: 'Manage your profile and workspace.',
    actions: undefined,
    width: 'readable',
    children: (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="page-name">Name</FieldLabel>
              <Input id="page-name" defaultValue="Ada Lovelace" />
            </Field>
            <Field>
              <FieldLabel htmlFor="page-email">Email</FieldLabel>
              <Input id="page-email" type="email" defaultValue="ada@example.com" />
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>
    ),
  },
}
