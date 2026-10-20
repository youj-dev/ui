import { useState } from 'react'
import { motion } from 'motion/react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import {
  BluetoothIcon,
  CastIcon,
  CheckIcon,
  CloudLightningIcon,
  CloudRainIcon,
  CloudSunIcon,
  CrosshairIcon,
  FastForwardIcon,
  FilmIcon,
  FlagIcon,
  GlobeIcon,
  HeadphonesIcon,
  KeyboardIcon,
  LaptopIcon,
  LightbulbIcon,
  MapIcon,
  MapPinIcon,
  MonitorIcon,
  MouseIcon,
  NavigationIcon,
  PinIcon,
  PlayIcon,
  PuzzleIcon,
  ResponsiveIcon,
  RewindIcon,
  RocketIcon,
  RouteIcon,
  SkipBackIcon,
  SkipForwardIcon,
  SlidersIcon,
  SmartphoneIcon,
  SnowflakeIcon,
  TabletIcon,
  ThermometerIcon,
  TrophyIcon,
  UmbrellaIcon,
  VolumeIcon,
  WatchIcon,
  WindIcon,
  type YoujIconComponent,
} from './index'
import { Button, ease, focusRing, IconButton, Panel, Stage, useLater } from './story-kit'

const meta = {
  title: 'Icons/In context/Devices, location & weather',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The devices, location, weather, media and system icons inside real UI. Rows and cards are `data-yj-trigger` groups, so hovering or keyboard-focusing anywhere in them plays their icon. State icons follow the state of their control: a paired accessory shows the connected rune, a delivered order turns the courier arrow into a pin, the forecast swells the cloud over the sun, publishing launches the rocket. Switch the toolbar to "Motion: reduced" and every state still reads, instantly.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */


function Switch({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={cn('relative h-6 w-10 shrink-0 rounded-full', ease, focusRing, on ? 'bg-accent' : 'bg-well ring-1 ring-line ring-inset')}
    >
      <span
        className={cn(
          'absolute start-0.5 top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-(--yj-duration-base) ease-standard',
          on && 'translate-x-4 rtl:-translate-x-4',
        )}
      />
    </button>
  )
}

function Segmented<T extends string>({ value, options, onChange, label }: { value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; label: string }) {
  return (
    <div role="radiogroup" aria-label={label} className="flex rounded-lg bg-well p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('h-7 rounded-md px-2.5 text-xs font-medium', ease, focusRing, value === o.value ? 'bg-key text-fg shadow-sm' : 'text-fg-muted hover:text-fg')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function Tile({ Icon, className }: { Icon: YoujIconComponent; className?: string }) {
  return (
    <span className={cn('flex size-9 shrink-0 items-center justify-center rounded-lg bg-well text-fg-muted', className)}>
      <Icon size={18} />
    </span>
  )
}

/* ── Devices ─────────────────────────────────────────────────────────────── */

const SESSIONS = [
  { id: 'mbp', Icon: LaptopIcon, name: 'MacBook Pro 14″', detail: 'Chrome on macOS · Lisbon, PT', when: 'Active now', current: true },
  { id: 'studio', Icon: MonitorIcon, name: 'Studio desktop', detail: 'youj for macOS · Lisbon, PT', when: '2 h ago' },
  { id: 'iphone', Icon: SmartphoneIcon, name: 'iPhone 16', detail: 'Safari on iOS · Porto, PT', when: 'Yesterday' },
  { id: 'ipad', Icon: TabletIcon, name: 'iPad Air', detail: 'youj for iPadOS · Berlin, DE', when: '3 days ago' },
  { id: 'watch', Icon: WatchIcon, name: 'Apple Watch Series 10', detail: 'Notifications only · paired with iPhone 16', when: 'Today' },
]
const ACCESSORIES = [
  { id: 'airpods', Icon: HeadphonesIcon, name: 'AirPods Pro', detail: 'Battery 84%' },
  { id: 'keyboard', Icon: KeyboardIcon, name: 'Magic Keyboard', detail: 'Battery 62%' },
  { id: 'mouse', Icon: MouseIcon, name: 'MX Master 3S', detail: 'Last used 2 days ago' },
]
type Link = 'off' | 'pairing' | 'on'

function DevicesDemo() {
  const k = useYouj()
  const later = useLater()
  const [signedIn, setSignedIn] = useState(SESSIONS.map((s) => s.id))
  const [pinned, setPinned] = useState<Record<string, boolean>>({ mbp: true })
  const [links, setLinks] = useState<Record<string, Link>>({ airpods: 'on', keyboard: 'on', mouse: 'off' })
  const [alerts, setAlerts] = useState<'ring' | 'vibrate'>('vibrate')
  const sessions = SESSIONS.filter((s) => signedIn.includes(s.id)).sort((a, b) => Number(Boolean(pinned[b.id])) - Number(Boolean(pinned[a.id])))

  const toggleLink = (id: string) => {
    if (links[id] !== 'off') return setLinks((l) => ({ ...l, [id]: 'off' }))
    setLinks((l) => ({ ...l, [id]: 'pairing' }))
    later(() => setLinks((l) => ({ ...l, [id]: 'on' })), 2)
  }

  return (
    <Stage>
      <Panel className="w-full max-w-[600px]">
        <header className="flex items-start gap-3 border-b border-line px-5 py-4">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-fg">Devices</h2>
            <p className="mt-0.5 text-[13px] text-fg-muted">Where you’re signed in, and what’s paired with this Mac.</p>
          </div>
          <IconButton label="Filter devices" className="-me-2">
            <SlidersIcon size={18} />
          </IconButton>
        </header>

        <section aria-label="Sessions">
          <p className="px-5 pt-4 pb-1 text-xs font-medium text-fg-muted">Sessions</p>
          <ul>
            {sessions.map(({ id, Icon, name, detail, when, current }) => (
              <motion.li key={id} layout="position" transition={k.spring('smooth')} data-yj-trigger className={cn('flex items-center gap-3 px-5 py-2.5 hover:bg-hover', ease)}>
                <Tile Icon={Icon} className={current ? 'text-accent' : undefined} />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm text-fg">
                    <span className="truncate">{name}</span>
                    {current && <span className="shrink-0 rounded-full bg-well px-1.5 py-px text-[11px] font-medium text-fg-muted">This device</span>}
                  </p>
                  <p className="truncate text-xs text-fg-muted">
                    {detail} · {when}
                  </p>
                </div>
                {!current && (
                  <Button variant="danger" className="h-8 px-2.5 text-xs" onClick={() => setSignedIn((s) => s.filter((x) => x !== id))}>
                    Sign out
                  </Button>
                )}
                <IconButton label={`Pin ${name}`} aria-pressed={Boolean(pinned[id])} onClick={() => setPinned((p) => ({ ...p, [id]: !p[id] }))} className={cn('-me-2', pinned[id] && 'text-fg')}>
                  <PinIcon size={16} active={Boolean(pinned[id])} />
                </IconButton>
              </motion.li>
            ))}
          </ul>
          {sessions.length === 1 && <p className="px-5 pb-3 text-xs text-fg-muted">You’re only signed in on this Mac.</p>}
        </section>

        <section aria-label="Accessories" className="border-t border-line">
          <p className="px-5 pt-4 pb-1 text-xs font-medium text-fg-muted">Accessories</p>
          <ul>
            {ACCESSORIES.map(({ id, Icon, name, detail }) => {
              const link = links[id]!
              return (
                <li key={id} data-yj-trigger className={cn('flex items-center gap-3 px-5 py-2.5 hover:bg-hover', ease)}>
                  <Tile Icon={Icon} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-fg">{name}</p>
                    <p className="truncate text-xs text-fg-muted">{link === 'on' ? detail : link === 'pairing' ? 'Pairing…' : 'Not connected'}</p>
                  </div>
                  <Button
                    aria-label={`${link === 'on' ? 'Disconnect' : 'Connect'} ${name}`}
                    aria-busy={link === 'pairing'}
                    onClick={() => toggleLink(id)}
                    className={cn('h-8 min-w-[124px] justify-center px-2.5 text-xs', link === 'on' && 'text-accent')}
                  >
                    <BluetoothIcon size={15} active={link === 'on'} />
                    {link === 'on' ? 'Connected' : link === 'pairing' ? 'Connecting…' : 'Connect'}
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>

        <footer className="flex flex-wrap items-center gap-3 border-t border-line px-5 py-4">
          <SmartphoneIcon size={18} active={alerts === 'vibrate'} className="text-fg-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg">Alerts on your phone</p>
            <p className="text-xs text-fg-muted">{alerts === 'vibrate' ? 'Vibrate only, even when the ringer is on' : 'Ring with the default sound'}</p>
          </div>
          <Segmented
            label="Alerts on your phone"
            value={alerts}
            onChange={setAlerts}
            options={[
              { value: 'ring', label: 'Ring' },
              { value: 'vibrate', label: 'Vibrate' },
            ]}
          />
        </footer>
      </Panel>
    </Stage>
  )
}

export const Devices: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A sessions list. Hover a row to play its device: the lid closes and opens, the phone buzzes, the tablet turns. Pin ↔ pinned, bluetooth ↔ connected (with a pairing beat) and ring ↔ vibrate follow their controls.',
      },
    },
  },
  render: () => <DevicesDemo />,
}

/* ── Delivery ────────────────────────────────────────────────────────────── */

/* Map geometry in its own 360×168 box; markers are placed by percentage. */
const ROUTE = 'M40 104 C92 104 112 62 180 64 S 262 40 300 42'
const COURIER = { x: 180, y: 64, heading: 2 }
const DOOR = { x: 300, y: 42 }
const pct = (x: number, y: number) => ({ left: `${(x / 360) * 100}%`, top: `${(y / 168) * 100}%` })

function DeliveryDemo() {
  const k = useYouj()
  const later = useLater()
  const [delivered, setDelivered] = useState(false)
  const [following, setFollowing] = useState(true)
  const [pinDropped, setPinDropped] = useState(false)
  const [reported, setReported] = useState(false)
  const [busy, setBusy] = useState(false)
  const courier = delivered ? DOOR : COURIER
  /* The arrow is centered on the courier; once it has arrived, the pin's point sits on the door. */
  const marker = 20

  const advance = () => {
    if (delivered) return setDelivered(false)
    setBusy(true)
    later(() => {
      setDelivered(true)
      setBusy(false)
    }, 1.5)
  }

  const steps = [
    { label: 'Order placed', detail: 'Mon 09:12', Icon: CheckIcon, done: true },
    { label: 'Shipped from Lisbon', detail: 'Crossed into Spain on Tuesday', Icon: GlobeIcon, done: true },
    { label: 'Out for delivery', detail: delivered ? 'Courier: Marta' : 'Marta · 2 stops away', Icon: RouteIcon, done: true },
    { label: 'Delivered', detail: delivered ? 'Handed to resident · 14:32' : 'Expected 14:20–14:40', Icon: MapPinIcon, done: delivered },
  ]

  return (
    <Stage>
      <Panel className="w-full max-w-[400px] overflow-hidden">
        <header className="flex items-start gap-3 px-5 pt-5 pb-4">
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[11px] text-fg-muted">Order #4821</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-fg">{delivered ? 'Delivered at 14:32' : 'Arriving today, 14:20–14:40'}</h2>
          </div>
          <span data-yj-trigger className="mt-0.5 inline-flex h-6 items-center gap-1.5 rounded-full bg-well px-2 text-[11px] font-medium text-fg-muted">
            <RocketIcon size={13} strokeWidth={1.75} />
            Express
          </span>
        </header>

        <div className="relative mx-5 aspect-[360/168] overflow-hidden rounded-xl border border-line bg-canvas">
          <svg viewBox="0 0 360 168" className="absolute inset-0 size-full" fill="none" role="img" aria-label={delivered ? 'Map: the courier has arrived at your door' : 'Map: the courier is two stops away'}>
            <g className="text-line" stroke="currentColor" strokeWidth={10} strokeLinecap="round">
              <path d="M-10 104 H370 M120 -10 V178 M250 -10 V178 M-10 20 H370" />
            </g>
            <g className="text-fg-subtle" stroke="currentColor" strokeLinecap="round">
              <path d={ROUTE} strokeWidth={2.5} strokeDasharray="0.5 6" />
            </g>
            <circle cx="40" cy="104" r="4" className="fill-surface stroke-fg-subtle" strokeWidth={2} />
            <circle cx={DOOR.x} cy={DOOR.y} r="4" className="fill-surface stroke-fg" strokeWidth={2} />
          </svg>
          {/* Position changes are a layout animation (transform-based); the heading turns with it. */}
          <motion.span
            layout
            className="absolute text-accent"
            style={{ ...pct(courier.x, courier.y), width: marker, height: marker, marginLeft: -marker / 2, marginTop: -marker / 2 }}
            initial={false}
            animate={{ y: delivered ? -marker * (8 / 24) : 0, rotate: delivered ? 0 : COURIER.heading + 45 }}
            transition={k.spring('smooth')}
          >
            <NavigationIcon size={marker} strokeWidth={1.75} active={delivered} aria-label={delivered ? 'Courier arrived' : 'Courier'} />
          </motion.span>
          <IconButton
            label="Follow courier"
            aria-pressed={following}
            onClick={() => setFollowing((f) => !f)}
            variant="secondary"
            className={cn('absolute end-2 bottom-2 size-7 rounded-md', following && 'text-accent')}
          >
            <CrosshairIcon size={15} active={following} />
          </IconButton>
          <a href="#" onClick={(e) => e.preventDefault()} className={cn('absolute start-2 bottom-2 inline-flex h-7 items-center gap-1.5 rounded-md border border-line bg-surface px-2 text-xs font-medium text-fg-muted hover:text-fg', ease, focusRing)}>
            <MapIcon size={14} />
            Open in Maps
          </a>
        </div>

        <ol className="px-5 pt-4">
          {steps.map(({ label, detail, Icon, done }, i) => (
            <li key={label} data-yj-trigger className="relative flex gap-3 pb-4 last:pb-2">
              {i < steps.length - 1 && <span className={cn('absolute start-[11px] top-7 bottom-1 w-px', done && steps[i + 1]!.done ? 'bg-fg-subtle' : 'bg-line')} aria-hidden />}
              <span className={cn('flex size-6 shrink-0 items-center justify-center rounded-full border', done ? 'border-transparent bg-well text-fg' : 'border-line text-fg-subtle')}>
                <Icon size={14} strokeWidth={1.75} active={Icon === MapPinIcon ? delivered : undefined} />
              </span>
              <div className="min-w-0 pt-0.5">
                <p className={cn('text-sm', done ? 'text-fg' : 'text-fg-muted')}>{label}</p>
                <p className="truncate text-xs text-fg-muted">{detail}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mx-5 flex items-center gap-3 rounded-xl bg-well px-3 py-2.5">
          <MapPinIcon size={18} active={pinDropped} className={pinDropped ? 'text-accent' : 'text-fg-muted'} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-fg">Rua das Flores 28, 2º Esq.</p>
            <p className="truncate text-xs text-fg-muted">{pinDropped ? 'The courier will see your pin' : 'Hard to find? Pin the entrance'}</p>
          </div>
          <Button className={cn('h-8 px-2.5 text-xs', pinDropped && 'text-accent')} aria-pressed={pinDropped} onClick={() => setPinDropped((p) => !p)}>
            Drop pin
          </Button>
        </div>

        <footer className="flex flex-wrap items-center gap-2 p-5">
          <Button variant="ghost" aria-pressed={reported} onClick={() => setReported((r) => !r)} className={cn('-ms-2', reported && 'text-warning hover:text-warning')}>
            <FlagIcon size={16} active={reported} />
            Report a problem
          </Button>
          <Button variant="primary" onClick={advance} disabled={busy} className="ms-auto min-w-[148px] justify-center disabled:pointer-events-none">
            {delivered ? 'Replay delivery' : busy ? 'Arriving…' : 'Simulate arrival'}
          </Button>
        </footer>
      </Panel>
    </Stage>
  )
}

export const Delivery: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A tracking card. On arrival the courier arrow swings down and swells into a pin on the door, and the timeline pin drops. Follow courier (locate ↔ locked), drop a pin for the entrance and report a problem (flag ↔ flagged) follow their controls.',
      },
    },
  },
  render: () => <DeliveryDemo />,
}

/* ── Weather ─────────────────────────────────────────────────────────────── */

function WeatherDemo() {
  const [when, setWhen] = useState<'now' | 'later'>('now')
  const [heating, setHeating] = useState(false)
  const [lights, setLights] = useState(true)
  const rain = when === 'later'
  const hours: { time: string; Icon: YoujIconComponent; temp: string; label: string }[] = [
    { time: '15:00', Icon: CloudRainIcon, temp: '16°', label: 'Showers' },
    { time: '16:00', Icon: CloudLightningIcon, temp: '15°', label: 'Thunderstorms' },
    { time: '17:00', Icon: WindIcon, temp: '15°', label: 'Windy' },
    { time: '18:00', Icon: CloudSunIcon, temp: '14°', label: 'Clearing' },
  ]

  return (
    <Stage>
      <div className="flex w-full max-w-[680px] flex-col items-center gap-4 md:flex-row md:items-start">
      <Panel className="w-full max-w-[360px] p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-fg">Lisbon</p>
          <Segmented
            label="Forecast time"
            value={when}
            onChange={setWhen}
            options={[
              { value: 'now', label: 'Now' },
              { value: 'later', label: '15:00' },
            ]}
          />
        </div>
        <div className="mt-5 flex items-center gap-5">
          <CloudSunIcon size={64} strokeWidth={1.25} active={rain} aria-label={rain ? 'Showers' : 'Sun and clouds'} className="text-fg" />
          <div>
            <p className="text-4xl font-semibold tracking-tight text-fg tabular-nums">{rain ? '16°' : '19°'}</p>
            <p className="text-[13px] text-fg-muted">{rain ? 'Showers until early evening' : 'Sun and clouds, turning wet'}</p>
          </div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-2 text-xs">
          <div data-yj-trigger className="flex items-center gap-2 rounded-lg bg-well px-2.5 py-2 text-fg-muted">
            <WindIcon size={16} />
            <dt className="sr-only">Wind</dt>
            <dd>NW 14 km/h</dd>
          </div>
          <div data-yj-trigger className="flex items-center gap-2 rounded-lg bg-well px-2.5 py-2 text-fg-muted">
            <UmbrellaIcon size={16} />
            <dt className="sr-only">Chance of rain</dt>
            <dd>{rain ? 'Rain 80%' : 'Rain 20%'}</dd>
          </div>
        </dl>
        <ul className="mt-4 grid grid-cols-4 gap-1 border-t border-line pt-4" aria-label="Next hours">
          {hours.map(({ time, Icon, temp, label }) => (
            <li key={time} data-yj-trigger className={cn('flex flex-col items-center gap-2 rounded-lg py-2 text-fg-muted hover:bg-hover hover:text-fg', ease)}>
              <span className="font-mono text-[11px] text-fg-muted">{time}</span>
              <Icon size={20} aria-label={label} />
              <span className="text-xs text-fg tabular-nums">{temp}</span>
            </li>
          ))}
        </ul>
        <div data-yj-trigger className="mt-3 flex items-center gap-3 rounded-lg px-2 py-2 text-fg-muted">
          <SnowflakeIcon size={18} />
          <p className="min-w-0 flex-1 truncate text-xs">Snow in Serra da Estrela this weekend</p>
          <span className="text-xs text-fg tabular-nums">−2°</span>
        </div>
      </Panel>

      <Panel className="w-full max-w-[300px]">
        <p className="px-4 pt-4 pb-1 text-xs font-medium text-fg-muted">Home</p>
        <div className="flex items-center gap-3 px-4 py-3">
          <ThermometerIcon size={20} active={heating} className={heating ? 'text-accent' : 'text-fg-muted'} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg">Heating</p>
            <p className="text-xs text-fg-muted tabular-nums">{heating ? 'Warming to 21°, 18° now' : 'Off · 18° inside'}</p>
          </div>
          <Switch on={heating} onChange={() => setHeating((h) => !h)} label="Heating" />
        </div>
        <div className="flex items-center gap-3 border-t border-line px-4 py-3">
          <LightbulbIcon size={20} active={lights} className={lights ? 'text-fg' : 'text-fg-muted'} />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg">Living room lights</p>
            <p className="text-xs text-fg-muted">{lights ? '3 lamps on · 70%' : 'Off'}</p>
          </div>
          <Switch on={lights} onChange={() => setLights((l) => !l)} label="Living room lights" />
        </div>
      </Panel>
      </div>
    </Stage>
  )
}

export const Weather: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A weather widget with home controls. Switching the forecast to 15:00 swells the cloud over the sun and starts the rain; hover an hour to play its icon. Heating (low ↔ high) and lights (off ↔ on) follow their switches.',
      },
    },
  },
  render: () => <WeatherDemo />,
}

