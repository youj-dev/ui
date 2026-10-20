import { memo, useMemo, useRef, type CSSProperties, type ReactNode } from 'react'
import { LaptopIcon, SmartphoneIcon, TabletIcon, UserPlusIcon } from '@youj/icons'
import { AvatarStack } from '@youj/react/components/ui/avatar-stack'
import { Badge } from '@youj/react/components/ui/badge'
import { Button } from '@youj/react/components/ui/button'
import { AsyncButton } from '@youj/react/components/ui/async-button'
import { DataTable } from '@youj/react/blocks/tables/data-table'
import { createDataTableColumnHelper } from '@youj/react/components/ui/data-table'
import { Switch } from '@youj/react/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@youj/react/components/ui/tabs'
import { ToggleGroup, ToggleGroupItem } from '@youj/react/components/ui/toggle-group'
import { mix, spring, tween } from '../lib/timing'
import { useAction, useFrame } from '../sim/simulation'
import { Backdrop } from '../film/backdrop'
import { Deferred } from '../film/bits'
import { Camera } from '../film/camera'
import { Cursor, type Point } from '../film/cursor'
import { useFormat, type Format } from '../film/format'
import { COMPONENTS_LOOP as C, TOPICS } from './beats'

/* Components, as a loop: the film's composition shot, on a screen of its
 * own. A security settings screen, whole; someone saves (Saving…, Saved, and
 * back). Then it comes apart: its surface, words and rules go, and its parts
 * (tabs, the team and Invite, two segmented controls, a switch, the sessions
 * table, Save) ease out to wait on their own spots. They fly back in, each
 * landing on the settle spring, the surface draws in around them, and the
 * screen is whole again, the frame the loop starts on.
 *
 * The parts are elements made once and moved by their wrappers, so nothing
 * inside them re-renders or re-measures as they fly. The words on screen are
 * all words: no counts, sizes or codes. */

const P = TOPICS.components.preroll

type PartId = 'tabs' | 'invite' | 'method' | 'idle' | 'twofactor' | 'table' | 'save'
/** The order they fly in (and, reversed, out). */
const FLIGHT: PartId[] = ['tabs', 'invite', 'method', 'idle', 'twofactor', 'table', 'save']

/** The screen, in its own px: a card centred on the stage. */
const CARD = { w: 600, h: 628, pad: 28 }

/** Where each part sits on the card: `x` from the start edge (or `right`, from the end edge), `y` its vertical centre. */
const SLOTS: Record<PartId, { x?: number; right?: number; y: number }> = {
  invite: { right: CARD.pad, y: 46 },
  tabs: { x: CARD.pad - 10, y: 116 },
  method: { right: CARD.pad, y: 192 },
  idle: { right: CARD.pad, y: 262 },
  twofactor: { right: CARD.pad, y: 332 },
  table: { x: CARD.pad, y: 480 },
  save: { right: CARD.pad, y: 592 },
}

/**
 * Where each part waits, as an offset from its place on the card, per stage.
 * Wide, the parts stand in two loose columns either side of where the screen
 * will be, heights interleaved; tall, the screen is pulled apart along its
 * length; on the tile strip, the same columns drawn in close enough that the
 * narrowest tile still sees them.
 */
function apart(format: Format): Record<PartId, { x: number; y: number }> {
  if (format.tall)
    return {
      invite: { x: 3, y: -272 },
      tabs: { x: -23, y: -232 },
      method: { x: 18, y: -128 },
      idle: { x: -347, y: -8 },
      twofactor: { x: -4, y: 102 },
      table: { x: -60, y: 164 },
      save: { x: 21, y: 262 },
    }
  if (format.tile)
    return {
      invite: { x: 253, y: 18 },
      tabs: { x: -303, y: -22 },
      method: { x: 298, y: 62 },
      idle: { x: -597, y: 32 },
      twofactor: { x: 146, y: 92 },
      table: { x: -330, y: 74 },
      save: { x: 221, y: -18 },
    }
  return {
    invite: { x: 293, y: -2 },
    tabs: { x: -353, y: -52 },
    method: { x: 348, y: 12 },
    idle: { x: -657, y: -8 },
    twofactor: { x: 166, y: 42 },
    table: { x: -420, y: 24 },
    save: { x: 261, y: -28 },
  }
}

