import { useEffect, useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { Avatar, AvatarFallback } from './avatar'
import { Badge } from './badge'
import { Button } from './button'
import { Skeleton } from './skeleton'

const meta: Meta<typeof Skeleton> = {
  title: 'UI/Primitives/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A recessed block with a band of light crossing it on the shimmer loop: three deliberate beats per cycle (cross, then rest), so it reads as a calm pulse rather than a constant wash. The duration is a youj token, so the Speed toolbar scales it; it reverses under RTL and stops under reduced motion, leaving a still block. Skeletons are aria-hidden: put aria-busy on the region they stand in for and announce the wait once.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Skeleton>

const people = [
  { name: 'Ada Lovelace', role: 'Owner', initials: 'AL' },
  { name: 'Grace Hopper', role: 'Admin', initials: 'GH' },
  { name: 'Alan Turing', role: 'Member', initials: 'AT' },
]

function Members() {
  const [loading, setLoading] = useState(true)
  useEffect(() => {
    if (!loading) return
    const t = setTimeout(() => setLoading(false), 2400)
    return () => clearTimeout(t)
  }, [loading])
  return (
    <div className="w-full max-w-[420px]">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-ui-lg font-medium text-fg">Members</p>
        <Button size="sm" variant="outline" onClick={() => setLoading(true)}>
          Reload
        </Button>
      </div>
      <div aria-busy={loading} className="overflow-hidden rounded-xl border border-line bg-surface">
        {people.map((p, i) => (
          <div key={p.name} className={`flex h-16 items-center gap-3 px-4 ${i > 0 ? 'border-t border-line' : ''}`}>
            {loading ? (
              <>
                <Skeleton className="size-8 rounded-full" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
                <Skeleton className="h-5 w-14 rounded-full" />
              </>
            ) : (
              <>
                <Avatar>
                  <AvatarFallback>{p.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-ui font-medium text-fg">{p.name}</p>
                  <p className="text-ui-sm text-fg-muted">{p.name.split(' ')[0]!.toLowerCase()}@acme.com</p>
                </div>
                <Badge variant="secondary">{p.role}</Badge>
              </>
            )}
          </div>
        ))}
      </div>
      <p role="status" className="sr-only">
        {loading ? 'Loading members' : 'Members loaded'}
      </p>
    </div>
  )
}

/** The skeleton matches the loaded row's geometry exactly, so nothing shifts when content lands. */
export const Hero: Story = {
  render: () => <Members />,
}

export const Shapes: Story = {
  render: () => (
    <div className="grid w-full max-w-[360px] gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="size-10 rounded-full" />
        <div className="grid flex-1 gap-2">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
        </div>
      </div>
      <Skeleton className="h-36 w-full rounded-lg" />
      <div className="grid gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  ),
}

/** Reduced motion: still blocks, no band. */
export const ReducedMotion: Story = {
  render: () => (
    <YoujProvider reducedMotion="always">
      <div className="grid w-full max-w-[360px] gap-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </YoujProvider>
  ),
}