/* ── Player ──────────────────────────────────────────────────────────────── */

function PlayerDemo() {
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(false)
  const [casting, setCasting] = useState(false)
  return (
    <Stage>
      <div className="flex w-full max-w-[980px] flex-col gap-3">
        <div className="relative flex aspect-[21/9] items-center justify-center overflow-hidden rounded-2xl border border-line bg-well">
          {/* A poster in two strokes: the planet's limb and the orbit it's named for. */}
          <svg viewBox="0 0 420 180" className="absolute inset-0 size-full" fill="none" preserveAspectRatio="xMidYMid slice" aria-hidden>
            <circle cx="210" cy="430" r="300" className="stroke-line-strong" strokeWidth={1} />
            <ellipse cx="210" cy="150" rx="190" ry="34" className="stroke-line" strokeWidth={1} />
            <circle cx="341" cy="126" r="3" className="fill-fg-subtle" />
          </svg>
          {casting ? (
            <div role="status" className="relative flex flex-col items-center gap-3 text-center">
              <CastIcon size={36} strokeWidth={1.25} active className="text-accent" />
              <p className="text-sm font-medium text-fg">Playing on Living room TV</p>
              <Button variant="secondary" className="h-8 px-2.5 text-xs" onClick={() => setCasting(false)}>
                Disconnect
              </Button>
            </div>
          ) : (
            <p className="relative font-mono text-[11px] tracking-[0.5em] text-fg-muted uppercase">Low Orbit</p>
          )}
        </div>
        <Panel className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl p-3 md:flex-nowrap">
          <div data-yj-trigger className="flex min-w-0 flex-1 items-center gap-3 md:w-64 md:flex-none">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-well text-fg-muted">
              <FilmIcon size={22} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-fg">Low Orbit: official trailer</p>
              <p className="truncate text-xs text-fg-muted">{casting ? 'Playing on Living room TV' : 'Mira Sol · Satellites'}</p>
            </div>
          </div>

          <div className="order-last flex w-full flex-col items-center gap-1.5 md:order-none md:flex-1">
            <div className="flex items-center gap-1">
              <IconButton label="Previous">
                <SkipBackIcon size={17} />
              </IconButton>
              <IconButton label="Back 10 seconds">
                <RewindIcon size={18} />
              </IconButton>
              <button
                type="button"
                aria-label={playing ? 'Pause' : 'Play'}
                onClick={() => setPlaying((p) => !p)}
                className={cn('mx-1 flex size-10 items-center justify-center rounded-full bg-fg text-canvas hover:opacity-90', ease, focusRing)}
              >
                <PlayIcon size={18} strokeWidth={1.75} active={playing} />
              </button>
              <IconButton label="Forward 10 seconds">
                <FastForwardIcon size={18} />
              </IconButton>
              <IconButton label="Next">
                <SkipForwardIcon size={17} />
              </IconButton>
            </div>
            <div className="flex w-full max-w-[460px] items-center gap-2.5">
              <span className="w-9 text-end font-mono text-[11px] text-fg-muted">1:12</span>
              <div className="relative h-1 flex-1 rounded-full bg-well">
                <div className="absolute inset-y-0 start-0 w-[58%] rounded-full bg-line-strong" />
                <div className="absolute inset-y-0 start-0 w-[32%] rounded-full bg-fg" />
              </div>
              <span className="w-9 font-mono text-[11px] text-fg-muted">3:48</span>
            </div>
          </div>

          <div className="flex items-center gap-0.5 md:w-64 md:justify-end">
            <IconButton label="Output: AirPods Pro">
              <HeadphonesIcon size={17} />
            </IconButton>
            <IconButton label="Cast to Living room TV" aria-pressed={casting} onClick={() => setCasting((c) => !c)} className={casting ? 'text-accent hover:text-accent' : undefined}>
              <CastIcon size={17} active={casting} />
            </IconButton>
            <IconButton label="Audio and subtitles">
              <SlidersIcon size={17} />
            </IconButton>
            <IconButton label="Mute" aria-pressed={muted} onClick={() => setMuted((m) => !m)}>
              <VolumeIcon size={17} active={muted} />
            </IconButton>
          </div>
        </Panel>
      </div>
    </Stage>
  )
}

