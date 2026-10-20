'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { Reveal } from '@youj/motion'
import { ArrowRightIcon, CheckIcon, HourglassIcon } from '@youj/icons'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from '../../components/ui/avatar'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { AsyncButton } from '../../components/ui/async-button'
import { Card, CardContent } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { DEFAULT_COPY, DEMO_INVITE, demo, initials, type AcceptInviteCopy, type AcceptInviteDetails, type Invite, type InvitePerson, type InviteStatus } from './accept-invite/data'
import { JoinForm } from './accept-invite/join-form'

/* The page a teammate lands on from an invite link. It leads with who is
 * asking: the workspace's mark with the inviter's face tucked against it,
 * then the invite's terms (the address it was sent to, the role and what it
 * allows, who's already there, when it lapses). Joining is a choice between
 * signing in and creating an account, as two tabs over one form, and runs
 * through Button's onAction to a "You're in" state whose check draws itself.
 * An expired invite offers to ask for a new one; a teammate who's already a
 * member is pointed straight in. Each state rises in. Swap `onAccept` and
 * `onRequestNew` for your API. It is built for the compact layout density
 * (ui.css), taken from the page. Reduced motion: states swap in place. */

interface AcceptInviteProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Which page the link resolves to. Default 'valid'. */
  status?: InviteStatus
  invite?: Invite
  /** The tab it opens on: sign in when the address has an account. Default 'sign-in'. */
  defaultMode?: AcceptInviteDetails['mode']
  /** Wraps the page in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<AcceptInviteCopy>
  /** Signs in or signs up, and accepts. Reject with an Error to stay on the form. */
  onAccept?: (details: AcceptInviteDetails) => unknown
  /** "Request a new invite" on an expired one. */
  onRequestNew?: () => unknown
  /** "Open <workspace>", once in. */
  onOpen?: () => void
  /** "Go to sign in" and "Use another account". */
  onSignIn?: () => void
}

function Person({ person, className, short }: { person: InvitePerson; className?: string; /** One letter, for faces that overlap. */ short?: boolean }) {
  return (
    <Avatar className={className}>
      {person.avatar && <AvatarImage src={person.avatar} alt="" />}
      <AvatarFallback>{short ? initials(person.name).charAt(0) : initials(person.name)}</AvatarFallback>
    </Avatar>
  )
}

/** The workspace's mark with a badge at its corner: the inviter, or the state. */
function Crest({ invite, badge, muted }: { invite: Invite; badge: ReactNode; muted?: boolean }) {
  return (
    <div className="relative mx-auto">
      <div
        aria-hidden
        className={cn(
          'grid size-16 place-items-center overflow-hidden rounded-xl text-2xl font-semibold shadow-sm',
          muted ? 'bg-band text-fg-muted' : 'bg-accent text-on-accent',
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- copy-in blocks run in Vite too */}
        {invite.logo ? <img src={invite.logo} alt="" className="size-full object-cover" /> : invite.workspace.charAt(0)}
      </div>
      <span className="absolute -end-2 -bottom-2 grid size-8 place-items-center rounded-full bg-surface ring-3 ring-surface">{badge}</span>
    </div>
  )
}

function Heading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex flex-col gap-1.5 text-center">
      <h1 className="text-xl font-semibold tracking-tight text-balance text-fg">{title}</h1>
      <p className="text-ui text-pretty text-fg-muted">{description}</p>
    </div>
  )
}

function Terms({ invite, copy }: { invite: Invite; copy: AcceptInviteCopy }) {
  const shown = invite.members.slice(0, 3)
  const row = 'grid grid-cols-[--spacing(26)_1fr] items-center gap-3 px-3.5 py-2.5 max-[380px]:grid-cols-1 max-[380px]:gap-1'
  return (
    <dl className="divide-y divide-line rounded-lg border border-line text-ui">
      <div className={row}>
        <dt className="text-fg-muted">{copy.invitedAs}</dt>
        <dd dir="ltr" className="min-w-0 truncate font-mono text-ui-sm text-fg rtl:text-end">
          {invite.email}
        </dd>
      </div>
      <div className={row}>
        <dt className="text-fg-muted">{copy.role}</dt>
        <dd className="flex min-w-0 flex-col items-start gap-1">
          <Badge>{invite.role}</Badge>
          <span className="text-ui-sm text-fg-muted">{invite.roleDescription}</span>
        </dd>
      </div>
      <div className={row}>
        <dt className="text-fg-muted">{copy.members}</dt>
        <dd className="flex items-center gap-2.5">
          <AvatarGroup>
            {shown.map((person) => (
              <Person key={person.email} person={person} short className="size-7 text-ui-xs" />
            ))}
            {invite.memberCount > shown.length && <AvatarGroupCount className="size-7 text-ui-xs">+{invite.memberCount - shown.length}</AvatarGroupCount>}
          </AvatarGroup>
          <span className="whitespace-nowrap text-fg-muted">{copy.memberCount(invite.memberCount)}</span>
        </dd>
      </div>
      <div className={row}>
        <dt className="text-fg-muted">{copy.expires}</dt>
        <dd className="text-fg">{invite.expires}</dd>
      </div>
    </dl>
  )
}