/** The camera's scale apart and together, per stage: the screen fills most of the frame once it has formed. */
function lensFor(format: Format) {
  if (format.tall) return { apart: 0.85, together: 1.22 }
  if (format.tile) return { apart: 0.46, together: 0.66 }
  return { apart: 0.9, together: 1.12 }
}

export function ComponentsLoop() {
  const frame = useFrame()
  const format = useFormat()
  const { width, height } = format
  const cx = width / 2
  const cy = height / 2
  const lens = lensFor(format)
  const offsets = apart(format)
  const root = useRef<HTMLDivElement>(null)
  const saved = useRef(new Deferred())
  useAction(P + C.saved, () => saved.current.resolve())

  // Made once: see the note at the top.
  const parts = useMemo<Record<PartId, ReactNode>>(
    () => ({
      tabs: <TabsPart />,
      invite: <InvitePart />,
      method: <Segmented label="Sign-in method" items={['Password', 'Passkey', 'SSO']} value="Passkey" />,
      idle: <Segmented label="Sign out when idle" items={['Hourly', 'Daily', 'Weekly']} value="Daily" />,
      twofactor: <Switch defaultChecked tabIndex={-1} aria-label="Require two-factor" />,
      table: <SessionsPart />,
      save: (
        <AsyncButton size="lg" onAction={() => saved.current.promise} pendingLabel="Saving…" successLabel="Saved" tabIndex={-1}>
          Save changes
        </AsyncButton>
      ),
    }),
    [],
  )
  const chromeEl = useMemo(() => <Chrome />, [])

  // The camera leans back as the screen parts, and in again as it forms.
  const lean = 1 - tween(frame, P + C.leanOut, C.leanOutLength, 'emphasized') + tween(frame, P + C.lean, C.leanLength, 'emphasized')
  const scale = mix(lens.apart, lens.together, lean)
  const chrome = 1 - tween(frame, P + C.unwind, 'slow', 'exit') + tween(frame, P + C.chrome, 'deliberate', 'enter')

  /** 1 on the card, 0 apart: out on the smooth spring, back in on the settle one, each part in its turn. */
  const placed = (id: PartId) => {
    const i = FLIGHT.indexOf(id)
    const out = spring(frame, P + C.part + (FLIGHT.length - 1 - i) * C.partStagger, 'smooth')
    const into = spring(frame, P + C.gather + i * C.stagger, 'settle')
    return 1 - out + into
  }

  const card = { x: cx - CARD.w / 2, y: cy - CARD.h / 2 }
  const find = (selector: string, dx = 0.5, dy = 0.5) => (): Point | null => {
    const el = root.current?.querySelector(selector)
    if (!el) return null
    const r = el.getBoundingClientRect()
    return { x: r.left + r.width * dx, y: r.top + r.height * dy }
  }

  return (
    <div ref={root} className="absolute inset-0">
      <Backdrop grid={0.7} glow={0.3} glowAt={{ x: 50, y: 50 }} />
      <Camera shot={{ scale, x: cx * (1 - scale), y: cy * (1 - scale), originX: 0, originY: 0 }}>
        <div className="absolute" style={{ left: card.x, top: card.y, width: CARD.w, height: CARD.h }}>
          <Fade show={chrome}>{chromeEl}</Fade>
          {FLIGHT.map((id) => {
            const slot = SLOTS[id]
            const t = placed(id)
            const off = offsets[id]
            const style: CSSProperties = {
              top: slot.y,
              ...(slot.right === undefined ? { left: slot.x } : { right: slot.right }),
              transform: `translate(${(1 - t) * off.x}px, calc(-50% + ${(1 - t) * off.y}px))`,
            }
            return (
              <div key={id} data-part={id} className="absolute" style={style}>
                {parts[id]}
              </div>
            )
          })}
        </div>
      </Camera>
      <Cursor
        start={{ x: cx + CARD.w * 0.62 * scale, y: height + 40 }}
        size={() => scale * 0.9}
        show={[P + C.reach - 4, P + C.away + 30]}
        moves={[
          { at: P + C.reach, to: find('[data-part=save] button', 0.66, 0.55), frames: C.press - C.reach - 4, press: 'click', after: 4 },
          { at: P + C.away, to: { x: cx + CARD.w * 0.6 * scale, y: height + 60 }, frames: 40 },
        ]}
      />
    </div>
  )
}

/** Fades what it holds without re-rendering it. */
function Fade({ show, children }: { show: number; children: ReactNode }) {
  if (show <= 0) return null
  return <div className="absolute inset-0" style={{ opacity: show, transform: `scale(${mix(0.985, 1, show)})` }}>{children}</div>
}

