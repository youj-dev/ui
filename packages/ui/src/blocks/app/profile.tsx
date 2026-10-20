'use client'

import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, useLocale, type ThemeInput } from '@youj/core'
import { AppPage } from '../../components/ui/app-page'
import type { TimelineEvent, TimelineEventType } from '../../components/ui/timeline'
import { cn } from '../../lib/utils'
import {
  ACTIVITY,
  DEFAULT_COPY,
  DEMO_NOW,
  FOLLOWERS,
  FRIENDS,
  LINKS,
  SKILLS,
  STATS,
  STATUS,
  TYPES,
  USER,
  WORK,
  type ProfileContribution,
  type ProfileCopy,
  type ProfileFriend,
  type ProfileLink,
  type ProfileStat,
  type ProfileUser,
  type ProfileWork,
} from './profile/data'
import { ProfileAside } from './profile/profile-aside'
import { ProfileActions, ProfileHeader } from './profile/profile-header'
import { ProfileTabs } from './profile/profile-tabs'

/* A public profile for a type designer. A quiet band in a soft tint of the
 * accent sits behind an overlapping avatar; Follow morphs to Following (the box reshapes to the
 * new label on the same spring) while the follower count rolls to its new
 * value like an odometer. Copy link morphs to Copied. The tabs' underline
 * glides between Work (typeface specimens rising in on a stagger), Activity
 * (a half-year contribution heatmap with a tooltip per day, and a Timeline)
 * and About. Pass your own `user`, `stats`, `work`, `activity`,
 * `contributions`, `friends` and `links`, and wire `onFollowingChange`,
 * `onMessage` and `onCopyLink`; every string is in `copy`. Reduced motion:
 * labels and numbers swap in place and the cards are already there. It is built for the compact layout density (ui.css),
 * taken from the page. */

interface ProfileProps extends Omit<ComponentProps<'div'>, 'children' | 'about'> {
  /** A theme to force on the block. Default: none, so it inherits the app's (YoujProvider or a ThemeScope around it). */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) titled Profile, with Follow, Message and Copy link as its actions, and the person's name one level below. Default true; `false` draws its own page (the name as the h1, over a full-bleed cover). */
  embedded?: boolean
  /** The person: name, handle, avatar, bio, location and the URL Copy link copies. Default: Inês Duarte. */
  user?: ProfileUser
  /** The follower count before you follow. Default 12,480. */
  followers?: number
  /** The figures after Followers, in order. Default: Following, Typefaces, Downloads. */
  stats?: ProfileStat[]
  /** The Work tab's cards. Default: four typefaces. */
  work?: ProfileWork[]
  /** The Activity tab's timeline, newest first. Default: four recent events. */
  activity?: TimelineEvent[]
  /** How each `activity` type looks (icon, tone, label). Default: release, star and glyph. */
  activityTypes?: Record<string, TimelineEventType>
  /** Daily counts for the heatmap; days you leave out count 0. Default: a generated half year. */
  contributions?: ProfileContribution[]
  /** The About tab's text. Default: Inês's two paragraphs. */
  about?: ReactNode
  /** Tags under the About text. */
  skills?: string[]
  /** People you both know, in the aside. An empty list hides the card. */
  friends?: ProfileFriend[]
  /** Links in the aside's Elsewhere list. */
  links?: ProfileLink[]
  /** The availability card at the top of the aside, or `null` for none. Default: Open for commissions. */
  status?: { title: string; description?: string } | null
  /** Replaces the tinted cover band. */
  cover?: ReactNode
  /** Whether you follow them, to control it. Pair with `onFollowingChange`. */
  following?: boolean
  /** Whether you follow them at first, when uncontrolled. Default false. */
  defaultFollowing?: boolean
  /** Called with the new value when Follow is pressed. */
  onFollowingChange?: (following: boolean) => void
  /** Called from the Message button. */
  onMessage?: () => void
  /** Called with `user.url` from Copy link. Default: copies it to the clipboard. */
  onCopyLink?: (url: string) => void
  /** The heatmap ends on this day. Default: a fixed demo day (Sep 30, 2026). */
  now?: Date | number
  /** Formats numbers and dates. Default: the app's locale (YoujProvider), else en-US. */
  locale?: string
  /** The page title's level (the name sits one below it when embedded). Default 1. */
  headingLevel?: 1 | 2 | 3
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<ProfileCopy>
}

function Profile({
  theme,
  embedded = true,
  user = USER,
  followers = FOLLOWERS,
  stats = STATS,
  work = WORK,
  activity = ACTIVITY,
  activityTypes = TYPES,
  contributions,
  about,
  skills = SKILLS,
  friends = FRIENDS,
  links = LINKS,
  status = STATUS,
  cover,
  following: followingProp,
  defaultFollowing = false,
  onFollowingChange,
  onMessage,
  onCopyLink,
  now = DEMO_NOW,
  locale: localeProp,
  headingLevel = 1,
  copy: copyProp,
  className,
  ...rest
}: ProfileProps) {
  const locale = useLocale(localeProp)
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const titleId = useId()
  const [innerFollowing, setFollowing] = useState(defaultFollowing)
  const following = followingProp ?? innerFollowing

  const setFollowingTo = (next: boolean) => {
    setFollowing(next)
    onFollowingChange?.(next)
  }

  const coverBand = (
    <div aria-hidden className={cn('relative h-44 overflow-hidden bg-band md:h-60', embedded && 'rounded-[min(var(--radius-xl),var(--ui--panel-radius-max))]')}>
      {cover ?? <div className="absolute inset-0 bg-accent-subtle" />}
      <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-canvas to-transparent" />
    </div>
  )
  const sections = (
    <>
      <ProfileHeader
        titleId={titleId}
        Title={`h${embedded ? headingLevel + 1 : headingLevel}` as 'h1'}
        actions={!embedded}
        user={user}
        followers={followers}
        stats={stats}
        following={following}
        onFollowingChange={setFollowingTo}
        onMessage={onMessage}
        onCopyLink={onCopyLink}
        locale={locale}
        copy={copy}
      />

      {/* Embedded, the frame sets the width, so the aside stacks under the tabs. */}
      <div className={cn('grid gap-8', !embedded && 'lg:grid-cols-[minmax(0,1fr)_--spacing(68)]')}>
        <ProfileTabs
          work={work}
          activity={activity}
          activityTypes={activityTypes}
          contributions={contributions}
          about={about}
          skills={skills}
          now={new Date(now).getTime()}
          locale={locale}
          copy={copy}
        />

        <ProfileAside name={user.name} status={status} friends={friends} links={links} copy={copy} />
      </div>
    </>
  )

  if (embedded) {
    const page = (
      <AppPage
        {...rest}
        title={copy.title}
        actions={
          <ProfileActions user={user} following={following} onFollowingChange={setFollowingTo} onMessage={onMessage} onCopyLink={onCopyLink} copy={copy} />
        }
        headingLevel={headingLevel}
        width="fill"
        className={cn('text-fg', className)}
      >
        {coverBand}
        {sections}
      </AppPage>
    )
    return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
  }
  return (
    <ThemeScope theme={theme}>
      <div {...rest} className={cn('min-h-dvh bg-canvas text-fg', className)}>
        {coverBand}
        <main className="mx-auto flex max-w-5xl flex-col gap-8 px-4 pb-16 md:px-8">{sections}</main>
      </div>
    </ThemeScope>
  )
}

export { Profile }
export type { ProfileProps, ProfileCopy, ProfileUser, ProfileStat, ProfileWork, ProfileFriend, ProfileLink, ProfileContribution }
