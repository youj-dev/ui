import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { Button } from './button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card'
import { AvatarStack, type AvatarStackProps, type AvatarStackUser, type Presence } from './avatar-stack'

const meta: Meta<AvatarStackProps> = {
  title: 'UI/Display/Avatar group',
  component: AvatarStack,
  excludeStories: ['team'],
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Who is here: overlapping avatars (the Avatar primitives), the first `max` shown and the rest behind a "+N" that opens the full list in a Popover, with each person\'s role and status. Hovering fans the stack out a few px and lifts the avatar under the pointer above its neighbors (transform only, fast token), with the name in a tooltip; a presence dot pops in when a status changes. The stack is a group named with everyone in it, and "+N" is a button. Sizes follow the Avatar sizes. Reduced motion: no fan or lift; dots appear.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
    max: { control: { type: 'range', min: 1, max: 8, step: 1 } },
  },
  args: { size: 'default', max: 4, label: 'Collaborators' },
}
export default meta
type Story = StoryObj<AvatarStackProps>

/** An offline, generated portrait (the same style as the Avatar stories). */
function portrait(hueA: number, hueB: number) {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='hsl(${hueA} 70% 62%)'/><stop offset='1' stop-color='hsl(${hueB} 70% 42%)'/></linearGradient></defs><rect width='64' height='64' fill='url(#g)'/><circle cx='32' cy='26' r='11' fill='white' fill-opacity='.85'/><path d='M12 60c3-12 12-18 20-18s17 6 20 18z' fill='white' fill-opacity='.85'/></svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

export const team: AvatarStackUser[] = [
  { id: 'mira', name: 'Mira Chen', src: portrait(230, 262), presence: 'online', description: 'Design lead · Editing' },
  { id: 'jonas', name: 'Jonas Weber', src: portrait(160, 200), presence: 'online', description: 'Frontend' },
  { id: 'priya', name: 'Priya Natarajan', src: portrait(20, 350), presence: 'away', description: 'Platform' },
  { id: 'sam', name: 'Sam Okafor', presence: 'busy', description: 'In a meeting until 15:00' },
  { id: 'ines', name: 'Inès Laurent', src: portrait(290, 320), presence: 'offline', description: 'Research' },
  { id: 'kenji', name: 'Kenji Mori', src: portrait(190, 240), presence: 'online', description: 'Infrastructure' },
  { id: 'ada', name: 'Ada Brooks', presence: 'offline', description: 'Support' },
]

export const Playground: Story = {
  render: (args) => <AvatarStack {...args} users={team} />,
}

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-5">
      <AvatarStack users={team} size="sm" max={5} label="Viewers" />
      <AvatarStack users={team} max={4} label="Collaborators" />
      <AvatarStack users={team} size="lg" max={3} label="Owners" />
    </div>
  ),
}

export const LivePresence: Story = {
  name: 'Hero: live presence in a card',
  render: function Render() {
    const [users, setUsers] = useState(team)
    const cycle: Presence[] = ['online', 'away', 'busy', 'offline']
    const shuffle = () =>
      setUsers((list) =>
        list.map((user, i) =>
          i === Math.floor(Math.random() * 4) ? { ...user, presence: cycle[(cycle.indexOf(user.presence ?? 'online') + 1) % 4] } : user,
        ),
      )
    return (
      <Card className="w-full max-w-[420px]">
        <CardHeader>
          <CardTitle>Q3 roadmap</CardTitle>
          <CardDescription>Last edited 2 minutes ago by Mira Chen.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          {/* On a card, the rings that cut the overlaps out take the card's colour. */}
          <AvatarStack users={users} label="Collaborators" className="*:data-[slot=avatar]:ring-surface **:data-[slot=avatar-group-count]:ring-surface" />
          <Button variant="outline" size="sm" onClick={shuffle}>
            Change a status
          </Button>
        </CardContent>
      </Card>
    )
  },
}

export const NoOverflow: Story = {
  name: 'Fits without +N',
  render: () => <AvatarStack users={team.slice(0, 3)} label="Reviewers" />,
}
