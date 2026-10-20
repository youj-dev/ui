'use client'

import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ClipboardEvent,
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  type RefObject,
} from 'react'
import { PresenceItem, PresenceList } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { shareDialogLabels } from '@youj/core/labels'
import { BuildingIcon } from '@youj/icons/components/youj/icons/building'
import { GlobeIcon } from '@youj/icons/components/youj/icons/globe'
import { LinkIcon } from '@youj/icons/components/youj/icons/link'
import { FileTextIcon } from '@youj/icons/components/youj/icons/file-text'
import { LockIcon } from '@youj/icons/components/youj/icons/lock'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { useAnnouncer } from '../../hooks/use-announcer'
import { useControllableState } from '../../hooks/use-controllable-state'
import { cn, initials } from '../../lib/utils'
import { AsyncButton } from './async-button'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import { Badge, BadgeRemove } from './badge'
import { Button } from './button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog'
import { Input } from './input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Skeleton } from './skeleton'
import { Switch } from './switch'

/* Every control in the dialog is one height (control) and wears the theme's
 * field and button shapes, so the dialog matches the rest of the app. */
const rowClass = 'own:flex min-h-12 items-center own:gap-3 own:py-1'

/* Google-Drive-style sharing in one dialog: invite people, see who has
 * access, and set what the link allows.
 *
 * The invite field takes emails and picks from `suggestions` (people and
 * groups) as chips. Enter, a comma or a semicolon commits typed text, a paste
 * is split, Backspace on an empty field takes the last chip back. An address
 * that isn't one, or belongs to someone who already has access, stays as a
 * danger chip with its reason and blocks Send until it is removed. Send is an
 * Async Button: a failure keeps the chips and the dialog and says why.
 *
 * "People with access" scrolls inside a fixed height, so the dialog keeps its
 * size however many people there are. The owner's role is fixed; a pending
 * invitation can be resent or cancelled. Every action on a row (role, remove,
 * resend) is awaited on its own and fails on its own row.
 *
 * `preview` puts a small card for the thing being shared above the invite
 * field. `accessLayout="switches"` is the compact general access for a
 * narrower dialog: no message field, and one row per way in, each a title and
 * a line with a Switch on the same edge. "Only people invited" carries the role
 * invitations start on; turning on the organization or link row opens the
 * document that way (with its own role menu inline), turning it off goes back
 * to invited people only.
 *
 * Keyboard: focus opens in the invite field; the suggestions are an ARIA
 * combobox (ArrowUp/Down, Enter, Escape closes the list before it closes the
 * dialog). Invites sent, access removed, role and access changes and the link
 * copied are announced politely; errors are alerts. Reduced motion: rows and
 * buttons change without motion. */

type ShareScope = 'restricted' | 'organization' | 'anyone'

interface ShareRole {
  value: string
  label: string
}

interface SharePerson {
  id: string
  name: string
  email?: string
  /** Image URL. Without one, the initials show. */
  avatar?: string
  /** A `ShareRole` value. */
  role: string
  /** The owner's role is fixed and the row has no actions. */
  owner?: boolean
  /** Invited, not yet accepted: marked, and can be resent or cancelled. */
  pending?: boolean
}

interface ShareSuggestion {
  id: string
  name: string
  email?: string
  avatar?: string
  /** A group of this many people. */
  members?: number
}

/** Who an invitation goes to: a suggestion (`id`), a typed address (`email`), or both. */
interface ShareRecipient {
  id?: string
  name: string
  email?: string
  group?: boolean
}

interface ShareInvite {
  recipients: ShareRecipient[]
  role: string
  message?: string
}

interface ShareAccess {
  scope: ShareScope
  /** What anyone who can open the link may do. */
  role: string
}

/** The thing being shared, as a card above the invite field. */
interface SharePreview {
  title: string
  /** One line under the title. */
  description?: string
  /** A picture or icon for the left edge. Default: a document icon. */
  thumbnail?: ReactNode
}

