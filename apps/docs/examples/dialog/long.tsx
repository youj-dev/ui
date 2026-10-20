'use client'

import {
  Badge,
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@youj/react'
import { SparklesIcon } from '@youj/icons'
import { IllustrationAnnouncement } from '@youj/illustrations'

const RELEASES = [
  { version: '4.14', title: 'Streaming search results', notes: 'Results render from the edge as they arrive, so the first ones show in under 100 ms.' },
  { version: '4.13', title: 'Preview comments sync', notes: 'Comments on a preview link to the issue in your tracker and resolve when it closes.' },
  { version: '4.12', title: 'Audit log filters', notes: 'Filter the audit log by member, project and action, and export any view as CSV.' },
  { version: '4.11', title: 'Faster cold starts', notes: 'Functions on the edge runtime start 38% faster, with no change to your code.' },
  { version: '4.10', title: 'Protected previews', notes: 'Only members of the workspace can open preview links, unless you share a pass.' },
  { version: '4.9', title: 'Rollbacks from the CLI', notes: 'Roll production back to any earlier deployment with one command.' },
  { version: '4.8', title: 'Environment groups', notes: 'Share one set of variables across projects, and override it per project.' },
  { version: '4.7', title: 'Region pinning', notes: 'Pin a project’s functions to one region, close to its database.' },
  { version: '4.6', title: 'Build cache insights', notes: 'See which steps hit the cache and how much time each one saved.' },
  { version: '4.5', title: 'Custom 404 pages', notes: 'Serve your own not-found page for every route a project doesn’t match.' },
  { version: '4.4', title: 'Deploy hooks', notes: 'Trigger a deployment from any service with a signed URL.' },
  { version: '4.3', title: 'Team roles', notes: 'Give members viewer, developer or admin access, per project.' },
]

export default function DialogLong() {
  return (
    <Dialog>
      <DialogTrigger render={<Button variant="outline" />}>
        <SparklesIcon />
        What’s new
      </DialogTrigger>
      {/* No × button: the footer's action is the one way out besides Escape and the scrim. */}
      <DialogContent showCloseButton={false} className="max-w-lg">
        {/* Decorative: with no title the scene is hidden from assistive tech. */}
        <div className="grid place-items-center rounded-lg py-3">
          <IllustrationAnnouncement unit={13} />
        </div>
        <DialogHeader>
          <DialogTitle>What’s new in Orion</DialogTitle>
          <DialogDescription>Everything that shipped this quarter.</DialogDescription>
        </DialogHeader>
        <ol className="flex flex-col gap-4">
          {RELEASES.map((release) => (
            <li key={release.version} className="flex flex-col gap-1">
              <span className="flex items-center gap-2 text-ui font-medium text-fg">
                <Badge variant="secondary" className="font-mono">
                  {release.version}
                </Badge>
                {release.title}
              </span>
              <p className="text-ui text-fg-muted">{release.notes}</p>
            </li>
          ))}
        </ol>
        <DialogFooter>
          <DialogClose render={<Button />}>Got it</DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
