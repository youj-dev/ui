'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useYouj } from '@youj/core'
import { MorphLabel, useMorphRoot } from '@youj/motion'
import { CheckIcon, LinkIcon, UserPlusIcon } from '@youj/icons'
import { IllustrationTeam } from '@youj/illustrations'
import {
  Avatar,
  AvatarFallback,
  Button,
  Input,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@youj/react'

const TEAM = [
  { name: 'Ana Lima', email: 'ana@youj.dev', role: 'Owner' },
  { name: 'Kenji Sato', email: 'kenji@youj.dev', role: 'Editor' },
]

const DEPLOYS = [
  { message: 'Stream search results from the edge', sha: '4f2a91c', age: '2m', ready: false },
  { message: 'Tighten cache headers on /docs', sha: '9b1e03d', age: '1h', ready: true },
  { message: 'New pricing page', sha: 'c7d42e8', age: '3h', ready: true },
  { message: 'Bump the build image', sha: '51aa6f2', age: '1d', ready: true },
  { message: 'OG images for the blog', sha: 'e08b7c1', age: '2d', ready: true },
  { message: 'Rotate the analytics key', sha: '2d9f4b0', age: '3d', ready: true },
]

const initials = (name: string) => name.split(/[\s@.]/).map((part) => part[0]).slice(0, 2).join('')

function CopyLink() {
  const k = useYouj()
  const morph = useMorphRoot(6)
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    if (!copied) return
    // How long "Copied" holds comes from the motion tokens too.
    const timer = setTimeout(() => setCopied(false), k.ms('deliberate') * 3)
    return () => clearTimeout(timer)
  }, [copied, k])

  return (
    <Button
      variant="outline"
      size="sm"
      render={<motion.button {...morph} />}
      className="overflow-hidden"
      onClick={() => navigator.clipboard?.writeText('https://youj.io/join/youj-web').then(() => setCopied(true))}
    >
      <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
        {copied ? (
          <>
            <CheckIcon trigger="mount" size={14} strokeWidth={2} /> Copied
          </>
        ) : (
          <>
            <LinkIcon size={14} /> Copy link
          </>
        )}
      </MorphLabel>
    </Button>
  )
}

export default function PopoverDemo() {
  const [people, setPeople] = useState(TEAM)

  const invite = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    const email = new FormData(form).get('email')?.toString().trim()
    if (!email) return
    setPeople((list) => [...list, { name: email, email, role: 'Invited' }])
    form.reset()
  }

  return (
    <div className="h-[26rem] w-full max-w-lg overflow-hidden rounded-xl border border-line bg-surface shadow-xs">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="truncate text-ui font-medium text-fg">youj-web</p>
          <p className="truncate text-ui-sm text-fg-muted">Production · youj.io</p>
        </div>
        <Popover>
          <PopoverTrigger render={<Button variant="outline" size="sm" />}>
            <UserPlusIcon />
            Share
          </PopoverTrigger>
          <PopoverContent align="end" className="w-80">
            <div className="flex items-center gap-3">
              {/* Decorative: with no title the scene is hidden from assistive tech. */}
              <IllustrationTeam unit={7} className="-my-3 -mx-2 shrink-0" />
              <PopoverHeader>
                <PopoverTitle>Share youj-web</PopoverTitle>
                <PopoverDescription>Invite people by email, or send the link.</PopoverDescription>
              </PopoverHeader>
            </div>
            <form onSubmit={invite} className="flex gap-2">
              <Input name="email" type="email" required aria-label="Email address" placeholder="name@youj.dev" />
              <Button type="submit">Invite</Button>
            </form>
            <ul aria-label="People with access" className="flex flex-col gap-0.5">
              {people.map((person) => (
                <li key={person.email} className="flex items-center gap-2.5 py-1">
                  <Avatar size="sm">
                    <AvatarFallback>{initials(person.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1 truncate text-ui text-fg">{person.name}</span>
                  <span className="text-ui-sm text-fg-muted">{person.role}</span>
                </li>
              ))}
            </ul>
            <div className="-mx-4 flex items-center justify-between gap-3 border-t border-line px-4 pt-3">
              <span className="text-ui-sm text-fg-muted">Anyone on the team can view.</span>
              <CopyLink />
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <ul aria-label="Recent deployments" className="divide-y divide-line">
        {DEPLOYS.map((deploy) => (
          <li key={deploy.sha} className="flex items-center gap-3 px-4 py-3">
            <span aria-hidden className={`size-2 shrink-0 rounded-full ${deploy.ready ? 'bg-success' : 'bg-warning'}`} />
            <span className="sr-only">{deploy.ready ? 'Ready:' : 'Building:'}</span>
            <span className="min-w-0 flex-1 truncate text-ui text-fg">{deploy.message}</span>
            <span className="font-mono text-ui-sm text-fg-muted">{deploy.sha}</span>
            <span className="w-14 text-end text-ui-sm text-fg-muted">{deploy.age}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
