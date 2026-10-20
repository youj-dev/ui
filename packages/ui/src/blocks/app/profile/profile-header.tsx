'use client'

import { useCallback, useState } from 'react'
import { motion } from 'motion/react'
import { Counter, MorphLabel, useMorphRoot } from '@youj/motion'
import { BadgeCheckIcon, CheckIcon, LinkIcon, MapPinIcon, MessageIcon, PlusIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar'
import { Button } from '../../../components/ui/button'
import { Eyebrow } from '../../../components/ui/typography'
import type { ProfileCopy, ProfileStat, ProfileUser } from './data'

/** A Button that is its own morph root: its box reshapes as its MorphLabel changes. */
function useMorphButton() {
  const [radius, setRadius] = useState<string>()
  const ref = useCallback((el: HTMLButtonElement | null) => {
    if (el) setRadius(getComputedStyle(el).borderRadius || undefined)
  }, [])
  return { ref, render: <motion.button {...useMorphRoot(radius)} /> }
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]!.toUpperCase())
    .join('')

interface ProfileActionsProps {
  user: ProfileUser
  following: boolean
  onFollowingChange: (following: boolean) => void
  onMessage?: () => void
  onCopyLink?: (url: string) => void
  copy: ProfileCopy
}

/** Follow, Message and Copy link: in the page header when embedded, beside the name otherwise. */
function ProfileActions({ user, following, onFollowingChange, onMessage, onCopyLink, copy: text }: ProfileActionsProps) {
  const [copied, setCopied] = useState(false)
  const { ref: followRef, render: followRender } = useMorphButton()
  const { ref: copyRef, render: copyRender } = useMorphButton()
  return (
    <div className="flex items-center gap-2">
      <Button
        ref={followRef}
        render={followRender}
        variant={following ? 'outline' : 'default'}
        className="overflow-hidden"
        onClick={() => onFollowingChange(!following)}
      >
        <MorphLabel value={following ? 'following' : 'follow'} contentClassName="gap-1.5">
          {following ? (
            <>
              <CheckIcon trigger="mount" size={16} strokeWidth={2.25} /> {text.following}
            </>
          ) : (
            <>
              <PlusIcon size={16} /> {text.follow}
            </>
          )}
        </MorphLabel>
      </Button>
      <Button variant="outline" onClick={onMessage}>
        <MessageIcon size={16} /> {text.message}
      </Button>
      {user.url && (
        <Button
          ref={copyRef}
          render={copyRender}
          variant="ghost"
          className="overflow-hidden"
          onClick={() => {
            const url = user.url!
            if (onCopyLink) onCopyLink(url)
            else void navigator.clipboard?.writeText(url).catch(() => {})
            setCopied(true)
            setTimeout(() => setCopied(false), 1800)
          }}
        >
          <MorphLabel value={copied ? 'copied' : 'copy'} contentClassName="gap-1.5">
            {copied ? (
              <>
                <CheckIcon trigger="mount" size={16} strokeWidth={2.25} /> {text.copied}
              </>
            ) : (
              <>
                <LinkIcon size={16} /> <span className="max-sm:sr-only">{text.copyLink}</span>
              </>
            )}
          </MorphLabel>
        </Button>
      )}
    </div>
  )
}

interface ProfileHeaderProps extends ProfileActionsProps {
  titleId: string
  Title: 'h1' | 'h2' | 'h3'
  followers: number
  stats: ProfileStat[]
  locale: string
  /** Draw Follow, Message and Copy link beside the name. Default true; the page header holds them when embedded. */
  actions?: boolean
}

function ProfileHeader({ titleId, Title, user, followers: base, stats, following, onFollowingChange, onMessage, onCopyLink, locale, copy: text, actions = true }: ProfileHeaderProps) {
  const followers = base + (following ? 1 : 0)

  return (
    <div className="-mt-14 flex flex-col gap-4 md:-mt-16">
      <Avatar className="size-24 ring-4 ring-canvas md:size-28">
        {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt="" />}
        <AvatarFallback className="bg-surface font-serif text-3xl text-accent italic">{user.initials ?? initialsOf(user.name)}</AvatarFallback>
      </Avatar>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <Title id={titleId} className="text-2xl font-semibold tracking-tight md:text-3xl">
              {user.name}
            </Title>
            {user.verified && (
              <>
                <BadgeCheckIcon size={22} className="text-accent" />
                <span className="sr-only">{text.verified}</span>
              </>
            )}
          </div>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-ui text-fg-muted">
            <span>@{user.handle}</span>
            {user.location && (
              <span className="flex items-center gap-1">
                <MapPinIcon size={14} /> {user.location}
              </span>
            )}
            {user.role && <span>{user.role}</span>}
          </p>
        </div>
        {actions && <ProfileActions user={user} following={following} onFollowingChange={onFollowingChange} onMessage={onMessage} onCopyLink={onCopyLink} copy={text} />}
      </div>
      {user.bio && <p className="max-w-2xl text-ui text-pretty">{user.bio}</p>}
      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))] border border-line bg-line sm:grid-cols-4">
        {[
          { label: text.followers, value: <Counter mode="roll" value={followers} locale={locale} format={{ useGrouping: true }} inView={false} from={followers} /> },
          ...stats.map((s) => ({ label: s.label, value: <Counter value={s.value} locale={locale} format={s.format} /> })),
        ].map((s) => (
          <div key={s.label} className="flex flex-col gap-0.5 bg-surface px-4 py-3">
            <Eyebrow render={<dt />} className="text-ui-sm text-fg-muted">
              {s.label}
            </Eyebrow>
            <dd className="text-xl font-semibold tracking-tight tabular-nums">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

export { ProfileActions, ProfileHeader }