function AcceptInvite({
  status = 'valid',
  invite = DEMO_INVITE,
  defaultMode = 'sign-in',
  theme,
  copy: copyProp,
  onAccept = () => demo('AcceptInvite: onAccept', 1100),
  onRequestNew = () => demo('AcceptInvite: onRequestNew', 900),
  onOpen,
  onSignIn,
  className,
  ...rest
}: AcceptInviteProps) {
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const [joined, setJoined] = useState(false)
  const state = joined ? 'joined' : status
  const inviter = <Person person={invite.inviter} className="size-7 text-ui-xs" />

  const content =
    state === 'joined' ? (
      <>
        <Crest invite={invite} badge={<CheckIcon trigger="mount" size={16} strokeWidth={2.25} className="text-success-text" />} />
        <Heading title={copy.joinedTitle(invite.workspace)} description={copy.joinedDescription(invite.role, invite.inviter.name)} />
        <Button size="lg" className="w-full" onClick={onOpen}>
          {copy.open(invite.workspace)} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
        </Button>
      </>
    ) : state === 'expired' ? (
      <>
        <Crest invite={invite} muted badge={<HourglassIcon trigger="mount" size={15} className="text-warning-text" />} />
        <Heading title={copy.expiredTitle} description={copy.expiredDescription(invite.workspace, invite.inviter.name, invite.expires)} />
        <div className="flex flex-col gap-2">
          <AsyncButton size="lg" className="w-full" pendingLabel={copy.requesting} successLabel={copy.requested} onAction={onRequestNew}>
            {copy.requestNew}
          </AsyncButton>
          <Button size="lg" variant="ghost" className="w-full" onClick={onSignIn}>
            {copy.signIn}
          </Button>
        </div>
      </>
    ) : state === 'member' ? (
      <>
        <Crest invite={invite} badge={<CheckIcon size={16} strokeWidth={2.25} className="text-success-text" />} />
        <Heading title={copy.memberTitle(invite.workspace)} description={copy.memberDescription(invite.email, invite.role, invite.joined ?? '')} />
        <div className="flex flex-col gap-2">
          <Button size="lg" className="w-full" onClick={onOpen}>
            {copy.open(invite.workspace)} <ArrowRightIcon size={16} className="rtl:-scale-x-100" />
          </Button>
          <Button size="lg" variant="ghost" className="w-full" onClick={onSignIn}>
            {copy.switchAccount}
          </Button>
        </div>
      </>
    ) : (
      <>
        <Crest invite={invite} badge={inviter} />
        <Heading title={copy.joinTitle(invite.workspace)} description={copy.joinDescription(invite.inviter.name, invite.workspace)} />
        <Terms invite={invite} copy={copy} />
        <JoinForm email={invite.email} defaultMode={defaultMode} copy={copy} onJoin={onAccept} onJoined={() => setJoined(true)} />
      </>
    )

  const page = (
    <div
      {...rest}
      className={cn('relative isolate flex min-h-dvh flex-col items-center justify-center bg-canvas px-4 py-10 text-fg', className)}
    >
      <main className="flex w-full max-w-md flex-col gap-6">
        <span className="inline-flex items-center justify-center gap-2 text-ui font-semibold tracking-tight">
          <span aria-hidden className="grid size-6 place-items-center rounded-sm bg-accent text-ui-xs text-on-accent">
            {copy.brand.charAt(0)}
          </span>
          {copy.brand}
        </span>
        <Card className="shadow-md">
          <CardContent>
            {/* Keyed by state: each one rises in fresh. */}
            <Reveal key={state} inView={false} variant="rise" className="flex flex-col gap-6 pt-2">
              {content}
            </Reveal>
          </CardContent>
        </Card>
        {state === 'valid' && <p className="text-center text-ui-sm text-balance text-fg-muted">{copy.wrongAccount(invite.inviter.name)}</p>}
      </main>
    </div>
  )
  return theme ? <ThemeScope theme={theme}>{page}</ThemeScope> : page
}

export { AcceptInvite, type AcceptInviteProps }