interface ShareDialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  /** The element that opens the dialog, pressed to open it. */
  trigger?: ReactElement
  /** The name of what is shared; it's the dialog's title. */
  resource: string
  /** The address `Copy link` puts on the clipboard. */
  link: string
  /** Default: Viewer, Commenter and Editor. */
  roles?: ShareRole[]
  /** The role the invite starts on. Default: the first role. */
  defaultInviteRole?: string
  /** Everyone with access, the owner and pending invitations included. */
  people: SharePerson[]
  /** The list is on its way: skeleton rows instead of people. */
  loading?: boolean
  /** People and groups the invite field offers. Those already in `people` are left out. */
  suggestions?: ShareSuggestion[]
  /** The organization's name; it adds `Anyone at …` to general access. */
  organization?: string
  /** Shows the thing being shared as a card above the invite field. */
  preview?: SharePreview
  /** How general access is laid out. `select` (default): one menu for who can open the link, with a role beside it. `switches`: compact rows with a Switch each, the invite role on the "Only people invited" row, and no message field. */
  accessLayout?: 'select' | 'switches'
  access?: ShareAccess
  defaultAccess?: ShareAccess
  /** Called when someone changes general access; resolve to apply it. Rejecting keeps the old value and shows the message. */
  onAccessChange?: (access: ShareAccess) => Promise<unknown> | unknown
  /** The viewer may look but not change anything: no invite field, no role or access selects, no remove. Copy link stays. */
  readOnly?: boolean
  /** Sends the invitation; resolve when it's out and add the people to `people`. Reject to show the message and keep the chips. */
  onInvite?: (invite: ShareInvite) => Promise<unknown> | unknown
  onRoleChange?: (person: SharePerson, role: string) => Promise<unknown> | unknown
  /** Removes someone's access. */
  onRemove?: (person: SharePerson) => Promise<unknown> | unknown
  onResend?: (person: SharePerson) => Promise<unknown> | unknown
  /** Cancels a pending invitation. Default: `onRemove`. */
  onCancelInvite?: (person: SharePerson) => Promise<unknown> | unknown
  /** Called after the link was copied. */
  onCopyLink?: () => void
  className?: string
}

const EMAIL = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]+$/
const SPLIT = /[\s,;]+/

const message = (error: unknown, fallback: string) => (error instanceof Error && error.message ? error.message : fallback)

/** Runs one action at a time, tracking whether it is working and why it failed. */
function useAction() {
  const labels = useComponentLabels(shareDialogLabels)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string>()
  const run = async (action: () => Promise<unknown> | unknown) => {
    setPending(true)
    setError(undefined)
    try {
      await action()
      return true
    } catch (failure) {
      setError(message(failure, labels.shareDialogFailed))
      return false
    } finally {
      setPending(false)
    }
  }
  return { pending, error, run }
}

function Person({ name, avatar, size = 'default' }: { name: string; avatar?: string; size?: 'sm' | 'default' }) {
  return (
    <Avatar size={size}>
      {avatar && <AvatarImage src={avatar} alt="" />}
      <AvatarFallback>{initials(name)}</AvatarFallback>
    </Avatar>
  )
}

interface Chip {
  key: string
  recipient: ShareRecipient
  /** Why it can't be sent. */
  invalid?: string
}