/* ── The parts ─────────────────────────────────────────────────────────── */

function TabsPart() {
  return (
    <Tabs defaultValue="security">
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

const TEAM = [
  { id: 'mira', name: 'Mira Chen' },
  { id: 'jonas', name: 'Jonas Weber' },
  { id: 'ines', name: 'Inês Duarte' },
  { id: 'kofi', name: 'Kofi Mensah' },
]

function InvitePart() {
  return (
    <div className="flex items-center gap-3">
      <AvatarStack users={TEAM} max={TEAM.length} size="sm" label="Team" />
      <Button variant="outline" size="sm" tabIndex={-1}>
        <UserPlusIcon size={14} strokeWidth={1.75} />
        Invite
      </Button>
    </div>
  )
}

function Segmented({ label, items, value }: { label: string; items: string[]; value: string }) {
  return (
    <ToggleGroup variant="segmented" value={[value]} aria-label={label}>
      {items.map((item) => (
        <ToggleGroupItem key={item} value={item} tabIndex={-1} className="px-3">
          {item}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}

interface Session {
  id: string
  device: string
  kind: 'laptop' | 'phone' | 'tablet'
  seen: string
  current?: boolean
}

const SESSIONS: Session[] = [
  { id: 'mac', device: 'MacBook Pro', kind: 'laptop', seen: 'Now', current: true },
  { id: 'ipad', device: 'iPad Air', kind: 'tablet', seen: 'Today' },
  { id: 'phone', device: 'Pixel', kind: 'phone', seen: 'Last week' },
]
const KIND = { laptop: LaptopIcon, phone: SmartphoneIcon, tablet: TabletIcon }
const col = createDataTableColumnHelper<Session>()
const TABLE_WIDTH = CARD.w - CARD.pad * 2

function SessionsPart() {
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
        col.accessor('seen', { header: 'Last active', size: 150 }),
      ]),
    [],
  )
  return (
    <div style={{ width: TABLE_WIDTH }}>
      <DataTable<Session>
        fill
        label="Active sessions"
        copy={{ noun: 'sessions' }}
        rows={SESSIONS}
        columns={columns}
        getRowId={(s) => s.id}
        getRowLabel={(s) => s.device}
        showFilters={false}
        showColumnsMenu={false}
        showDensityToggle={false}
        headerMenus={false}
        paginated={false}
        enableSorting={false}
      />
    </div>
  )
}

/* ── The screen around them ────────────────────────────────────────────── */

/** Everything on the card that isn't a part: the surface, the words and the rules. */
const Chrome = memo(function Chrome() {
  const rows = [
    { y: SLOTS.method.y, label: 'Sign-in method', detail: 'How people get into Northwind.' },
    { y: SLOTS.idle.y, label: 'Sign out when idle', detail: 'Ends sessions left open.' },
    { y: SLOTS.twofactor.y, label: 'Require two-factor', detail: 'For everyone, at next sign-in.' },
  ]
  return (
    <>
      <div className="absolute inset-0 rounded-xl border border-line bg-surface shadow-lg" />
      <div className="absolute flex flex-col gap-1" style={{ left: CARD.pad, top: 26 }}>
        <h3 className="text-[17px] leading-tight font-semibold tracking-[-0.01em] text-fg">Security</h3>
        <p className="text-ui text-fg-muted">Sign-in and sessions for Northwind.</p>
      </div>
      {rows.map((row, i) => (
        <div key={row.label}>
          <div className="absolute flex flex-col gap-0.5" style={{ left: CARD.pad, top: row.y - 19 }}>
            <span className="text-ui font-medium text-fg">{row.label}</span>
            <span className="text-ui-sm text-fg-muted">{row.detail}</span>
          </div>
          {i < rows.length - 1 && <span aria-hidden className="absolute h-px bg-line" style={{ left: CARD.pad, right: CARD.pad, top: (row.y + rows[i + 1]!.y) / 2 }} />}
        </div>
      ))}
      <p className="absolute text-ui font-medium text-fg" style={{ left: CARD.pad, top: 372 }}>
        Active sessions
      </p>
      <div className="absolute flex" style={{ right: CARD.pad + 146, top: SLOTS.save.y, transform: 'translateY(-50%)' }}>
        <Button variant="ghost" size="lg" tabIndex={-1}>
          Cancel
        </Button>
      </div>
    </>
  )
})