export const Player: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A media player bar. Hover the transport: skip-back leaps into its bar, rewind and fast-forward surge twice, the film strip advances a frame. Cast (idle ↔ casting), play ↔ pause and volume ↔ muted follow their buttons.',
      },
    },
  },
  render: () => <PlayerDemo />,
}

/* ── Launch ──────────────────────────────────────────────────────────────── */

const TASKS = ['Connect northwind.studio', 'Add a social preview image', 'Run the accessibility check']

function LaunchDemo() {
  const later = useLater()
  const [mobile, setMobile] = useState(false)
  const [landscape, setLandscape] = useState(false)
  const [tips, setTips] = useState(false)
  const [done, setDone] = useState<boolean[]>([true, true, false])
  const [publish, setPublish] = useState<'idle' | 'publishing' | 'live'>('idle')
  const earned = done.every(Boolean)
  const narrow = mobile && !landscape
  const frame = !mobile ? 'h-[260px] w-full max-w-[440px]' : landscape ? 'h-[170px] w-[300px]' : 'h-[270px] w-[150px]'

  const go = () => {
    if (publish !== 'idle') return setPublish('idle')
    setPublish('publishing')
    later(() => setPublish('live'), 2.5)
  }

  return (
    <Stage>
      <Panel className="w-full max-w-[860px] overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line p-2">
          <span className="ms-1 me-2 text-sm font-semibold tracking-tight text-fg">Northwind</span>
          <Button variant="ghost" className="h-8 px-2.5 text-xs">
            <PuzzleIcon size={16} />
            Integrations
            <span className="font-mono text-[10px] text-fg-muted">3</span>
          </Button>
          <IconButton label="Tips" aria-pressed={tips} onClick={() => setTips((t) => !t)} className={cn('size-8', tips && 'text-fg')}>
            <LightbulbIcon size={16} active={tips} />
          </IconButton>

          <div role="group" aria-label="Preview" className="mx-auto flex items-center gap-0.5 rounded-lg bg-well p-0.5">
            <IconButton label="Mobile preview" aria-pressed={mobile} onClick={() => setMobile((m) => !m)} className="size-8 rounded-md hover:bg-key">
              <ResponsiveIcon size={16} active={mobile} />
            </IconButton>
            <IconButton label="Landscape" aria-pressed={landscape} disabled={!mobile} onClick={() => setLandscape((l) => !l)} className="size-8 rounded-md hover:bg-key disabled:pointer-events-none disabled:opacity-40">
              <TabletIcon size={16} active={landscape} />
            </IconButton>
          </div>

          <Button variant="ghost" className={cn('h-8 px-2.5 text-xs', earned && 'text-fg')} aria-label={`Launch checklist, ${done.filter(Boolean).length} of ${TASKS.length} done`}>
            <TrophyIcon size={16} active={earned} className={earned ? 'text-success' : undefined} />
            <span className="font-mono tabular-nums">
              {done.filter(Boolean).length}/{TASKS.length}
            </span>
          </Button>
          <Button variant="primary" onClick={go} className="h-8 min-w-[112px] justify-center px-3 text-xs" aria-live="polite">
            <RocketIcon size={15} strokeWidth={1.75} active={publish !== 'idle'} />
            {publish === 'idle' ? 'Publish' : publish === 'publishing' ? 'Publishing…' : 'Live'}
          </Button>
        </div>

        <div className="grid gap-4 p-4 md:grid-cols-[minmax(0,1fr)_240px]">
          <div className="flex min-h-[320px] items-center justify-center rounded-xl bg-well p-6">
            <div
              aria-label={`Preview, ${!mobile ? 'desktop' : landscape ? 'mobile landscape' : 'mobile portrait'}`}
              role="img"
              className={cn('flex flex-col overflow-hidden rounded-lg border border-line bg-surface p-3 shadow-sm transition-[width,height] duration-(--yj-duration-slow) ease-emphasized', frame)}
            >
              <div className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-accent" />
                <span className="h-1.5 w-8 rounded-full bg-line-strong" />
                {!narrow && (
                  <span className="ms-auto flex gap-1.5">
                    <span className="h-1.5 w-5 rounded-full bg-line" />
                    <span className="h-1.5 w-5 rounded-full bg-line" />
                    <span className="h-1.5 w-5 rounded-full bg-line" />
                  </span>
                )}
              </div>
              <div className={cn('flex flex-col gap-1.5', narrow ? 'mt-6' : mobile ? 'mt-3' : 'mt-[6%]')}>
                <span className="h-2.5 w-4/5 rounded-full bg-line-strong" />
                <span className="h-2.5 w-3/5 rounded-full bg-line-strong" />
                <span className="mt-1 h-1.5 w-2/3 rounded-full bg-line" />
                <span className="mt-2 h-4 w-14 rounded-md bg-accent" />
              </div>
              <div className={cn('mt-auto grid gap-1.5', narrow ? 'grid-cols-1' : 'grid-cols-3')}>
                {[0, 1, 2].slice(0, narrow ? 2 : 3).map((i) => (
                  <span key={i} className={cn('rounded-md bg-well', mobile ? 'h-8' : 'h-12')} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-fg-muted">Launch checklist</p>
            {TASKS.map((task, i) => (
              <label key={task} className={cn('flex cursor-pointer items-center gap-2.5 rounded-lg border border-line px-3 py-2.5 text-sm hover:bg-hover', ease, done[i] ? 'text-fg-muted' : 'text-fg')}>
                <input type="checkbox" checked={done[i]} onChange={() => setDone((d) => d.map((v, j) => (j === i ? !v : v)))} className="size-4 accent-(--color-accent)" />
                <span className={cn('min-w-0 flex-1', done[i] && 'line-through decoration-fg-subtle')}>{task}</span>
              </label>
            ))}
            {tips && <p className="rounded-lg bg-well px-3 py-2.5 text-xs leading-relaxed text-fg-muted">Tip: preview on mobile in landscape too; the hero crops differently.</p>}
            <p className="mt-auto flex items-center gap-2 text-xs text-fg-muted" data-yj-trigger>
              <FlagIcon size={14} />
              Feedback goes to #launch
            </p>
          </div>
        </div>
      </Panel>
    </Stage>
  )
}

export const Launch: Story = {
  parameters: {
    docs: {
      description: {
        story: 'A site builder toolbar for the system icons. Desktop ↔ mobile draws the monitor into a phone, the tablet turns for landscape, ticking the last task fills the trophy, and Publish launches the rocket.',
      },
    },
  },
  render: () => <LaunchDemo />,
}