function RecipientField({
  chips,
  onChipsChange,
  suggestions,
  people,
  inputRef,
  announce,
}: {
  chips: Chip[]
  onChipsChange: (chips: Chip[]) => void
  suggestions: ShareSuggestion[]
  people: SharePerson[]
  inputRef: RefObject<HTMLInputElement | null>
  announce: (text: string) => void
}) {
  const labels = useComponentLabels(shareDialogLabels)
  const listId = useId()
  const errorId = useId()
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [active, setActive] = useState(-1)

  const matches = useMemo(() => {
    const query = text.trim().toLowerCase()
    const chosen = new Set(chips.flatMap((chip) => [chip.recipient.id, chip.recipient.email?.toLowerCase()]))
    const have = new Set(people.flatMap((person) => [person.id, person.email?.toLowerCase()]))
    return suggestions
      .filter((s) => !chosen.has(s.id) && !have.has(s.id) && !(s.email && (chosen.has(s.email.toLowerCase()) || have.has(s.email.toLowerCase()))))
      .filter((s) => !query || s.name.toLowerCase().includes(query) || s.email?.toLowerCase().includes(query))
  }, [text, chips, people, suggestions])
  const open = focused && !dismissed && matches.length > 0
  const activeId = open && active >= 0 && matches[active] ? `${listId}-${matches[active].id}` : undefined

  useEffect(() => {
    if (activeId) document.getElementById(activeId)?.scrollIntoView?.({ block: 'nearest' })
  }, [activeId])

  const addChips = (next: Chip[]) => {
    const seen = new Set(chips.map((chip) => chip.key))
    const fresh = next.filter((chip) => !seen.has(chip.key))
    if (fresh.length > 0) onChipsChange([...chips, ...fresh])
  }

  const fromSuggestion = (s: ShareSuggestion): Chip => ({
    key: s.id,
    recipient: { id: s.id, name: s.name, email: s.email, group: s.members !== undefined || undefined },
  })

  const fromText = (raw: string): Chip => {
    const value = raw.trim()
    const email = value.toLowerCase()
    const holder = people.find((person) => person.email?.toLowerCase() === email)
    const known = suggestions.find((s) => s.email?.toLowerCase() === email)
    if (known && !holder) return fromSuggestion(known)
    const chip: Chip = { key: email, recipient: { name: value, email: value } }
    if (holder) chip.invalid = labels.shareDialogHasAccess(holder.name)
    else if (!EMAIL.test(value)) chip.invalid = labels.shareDialogNotEmail(value)
    return chip
  }

  const commitText = (raw = text) => {
    const parts = raw.split(SPLIT).filter(Boolean)
    if (parts.length > 0) addChips(parts.map(fromText))
    setText('')
  }

  const choose = (s: ShareSuggestion) => {
    addChips([fromSuggestion(s)])
    setText('')
    setActive(-1)
    inputRef.current?.focus()
  }

  const removeChip = (index: number) => {
    const chip = chips[index]
    if (!chip) return
    onChipsChange(chips.filter((_, i) => i !== index))
    announce(labels.shareDialogRemoved(chip.recipient.name))
    inputRef.current?.focus()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (matches.length === 0) return
      event.preventDefault()
      setDismissed(false)
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((i) => (i < 0 ? (step === 1 ? 0 : matches.length - 1) : (i + step + matches.length) % matches.length))
    } else if (event.key === 'Enter') {
      if (open && matches[active]) {
        event.preventDefault()
        choose(matches[active])
      } else if (text.trim()) {
        event.preventDefault()
        commitText()
      }
    } else if (event.key === ',' || event.key === ';') {
      if (!text.trim()) return
      event.preventDefault()
      commitText()
    } else if (event.key === 'Backspace' && text === '' && chips.length > 0) {
      event.preventDefault()
      removeChip(chips.length - 1)
    } else if (event.key === 'Escape' && open) {
      // Close the list first; a second Escape reaches the dialog.
      event.stopPropagation()
      setDismissed(true)
      setActive(-1)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData('text')
    if (!SPLIT.test(pasted.trim())) return
    event.preventDefault()
    commitText(text + pasted)
  }

  const reasons = [...new Set(chips.flatMap((chip) => chip.invalid ?? []))]

  return (
    <div className="relative own:flex min-w-0 flex-1 flex-col own:gap-1.5">
      <div
        data-slot="share-dialog-recipients"
        onClick={(event) => {
          if (!(event.target as HTMLElement).closest('button, input')) inputRef.current?.focus()
        }}
        className={cn(
          'group/input-group own:flex own:min-h-control own:w-full own:min-w-0 cursor-text flex-wrap items-center own:gap-1 own:rounded-field-area own:border own:px-1.5 own:py-0.5',
          'own:border-(--ui--field-line) own:bg-(--ui--field-fill) own:hover:border-(--ui--field-line-hover) own:hover:bg-(--ui--field-fill-hover)',
          'transition-[border-color,background-color,box-shadow] yj-duration-fast ease-standard own:focus-field-within',
          reasons.length > 0 && 'own:border-danger',
        )}
      >
        {chips.map((chip, index) => (
          <Badge
            key={chip.key}
            variant={chip.invalid ? 'danger' : 'secondary'}
            data-invalid={chip.invalid ? '' : undefined}
            className="own:max-w-full own:min-w-0 own:gap-1 own:ps-2 own:pe-1 own:text-fg"
          >
            <span className="truncate">{chip.recipient.name}</span>
            {chip.invalid && <span className="sr-only">{chip.invalid}</span>}
            <BadgeRemove aria-label={labels.shareDialogRemoveRecipient(chip.recipient.name)} onClick={() => removeChip(index)} />
          </Badge>
        ))}
        <input
          ref={inputRef}
          role="combobox"
          data-slot="input-group-control"
          aria-label={labels.shareDialogAddPeople}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-activedescendant={activeId}
          aria-invalid={reasons.length > 0 || undefined}
          aria-describedby={reasons.length > 0 ? errorId : undefined}
          autoComplete="off"
          spellCheck={false}
          value={text}
          placeholder={chips.length === 0 ? labels.shareDialogAddPeople : undefined}
          onChange={(event) => {
            setText(event.target.value)
            setDismissed(false)
            setActive(-1)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => {
            setFocused(false)
            commitText()
          }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className="h-6 min-w-24 flex-1 own:bg-transparent own:px-1 text-ui text-fg outline-none placeholder:text-fg-muted"
        />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          aria-label={labels.shareDialogSuggestions}
          className="absolute inset-x-0 top-full z-10 mt-1 max-h-56 overflow-y-auto yj-scrollbar rounded-md border border-line bg-overlay own:p-1 shadow-lg"
        >
          {matches.map((s, index) => (
            <li
              key={s.id}
              id={`${listId}-${s.id}`}
              role="option"
              aria-selected={index === active}
              data-active={index === active || undefined}
              // Keeps focus in the field; the press chooses.
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => choose(s)}
              onMouseMove={() => setActive(index)}
              className="flex cursor-default items-center own:gap-2.5 rounded-sm own:px-2 own:py-1.5 data-active:bg-hover"
            >
              <Person name={s.name} avatar={s.avatar} size="sm" />
              <span className="own:flex min-w-0 flex-1 flex-col">
                <span className="truncate own:text-ui own:font-medium own:text-fg">{s.name}</span>
                <span className="truncate own:text-ui-sm own:text-fg-muted">
                  {s.members !== undefined ? labels.shareDialogGroupSize(s.members) : s.email}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
      <p id={errorId} role="alert" className={cn('own:text-ui-sm own:font-medium own:text-danger-text', reasons.length === 0 && 'sr-only')}>
        {reasons.length > 0 && (
          <>
            {reasons[0]}
            {'. '}
            {labels.shareDialogFixInvalid}
          </>
        )}
      </p>
    </div>
  )
}

function RoleSelect({
  roles,
  value,
  onValueChange,
  label,
  disabled,
  className,
}: {
  roles: ShareRole[]
  value: string
  onValueChange: (value: string) => void
  label: string
  disabled?: boolean
  className?: string
}) {
  return (
    <Select items={roles} value={value} disabled={disabled} onValueChange={(next) => next && onValueChange(next)}>
      <SelectTrigger aria-label={label} className={cn('w-32 shrink-0', className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {roles.map((role) => (
          <SelectItem key={role.value} value={role.value}>
            {role.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function PersonRow({
  person,
  roles,
  readOnly,
  announce,
  onRoleChange,
  onRemove,
  onResend,
  onCancelInvite,
}: {
  person: SharePerson
  roles: ShareRole[]
  readOnly?: boolean
  announce: (text: string) => void
  onRoleChange?: ShareDialogProps['onRoleChange']
  onRemove?: ShareDialogProps['onRemove']
  onResend?: ShareDialogProps['onResend']
  onCancelInvite?: ShareDialogProps['onCancelInvite']
}) {
  const labels = useComponentLabels(shareDialogLabels)
  const change = useAction()
  const remove = useAction()
  const [resendError, setResendError] = useState<string>()
  const roleLabel = roles.find((role) => role.value === person.role)?.label ?? person.role
  // A new role shows at once; the handler confirms it, and a rejection puts the old one back.
  const [optimisticRole, setOptimisticRole] = useState<string>()
  const shownRole = optimisticRole ?? person.role
  const busy = change.pending || remove.pending
  const error = change.error ?? remove.error ?? resendError

  return (
    <div className="own:flex flex-col own:gap-1">
      <div className={rowClass}>
        <Person name={person.name} avatar={person.avatar} />
        <div className="own:flex min-w-0 flex-1 flex-col">
          <span className="own:flex min-w-0 items-center own:gap-1.5">
            <span className="truncate own:text-ui own:font-medium own:text-fg">{person.name}</span>
            {person.pending && (
              // shape: dashed, like the demo marker: invited, not yet joined
              <Badge variant="outline" className="border-dashed">
                {labels.shareDialogPending}
              </Badge>
            )}
          </span>
          {person.email && <span className="truncate own:text-ui-sm own:text-fg-muted">{person.email}</span>}
        </div>
        {person.owner ? (
          <span className="shrink-0 own:px-2 own:text-ui own:text-fg-muted">{labels.shareDialogOwner}</span>
        ) : readOnly ? (
          <span className="shrink-0 own:px-2 own:text-ui own:text-fg-muted">{roleLabel}</span>
        ) : (
          <>
            {person.pending && (
              <AsyncButton
                variant="ghost"
                aria-label={labels.shareDialogResendTo(person.name)}
                pendingLabel={labels.shareDialogResend}
                successLabel={labels.shareDialogSent}
                onAction={async () => {
                  setResendError(undefined)
                  try {
                    await onResend?.(person)
                  } catch (failure) {
                    setResendError(message(failure, labels.shareDialogFailed))
                    throw failure
                  }
                }}
              >
                {labels.shareDialogResend}
              </AsyncButton>
            )}
            <RoleSelect
              roles={roles}
              value={shownRole}
              label={labels.shareDialogRoleOf(person.name)}
              disabled={remove.pending}
              onValueChange={async (next) => {
                if (next === shownRole) return
                setOptimisticRole(next)
                const done = await change.run(() => onRoleChange?.(person, next))
                setOptimisticRole(undefined)
                if (done) announce(labels.shareDialogRoleChanged(person.name, roles.find((role) => role.value === next)?.label ?? next))
              }}
            />
            <Button
              variant="ghost"
              size="icon"
              disabled={busy}
              aria-label={person.pending ? labels.shareDialogCancelInvite(person.name) : labels.shareDialogRemoveAccess(person.name)}
              onClick={async () => {
                const action = person.pending ? (onCancelInvite ?? onRemove) : onRemove
                const done = await remove.run(() => action?.(person))
                if (done) announce(labels.shareDialogRemoved(person.name))
              }}
            >
              <XIcon />
            </Button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="own:ps-11 own:text-ui-sm own:font-medium own:text-danger-text">
          {error}
        </p>
      )}
    </div>
  )
}

function AccessTile({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="own:grid size-8 shrink-0 place-items-center rounded-lg bg-band own:text-fg-muted [&_svg]:size-4">
      {children}
    </span>
  )
}

function AccessText({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="own:flex min-w-0 flex-1 flex-col text-start">
      <span className="truncate own:text-ui own:font-medium own:text-fg">{label}</span>
      <span className="truncate own:text-ui-sm own:font-normal own:text-fg-muted">{hint}</span>
    </span>
  )
}

function PreviewCard({ preview }: { preview: SharePreview }) {
  return (
    // The section takes the dialog's side padding (Bezel pads each section of a dialog); the card is the soft fill inside it.
    <section>
      <div data-slot="share-dialog-preview" className="own:flex items-stretch own:overflow-hidden own:rounded-md own:bg-band">
        <div
          aria-hidden
          className="own:grid w-20 shrink-0 place-items-center overflow-hidden bg-hover text-fg-muted [&_svg]:size-6 [&>img]:size-full [&>img]:object-cover"
        >
          {preview.thumbnail ?? <FileTextIcon />}
        </div>
        <div className="own:flex min-w-0 flex-1 flex-col justify-center own:gap-0.5 own:px-3 own:py-3">
          <p className="truncate own:text-ui own:font-medium own:text-fg">{preview.title}</p>
          {preview.description && <p className="truncate own:text-ui-sm own:text-fg-muted">{preview.description}</p>}
        </div>
      </div>
    </section>
  )
}

function SwitchRow({
  label,
  hint,
  checked,
  readOnly,
  onCheckedChange,
  children,
}: {
  label: string
  hint: string
  checked: boolean
  readOnly?: boolean
  onCheckedChange: (checked: boolean) => void
  /** The role menu (or its text), before the switch. */
  children?: ReactNode
}) {
  return (
    <div className={rowClass}>
      <AccessText label={label} hint={hint} />
      {children}
      <Switch aria-label={label} checked={checked} readOnly={readOnly} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function PeopleSkeleton() {
  return (
    <div aria-hidden className="own:flex flex-col">
      {[0, 1, 2].map((row) => (
        <div key={row} className={rowClass}>
          <Skeleton className="own:size-8 own:rounded-full" />
          <div className="own:flex flex-1 flex-col own:gap-1.5">
            <Skeleton className="own:h-3.5 own:w-32" />
            <Skeleton className="own:h-3 own:w-44" />
          </div>
          <Skeleton className="own:h-control own:w-32 own:rounded-md" />
        </div>
      ))}
    </div>
  )
}

function ShareDialog({
  open,
  defaultOpen,
  onOpenChange,
  trigger,
  resource,
  link,
  roles: rolesProp,
  defaultInviteRole,
  people,
  loading,
  suggestions = [],
  organization,
  preview,
  accessLayout = 'select',
  access: accessProp,
  defaultAccess = { scope: 'restricted', role: 'viewer' },
  onAccessChange,
  readOnly,
  onInvite,
  onRoleChange,
  onRemove,
  onResend,
  onCancelInvite,
  onCopyLink,
  className,
}: ShareDialogProps) {
  const labels = useComponentLabels(shareDialogLabels)
  const roles = rolesProp ?? [
    { value: 'viewer', label: labels.shareDialogViewer },
    { value: 'commenter', label: labels.shareDialogCommenter },
    { value: 'editor', label: labels.shareDialogEditor },
  ]
  const { announce, announcer } = useAnnouncer()
  const input = useRef<HTMLInputElement>(null)
  const [confirmed, setAccess] = useControllableState(accessProp, defaultAccess)
  // A change shows at once and is confirmed when the handler resolves; a rejection puts the old value back.
  const [optimistic, setOptimistic] = useState<ShareAccess>()
  const access = optimistic ?? confirmed
  const accessAction = useAction()
  const [chips, setChips] = useState<Chip[]>([])
  const [inviteRole, setInviteRole] = useState(defaultInviteRole ?? roles[0]?.value ?? '')
  const [note, setNote] = useState('')
  const [sendError, setSendError] = useState<string>()
  const invalid = chips.some((chip) => chip.invalid)
  const switches = accessLayout === 'switches'

  const scopes: { scope: ShareScope; label: string; hint: string; icon: ReactNode }[] = [
    { scope: 'restricted', label: labels.shareDialogRestricted, hint: labels.shareDialogRestrictedHint, icon: <LockIcon /> },
    ...(organization
      ? [
          {
            scope: 'organization' as const,
            label: labels.shareDialogOrganization(organization),
            hint: labels.shareDialogOrganizationHint(organization),
            icon: <BuildingIcon />,
          },
        ]
      : []),
    { scope: 'anyone', label: labels.shareDialogAnyone, hint: labels.shareDialogAnyoneHint, icon: <GlobeIcon /> },
  ]
  const current = scopes.find((s) => s.scope === access.scope) ?? scopes[0]!
  const linkRoleLabel = roles.find((role) => role.value === access.role)?.label ?? access.role

  const changeAccess = async (next: ShareAccess) => {
    setOptimistic(next)
    const done = await accessAction.run(() => onAccessChange?.(next))
    if (done) setAccess(next)
    setOptimistic((shown) => (shown === next ? undefined : shown))
    if (!done) return
    const scope = scopes.find((s) => s.scope === next.scope)
    announce(
      labels.shareDialogAccessChanged(
        next.scope === 'restricted' ? (scope?.label ?? '') : `${scope?.label}, ${roles.find((role) => role.value === next.role)?.label ?? next.role}`,
      ),
    )
  }

  const copyLink = async () => {
    await navigator.clipboard.writeText(link)
    onCopyLink?.()
  }

  const send = (
    <AsyncButton
      disabled={chips.length === 0}
      pendingLabel={labels.shareDialogSending}
      successLabel={labels.shareDialogSent}
      onClick={(event) => {
        if (invalid) event.preventDefault()
      }}
      onAction={async () => {
        setSendError(undefined)
        const sent = chips.length
        try {
          await onInvite?.({ recipients: chips.map((chip) => chip.recipient), role: inviteRole, message: note.trim() || undefined })
        } catch (failure) {
          setSendError(message(failure, labels.shareDialogFailed))
          throw failure
        }
        setChips([])
        setNote('')
        announce(labels.shareDialogInvited(sent))
      }}
    >
      {labels.shareDialogSend}
    </AsyncButton>
  )

  const linkRole = (
    <RoleSelect
      roles={roles}
      value={access.role}
      label={labels.shareDialogLinkRole}
      onValueChange={(role) => role !== access.role && changeAccess({ ...access, role })}
    />
  )
  const switchRows = scopes.map((s) => {
    const on = access.scope === s.scope
    const restricted = s.scope === 'restricted'
    return (
      <SwitchRow
        key={s.scope}
        label={restricted ? labels.shareDialogInvitedOnly : s.label}
        hint={restricted ? labels.shareDialogPeopleCount(people.filter((person) => !person.pending).length) : s.hint}
        checked={on}
        // The invited-only row is the floor: turn another row on to leave it.
        readOnly={readOnly || (restricted && on)}
        onCheckedChange={(checked) => {
          if (checked === on) return
          void changeAccess({ ...access, scope: checked ? s.scope : 'restricted' })
        }}
      >
        {restricted ? (
          readOnly ? null : (
            <RoleSelect roles={roles} value={inviteRole} label={labels.shareDialogRole} onValueChange={setInviteRole} />
          )
        ) : (
          on && (readOnly ? <span className="shrink-0 own:px-2 own:text-ui own:text-fg-muted">{linkRoleLabel}</span> : linkRole)
        )}
      </SwitchRow>
    )
  })

  return (
    <Dialog open={open} defaultOpen={defaultOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent className={cn(switches ? 'max-w-lg' : 'max-w-xl', className)} initialFocus={readOnly ? undefined : input}>
        <DialogHeader>
          <DialogTitle className="own:truncate own:pe-8">{labels.shareDialogTitle(resource)}</DialogTitle>
        </DialogHeader>

        {preview && <PreviewCard preview={preview} />}

        {!readOnly && (
          <section data-slot="share-dialog-invite" className="own:flex flex-col own:gap-2">
            <div className="own:flex items-start own:gap-2">
              <RecipientField
                chips={chips}
                onChipsChange={(next) => {
                  setChips(next)
                  setSendError(undefined)
                }}
                suggestions={suggestions}
                people={people}
                inputRef={input}
                announce={announce}
              />
              {switches ? send : <RoleSelect roles={roles} value={inviteRole} label={labels.shareDialogRole} onValueChange={setInviteRole} />}
            </div>
            {!switches && (
              <div className="own:flex items-center own:gap-2">
                <Input
                  aria-label={labels.shareDialogMessage}
                  placeholder={labels.shareDialogMessage}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  className="min-w-0 flex-1"
                />
                {send}
              </div>
            )}
            {sendError && (
              <p role="alert" className="own:text-ui-sm own:font-medium own:text-danger-text">
                {sendError}
              </p>
            )}
          </section>
        )}

        <section data-slot="share-dialog-people" className="own:flex flex-col own:gap-1">
          <h3 className="own:text-ui own:font-medium text-fg">{labels.shareDialogPeople}</h3>
          <div aria-busy={loading || undefined} className={cn('overflow-y-auto yj-scrollbar', switches ? 'h-40' : 'h-52')}>
            {loading ? (
              <>
                <span role="status" className="sr-only">
                  {labels.shareDialogLoading}
                </span>
                <PeopleSkeleton />
              </>
            ) : (
              <PresenceList as="ul" aria-label={labels.shareDialogPeople}>
                {people.map((person) => (
                  <PresenceItem as="li" key={person.id}>
                    <PersonRow
                      person={person}
                      roles={roles}
                      readOnly={readOnly}
                      announce={announce}
                      onRoleChange={onRoleChange}
                      onRemove={onRemove}
                      onResend={onResend}
                      onCancelInvite={onCancelInvite}
                    />
                  </PresenceItem>
                ))}
              </PresenceList>
            )}
          </div>
        </section>

        <section data-slot="share-dialog-access" className="own:flex flex-col own:gap-1 own:border-t own:border-line own:pt-4">
          <h3 className="own:text-ui own:font-medium text-fg">{labels.shareDialogGeneral}</h3>
          {switches ? (
            switchRows
          ) : (
            <div className={rowClass}>
              {readOnly ? (
                <>
                  <AccessTile>{current.icon}</AccessTile>
                  <AccessText label={current.label} hint={current.hint} />
                  {access.scope !== 'restricted' && <span className="shrink-0 own:px-2 own:text-ui own:text-fg-muted">{linkRoleLabel}</span>}
                </>
              ) : (
                <>
                  <Select
                    items={scopes.map((s) => ({ value: s.scope, label: s.label }))}
                    value={access.scope}
                    onValueChange={(scope) => scope && scope !== access.scope && changeAccess({ ...access, scope })}
                  >
                    <SelectTrigger
                      variant="ghost"
                      aria-label={labels.shareDialogGeneral}
                      // shape: the general-access row opens its choices in place: a two-line row (icon, name, what it allows), so it grows past one control
                      className="own:-ms-2 data-[size=default]:h-auto min-h-12 min-w-0 flex-1 own:gap-3 own:py-1 own:ps-2 own:pe-2 text-start"
                    >
                      <AccessTile>{current.icon}</AccessTile>
                      <AccessText label={current.label} hint={current.hint} />
                    </SelectTrigger>
                    <SelectContent>
                      {scopes.map((s) => (
                        <SelectItem key={s.scope} value={s.scope}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {access.scope !== 'restricted' && (
                    <RoleSelect
                      roles={roles}
                      value={access.role}
                      label={labels.shareDialogLinkRole}
                      onValueChange={(role) => role !== access.role && changeAccess({ ...access, role })}
                    />
                  )}
                </>
              )}
            </div>
          )}
          {accessAction.error && (
            <p role="alert" className={cn('own:text-ui-sm own:font-medium own:text-danger-text', !switches && 'own:ps-11')}>
              {accessAction.error}
            </p>
          )}
        </section>

        <DialogFooter className="sm:justify-between">
          <AsyncButton
            variant="outline"
            pendingLabel={labels.shareDialogCopyLink}
            successLabel={labels.shareDialogCopied}
            errorLabel={labels.shareDialogCopyFailed}
            onAction={copyLink}
            onActionStateChange={(state) => state === 'success' && announce(labels.shareDialogLinkCopied)}
          >
            <LinkIcon />
            {labels.shareDialogCopyLink}
          </AsyncButton>
          <DialogClose render={<Button />}>{labels.shareDialogDone}</DialogClose>
        </DialogFooter>
        {announcer}
      </DialogContent>
    </Dialog>
  )
}

export {
  ShareDialog,
  type ShareAccess,
  type ShareDialogProps,
  type ShareInvite,
  type SharePerson,
  type SharePreview,
  type ShareRecipient,
  type ShareRole,
  type ShareScope,
  type ShareSuggestion,
}
