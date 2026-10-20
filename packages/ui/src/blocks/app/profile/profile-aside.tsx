'use client'

import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { ExternalLinkIcon } from '@youj/icons'
import { AvatarStack } from '../../../components/ui/avatar-stack'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import type { ProfileCopy, ProfileFriend, ProfileLink } from './data'

/** A status dot with a slow halo; the halo is gone under reduced motion. */
function PulseDot() {
  const k = useYouj()
  return (
    <span aria-hidden className="relative flex size-2">
      {!k.reduced && (
        <motion.span
          className="absolute inset-0 rounded-full bg-success"
          animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
          transition={{ ...k.tween('deliberate', 'exit'), repeat: Infinity, repeatDelay: k.duration('deliberate') }}
        />
      )}
      <span className="relative size-2 rounded-full bg-success" />
    </span>
  )
}

function ProfileAside({
  name,
  status,
  friends,
  links,
  copy,
}: {
  name: string
  status: { title: string; description?: string } | null
  friends: ProfileFriend[]
  links: ProfileLink[]
  copy: ProfileCopy
}) {
  return (
    <aside aria-label={copy.asideLabel(name)} className="flex flex-col gap-4">
      {status && (
        <Card size="sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PulseDot />
              {status.title}
            </CardTitle>
            {status.description && <CardDescription>{status.description}</CardDescription>}
          </CardHeader>
        </Card>
      )}
      {friends.length > 0 && (
        <Card size="sm">
          <CardHeader>
            <CardTitle>{copy.followedBy}</CardTitle>
            <CardDescription>{copy.followedByDescription(friends.map((f) => f.name))}</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarStack users={friends} max={4} label={copy.mutualFollowers} />
          </CardContent>
        </Card>
      )}
      <nav aria-label={copy.elsewhere} className="flex flex-col gap-1 text-ui">
        {links.map(({ label: l, href }) => (
          <a
            key={l}
            href={href}
            className="focus-ring flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-fg-muted transition-colors yj-duration-fast ease-standard hover:bg-hover hover:text-fg"
          >
            {l}
            <ExternalLinkIcon size={14} />
          </a>
        ))}
      </nav>
    </aside>
  )
}

export { ProfileAside }
