import { useMemo, useRef, useState, type RefObject } from 'react'
import { ThemeScope, type MotionPersonality } from '@youj/core'
import { type AsyncState } from '@youj/motion'
import { LaptopIcon, SmartphoneIcon, TabletIcon, UserPlusIcon } from '@youj/icons'
import { AvatarStack } from '@youj/react/components/ui/avatar-stack'
import { Badge } from '@youj/react/components/ui/badge'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { CommandGroup, CommandItem, CommandSeparator, CommandShortcut } from '@youj/react/components/ui/command'
import { CommandPalette } from '@youj/react/components/ui/command-palette'
import { DataTable } from '@youj/react/blocks/tables/data-table'
import { createDataTableColumnHelper } from '@youj/react/components/ui/data-table'
import { Input } from '@youj/react/components/ui/input'
import { InputOTP, useOTPVerification } from '@youj/react/components/ui/input-otp'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@youj/react/components/ui/popover'
import { Switch } from '@youj/react/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@youj/react/components/ui/tabs'
import { toast } from '@youj/react/components/ui/toast'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { useAction, useEachFrame, useFrameValue } from '../../sim/simulation'
import { Deferred } from '../bits'
import { BUTTON_BEATS, COMMAND_BEATS, OTP_BEATS, PERSONALITY_BEATS, POPOVER_BEATS } from '../beats'
import { key, typeInto } from '../user'

/* The parts on the bench: real components, each driven only the way an app
 * or a person would drive it (props, clicks, keys, typing), at the frames in
 * beats.ts. They are the same instances throughout: shot one by one at macro,
 * then flown into the Security block, so what they show there (the Security
 * tab, the verified code, the sorted sessions) is what they were left with. */

/* ── Save ──────────────────────────────────────────────────────────────── */

