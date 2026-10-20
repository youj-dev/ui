import { useState, type ComponentProps } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ShareIcon } from '@youj/icons/components/youj/icons/share'
import { Button } from './button'
import { ShareDialog, type ShareAccess, type SharePerson, type ShareSuggestion } from './share-dialog'

const meta: Meta<typeof ShareDialog> = {
  title: 'UI/Overlays/Share Dialog',
  component: ShareDialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Share one thing with people and by link, Google-Drive style. An invite field takes emails and picks from suggestions as chips (invalid addresses stay flagged and block Send), with a role and an optional message; “People with access” scrolls inside a fixed height, with the owner fixed and pending invitations resendable or cancellable; General access sets Restricted, Anyone at the organization or Anyone with the link, each with a role; Copy link confirms with Copied. Every action is awaited and fails on its own row with the dialog still open. Focus opens in the invite field; invites sent, access removed, role and access changes and the copied link are announced.',
      },
    },
  },
  argTypes: { readOnly: { control: 'boolean' }, loading: { control: 'boolean' } },
  args: { readOnly: false, loading: false },
}
export default meta
type Story = StoryObj<typeof ShareDialog>

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const everyone: SharePerson[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@acme.com', role: 'editor', owner: true },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.com', role: 'editor' },
  { id: 'alan', name: 'Alan Turing', email: 'alan@acme.com', role: 'commenter' },
  { id: 'mary', name: 'Mary Jackson', email: 'mary@partner.io', role: 'viewer', pending: true },
]

const suggestions: ShareSuggestion[] = [
  { id: 'katherine', name: 'Katherine Johnson', email: 'katherine@acme.com' },
  { id: 'margaret', name: 'Margaret Hamilton', email: 'margaret@acme.com' },
  { id: 'dorothy', name: 'Dorothy Vaughan', email: 'dorothy@acme.com' },
  { id: 'design', name: 'Design team', members: 12 },
  { id: 'eng', name: 'Engineering', members: 48 },
]

const trigger = (
  <Button variant="outline">
    <ShareIcon />
    Share
  </Button>
)

/** A shared document: the app owns the list, and each handler updates it after its work. */
function Stateful(props: Partial<ComponentProps<typeof ShareDialog>> & { initial?: SharePerson[]; failures?: boolean }) {
  const { initial = everyone, failures, ...rest } = props
  const [people, setPeople] = useState(initial)
  const [access, setAccess] = useState<ShareAccess>(props.defaultAccess ?? { scope: 'restricted', role: 'viewer' })
  return (
    <ShareDialog
      trigger={trigger}
      resource="Q3 roadmap"
      link="https://acme.test/docs/q3-roadmap"
      organization="Acme"
      people={people}
      suggestions={suggestions}
      access={access}
      onAccessChange={async (next) => {
        await wait(500)
        if (failures) throw new Error('Your admin turned off public links.')
        setAccess(next)
      }}
      onInvite={async ({ recipients, role }) => {
        await wait(800)
        if (failures) throw new Error('You can only invite 5 people at a time.')
        setPeople((current) => [
          ...current,
          ...recipients.map((r, i) => ({ id: `${r.id ?? r.email}-${current.length + i}`, name: r.name, email: r.email, role, pending: true })),
        ])
      }}
      onRoleChange={async (person, role) => {
        await wait(400)
        if (failures) throw new Error('Only the owner can change roles.')
        setPeople((current) => current.map((p) => (p.id === person.id ? { ...p, role } : p)))
      }}
      onRemove={async (person) => {
        await wait(400)
        if (failures) throw new Error('Only the owner can remove people.')
        setPeople((current) => current.filter((p) => p.id !== person.id))
      }}
      onResend={() => wait(600)}
      {...rest}
    />
  )
}

/** Every prop as a control. */
export const Playground: Story = {
  render: (args) => <Stateful {...args} />,
}

/** Mixed roles, one pending invitation, a person and a group among the suggestions. */
export const ShareADocument: Story = {
  name: 'Share a document',
  render: (args) => <Stateful {...args} />,
}

/** Anyone at the company with the link can comment; no one outside can open it. */
export const OrganizationLink: Story = {
  name: 'Organization link',
  render: (args) => <Stateful {...args} defaultAccess={{ scope: 'organization', role: 'commenter' }} initial={everyone.slice(0, 2)} />,
}

/** A viewer sees who has access and can copy the link, and can change nothing. */
export const ReadOnlyViewer: Story = {
  name: 'Read-only viewer',
  args: { readOnly: true },
  render: (args) => (
    <Stateful {...args} defaultAccess={{ scope: 'organization', role: 'viewer' }} initial={[...everyone.slice(0, 3), { id: 'you', name: 'You', email: 'you@acme.com', role: 'viewer' }]} />
  ),
}

/** A card for the thing being shared sits above the invite field, and general access is the compact switches layout. */
export const WithPreview: Story = {
  name: 'Share with a preview',
  render: (args) => (
    <Stateful
      {...args}
      accessLayout="switches"
      preview={{ title: 'Q3 roadmap.pdf', description: 'Updated 2 days ago · 3.4 MB' }}
      initial={everyone.slice(0, 3)}
    />
  ),
}

/** Skeleton rows keep the people area's size while the list loads. */
export const Loading: Story = {
  args: { loading: true },
  render: (args) => <Stateful {...args} />,
}

/** Every action rejects: each message shows on its own row or setting and the dialog stays open. */
export const Failures: Story = {
  render: (args) => <Stateful {...args} failures />,
}

/** Many people scroll inside the fixed height, so the dialog never grows. */
export const ManyPeople: Story = {
  name: 'Many people',
  render: (args) => (
    <Stateful
      {...args}
      initial={[
        everyone[0]!,
        ...Array.from({ length: 24 }, (_, i): SharePerson => ({
          id: `p${i}`,
          name: `Teammate ${i + 1}`,
          email: `teammate${i + 1}@acme.com`,
          role: i % 3 === 0 ? 'editor' : i % 3 === 1 ? 'commenter' : 'viewer',
          pending: i % 8 === 7,
        })),
      ]}
    />
  ),
}
