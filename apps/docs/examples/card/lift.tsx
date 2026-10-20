'use client'

import { ExternalLinkIcon, GitBranchIcon } from '@youj/icons'
import { Badge, Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@youj/react'

const PROJECTS = [
  { name: 'web', domain: 'youj.io', branch: 'main', updated: '4m ago', ready: true },
  { name: 'dashboard', domain: 'app.youj.io', branch: 'release/2.4', updated: '1h ago', ready: false },
  { name: 'docs', domain: 'docs.youj.io', branch: 'main', updated: '2h ago', ready: true },
  { name: 'api', domain: 'api.youj.io', branch: 'main', updated: '1d ago', ready: true },
]

export default function CardLift() {
  return (
    <div className="@container w-full max-w-xl">
      <ul className="grid gap-3 @md:grid-cols-2">
        {PROJECTS.map((project) => (
          <li key={project.name}>
            {/* data-yj-trigger: the icons inside play while the card is hovered or focused. */}
            <Card lift size="sm" className="h-full" data-yj-trigger="">
              <CardHeader>
                <CardTitle>
                  {/* A stretched link: the whole card is the target, and the link is its one tab stop. */}
                  <a href={`#${project.name}`} className="rounded-sm after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none">
                    {project.name}
                  </a>
                </CardTitle>
                <CardDescription className="flex items-center gap-1">
                  {project.domain}
                  <ExternalLinkIcon size={12} />
                </CardDescription>
                <CardAction>
                  <Badge variant={project.ready ? 'success' : 'warning'}>{project.ready ? 'Ready' : 'Building'}</Badge>
                </CardAction>
              </CardHeader>
              <CardContent className="flex items-center gap-1.5 text-ui-sm text-fg-muted">
                <GitBranchIcon size={14} />
                <span className="truncate font-mono">{project.branch}</span>
                <span aria-hidden>·</span>
                <span className="shrink-0">{project.updated}</span>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
