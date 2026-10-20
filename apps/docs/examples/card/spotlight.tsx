'use client'

import { SpotlightGroup } from '@youj/motion'
import { GitPullRequestIcon, KanbanIcon, MessagesIcon } from '@youj/icons'
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@youj/react'

const INTEGRATIONS = [
  { name: 'GitHub', Icon: GitPullRequestIcon, description: 'Deploy every push and comment on pull requests.', connected: true },
  { name: 'Slack', Icon: MessagesIcon, description: 'Post deploy and incident alerts to a channel.', connected: false },
  { name: 'Linear', Icon: KanbanIcon, description: 'Link each deployment to the issues it ships.', connected: false },
]

export default function CardSpotlight() {
  return (
    <div className="@container w-full max-w-2xl">
      {/* One light for the whole group: a neighbor's edge glows as the pointer nears it. */}
      <SpotlightGroup radius={240} className="grid gap-3 @lg:grid-cols-3">
        {INTEGRATIONS.map(({ name, Icon, description, connected }) => (
          <Card key={name} spotlight size="sm">
            <CardHeader>
              <span className="mb-2 grid size-9 place-items-center rounded-lg border border-line bg-band text-fg">
                <Icon size={16} strokeWidth={1.75} />
              </span>
              <CardTitle className="flex items-center gap-2">
                {name}
                {connected && <Badge variant="success">Connected</Badge>}
              </CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto">
              <Button variant={connected ? 'outline' : 'secondary'} size="sm" className="w-full">
                {connected ? 'Configure' : `Connect ${name}`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </SpotlightGroup>
    </div>
  )
}