/** Save changes: presses into its whole async lifecycle, morphing label and all. */
export function SavePart({ onState }: { onState: (state: AsyncState) => void }) {
  const done = useRef(new Deferred())
  useAction(BUTTON_BEATS.resolve, () => done.current.resolve())
  return (
    <AsyncButton size="lg" onAction={() => done.current.promise} pendingLabel="Saving…" successLabel="Saved" onActionStateChange={onState} tabIndex={-1}>
      Save changes
    </AsyncButton>
  )
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

export function TabsPart() {
  return (
    <Tabs defaultValue="general">
      <TabsList>
        {['General', 'Security', 'Members', 'Billing'].map((label) => (
          <TabsTrigger key={label} value={label.toLowerCase()} tabIndex={-1}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  )
}

/* ── Invite ────────────────────────────────────────────────────────────── */

const TEAM = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'ines', name: 'Inês Duarte' },
  { id: 'kofi', name: 'Kofi Mensah' },
  { id: 'lea', name: 'Léa Martin' },
  { id: 'omar', name: 'Omar Haddad' },
]

/** Who is on the team, and Invite: a Popover that grows out of its trigger's corner, into the camera's own space. */
export function InvitePart({ portal }: { portal: RefObject<HTMLDivElement | null> }) {
  const [open, setOpen] = useState(false)
  const email = useRef<HTMLInputElement>(null)
  const address = 'ada@northwind.dev'
  useEachFrame((f) => {
    const typed = Math.floor((f - POPOVER_BEATS.type) / 1.2)
    if (f >= POPOVER_BEATS.type && typed <= address.length) typeInto(email.current, address.slice(0, typed))
  })
  const send = () => {
    setOpen(false)
    toast.success('Invite sent', { description: `${address} can join Security.` })
  }
  return (
    <div className="flex items-center gap-3">
      <AvatarStack users={TEAM} max={4} size="sm" label="Team" />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button variant="outline" size="sm" tabIndex={-1} data-part="invite-trigger" />}>
          <UserPlusIcon size={14} strokeWidth={1.75} />
          Invite
        </PopoverTrigger>
        <PopoverContent container={portal} align="end" className="w-76">
          <PopoverHeader>
            <PopoverTitle>Invite to Security</PopoverTitle>
            <PopoverDescription>They get access to sign-in settings.</PopoverDescription>
          </PopoverHeader>
          <Input ref={email} placeholder="name@company.com" aria-label="Email" />
          <Button size="sm" onClick={send} tabIndex={-1} data-part="invite-send">
            Send invite
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  )
}

/* ── One-time code ─────────────────────────────────────────────────────── */

const CODE = '482913'

export function CodePart() {
  const verified = useRef(new Deferred())
  const otp = useOTPVerification(() => verified.current.promise.then(() => true))
  const field = useRef<HTMLInputElement>(null)
  useAction(OTP_BEATS.focus, () => field.current?.focus({ preventScroll: true }))
  useEachFrame((f) => {
    const since = f - OTP_BEATS.type
    if (since < 0 || since > OTP_BEATS.digit * (CODE.length - 1) || since % OTP_BEATS.digit !== 0) return
    typeInto(field.current, CODE.slice(0, since / OTP_BEATS.digit + 1))
  })
  useAction(OTP_BEATS.verified, () => verified.current.resolve())
  return (
    <InputOTP
      ref={field}
      {...otp.field}
      length={6}
      groups={[3, 3]}
      aria-label="Two-factor code"
      statusLabels={{ verifying: 'Checking the code', success: 'Verified', error: 'That code didn’t work' }}
    />
  )
}

/* ── Sessions ──────────────────────────────────────────────────────────── */

interface Session {
  id: string
  device: string
  kind: 'laptop' | 'phone' | 'tablet'
  place: string
  /** Minutes since it was last active. */
  minutes: number
  current?: boolean
}

const SESSIONS: Session[] = [
  { id: 'mac', device: 'MacBook Pro', kind: 'laptop', place: 'Berlin, DE', minutes: 0, current: true },
  { id: 'iphone', device: 'iPhone 16', kind: 'phone', place: 'Lisbon, PT', minutes: 120 },
  { id: 'pixel', device: 'Pixel 9', kind: 'phone', place: 'Tokyo, JP', minutes: 2880 },
  { id: 'ipad', device: 'iPad Air', kind: 'tablet', place: 'Paris, FR', minutes: 7 },
]
/** What "Sign out inactive sessions" signs out: anything idle for a day or more. */
const INACTIVE = (s: Session) => s.minutes >= 1440

const ago = (minutes: number) => (minutes === 0 ? 'Now' : minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${minutes / 60} h` : `${minutes / 1440} d`)
const KIND = { laptop: LaptopIcon, phone: SmartphoneIcon, tablet: TabletIcon }
const col = createDataTableColumnHelper<Session>()

/** The table is the Security block's full width, so it flies in without resizing. */
export const TABLE_WIDTH = 504

/** Active sessions, in a DataTable: its header sorts, and its rows glide to their new places (PresenceList). */
export function SessionsPart({ signedOut }: { signedOut: boolean }) {
  const data = useMemo(() => (signedOut ? SESSIONS.filter((s) => !INACTIVE(s)) : SESSIONS), [signedOut])
  const columns = useMemo(
    () =>
      col.columns([
        col.accessor('device', {
          header: 'Device',
          cell: (ctx) => {
            const Icon = KIND[ctx.row.original.kind]
            return (
              <span className="flex items-center gap-2.5">
                <Icon size={16} strokeWidth={1.6} className="text-fg-muted" />
                <span className="font-medium text-fg">{ctx.getValue()}</span>
                {ctx.row.original.current && <Badge variant="secondary">This device</Badge>}
              </span>
            )
          },
          meta: { grow: true },
        }),
        col.accessor('minutes', { header: 'Last active', size: 150, cell: (ctx) => ago(ctx.getValue()), meta: { numeric: true } }),
      ]),
    [],
  )
  return (
    <div style={{ width: TABLE_WIDTH }}>
      <DataTable<Session>
        fill
        label="Active sessions"
        copy={{ noun: 'sessions' }}
        rows={data}
        columns={columns}
        getRowId={(s) => s.id}
        getRowLabel={(s) => s.device}
        showFilters={false}
        showColumnsMenu={false}
        showDensityToggle={false}
        headerMenus={false}
        paginated={false}
        enableMultiSort={false}
        initialState={{ sorting: [{ id: 'device', desc: false }] }}
      />
    </div>
  )
}

/* ── Session timeout and 2FA, in a motion personality ─────────────────── */

const TIMEOUTS = ['1h', '8h', '24h']

/** The timeout the presses leave, at each frame (the same in every personality). */
function timeoutAt(frame: number) {
  const b = PERSONALITY_BEATS
  const presses: [number, string][] = [
    [b.first, '24h'],
    [b.second, '1h'],
    [b.third, '8h'],
    [b.replay, '24h'],
    [b.replay + b.second - b.first, '1h'],
    [b.replay + b.third - b.first, '8h'],
  ]
  return presses.filter(([at]) => frame >= at).at(-1)?.[1] ?? '8h'
}

/** Whether 2FA is required, at each frame: on at the toggle, off and on again in the replay. */
function requiredAt(frame: number) {
  const b = PERSONALITY_BEATS
  const flips = [b.toggle, b.replay + b.toggle - b.first - 20, b.replay + b.toggle - b.first]
  return flips.filter((at) => frame >= at).length % 2 === 1
}

/** A theme that changes only the motion personality, one object per personality so the scope never churns. */
const TUNINGS = { precise: { motionPersonality: 'precise' }, calm: { motionPersonality: 'calm' }, lively: { motionPersonality: 'lively' } } as const

export function TimeoutPart({ personality }: { personality?: MotionPersonality }) {
  const value = useFrameValue(timeoutAt)
  const control = (
    <ToggleGroup variant="segmented" value={[value]} aria-label="Session timeout" className="w-[216px]">
      {TIMEOUTS.map((t) => (
        <ToggleGroupItem key={t} value={t} tabIndex={-1} className="flex-1">
          {t}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
  return personality ? <ThemeScope theme={TUNINGS[personality]}>{control}</ThemeScope> : control
}

export function RequirePart({ personality }: { personality?: MotionPersonality }) {
  const on = useFrameValue(requiredAt)
  const control = <Switch checked={on} tabIndex={-1} aria-label="Require 2FA for everyone" />
  return personality ? <ThemeScope theme={TUNINGS[personality]}>{control}</ThemeScope> : control
}

/* ── The command palette ───────────────────────────────────────────────── */

const QUERY = 'sign out'

/** ⌘K, a few letters, the arrow keys, Enter: the palette runs "Sign out inactive sessions". */
export function Commands({ onRun }: { onRun: () => void }) {
  const [open, setOpen] = useState(false)
  const typed = useFrameValue((f) => QUERY.slice(0, Math.max(0, Math.min(QUERY.length, Math.floor((f - COMMAND_BEATS.type) / COMMAND_BEATS.letter)))))
  const input = () => document.querySelector<HTMLInputElement>('[cmdk-input]')
  useAction(COMMAND_BEATS.press, () => key('k', document.body, { metaKey: true, ctrlKey: false }))
  useAction(COMMAND_BEATS.down, () => key('ArrowDown', input()))
  useAction(COMMAND_BEATS.up, () => key('ArrowUp', input()))
  useAction(COMMAND_BEATS.run, () => key('Enter', input()))
  const run = () => {
    setOpen(false)
    onRun()
  }
  return (
    <CommandPalette open={open} onOpenChange={setOpen} search={typed} onSearchChange={() => {}} placeholder="Search settings and actions…">
      <CommandGroup heading="Sessions">
        <CommandItem value="Sign out inactive sessions" onSelect={run}>
          <LaptopIcon size={16} strokeWidth={1.6} />
          Sign out inactive sessions
          <CommandShortcut>⌘⇧O</CommandShortcut>
        </CommandItem>
        <CommandItem value="Sign out all other sessions" onSelect={run}>
          <SmartphoneIcon size={16} strokeWidth={1.6} />
          Sign out all other sessions
        </CommandItem>
        <CommandItem value="Download backup codes" onSelect={run}>
          <TabletIcon size={16} strokeWidth={1.6} />
          Download backup codes
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Go to">
        {['Members', 'Billing', 'Audit log'].map((page) => (
          <CommandItem key={page} value={`Go to ${page}`} onSelect={() => setOpen(false)}>
            {page}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandPalette>
  )
}
