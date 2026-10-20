'use client'

import { Counter, ScrambleText } from '@youj/motion'
import { LockIcon, EyeIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { HatchedBar } from '../../../components/ui/hatched-bar'
import { LaneMeter } from '../../../components/ui/lane-meter'
import { DistributionStrip } from '../../../components/ui/distribution-strip'
import { RolloutRuler } from '../../../components/ui/rollout-ruler'
import { DayRing, type ScheduleJob } from '../../../components/ui/day-ring'
import { cn } from '../../../lib/utils'

/* One live instrument per feature, each a real component reading a figure
 * the feature is about. `live` is the cell being pointed at or focused: the
 * instrument takes a second reading (a rollout goes to everyone, a spike
 * lands on the queue, a phone asks for the image…) and the component moves
 * to it from wherever it is, so leaving mid-way turns it straight back. Each
 * draws itself in the first time it's seen. They're pictures of the text
 * beside them (the cell hides them from assistive tech). Reduced motion:
 * `live` never turns on, and each is drawn at its reading. */

export interface InstrumentProps {
  live: boolean
}

export function RolloutInstrument({ live }: InstrumentProps) {
  return <RolloutRuler readOnly label="checkout-v2" value={live ? 100 : 10} className="w-full" />
}

/* Runs in minutes after midnight; `duration` is how long a run takes, in minutes. */
const JOBS: ScheduleJob[] = [
  { id: 'backup', name: 'backup-db', runs: [180], duration: 45, tone: 'accent' }, // youj-allow: a job's run time in minutes (fixture)
  { id: 'digest', name: 'send-digest', runs: [480, 1080], duration: 12, tone: 'neutral' }, // youj-allow: a job's run time in minutes (fixture)
  { id: 'sync', name: 'sync-crm', runs: [30, 270, 510, 750, 990, 1230], duration: 8, tone: 'neutral' }, // youj-allow: a job's run time in minutes (fixture)
]

export function CronInstrument({ live }: InstrumentProps) {
  return <DayRing jobs={JOBS} highlight={live ? 'backup' : undefined} label="Today’s runs" className="w-44" />
}

/* Latencies, one per sampled request: from the nearest region, and the same
 * code served from one. Seeded, so the server and the browser draw the same swarm. */
function sampler(seed: number) {
  let s = seed
  const next = () => {
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return (median: number, spread: number) => median * Math.exp(spread * Math.sqrt(-2 * Math.log(1 - next())) * Math.cos(2 * Math.PI * next()))
}
const near = sampler(7)
const far = sampler(11)
const EDGE = Array.from({ length: 140 }, () => Math.round(near(26, 0.32)))
const ORIGIN = Array.from({ length: 140 }, (_, i) => Math.round(i % 10 < 3 ? far(34, 0.3) : far(210, 0.28)))

export function EdgeInstrument({ live }: InstrumentProps) {
  return (
    <DistributionStrip
      samples={live ? ORIGIN : EDGE}
      domain={[10, 500]}
      slo={150}
      rows={7}
      label={live ? 'From iad1 only' : 'Nearest region'}
      className="w-full"
    />
  )
}

export function QueueInstrument({ live }: InstrumentProps) {
  return (
    <LaneMeter
      label="emails queue"
      segments={18}
      lanes={[
        { id: 'queued', label: 'Queued', value: live ? 412 : 36, max: 500 },
        { id: 'workers', label: 'Workers', value: live ? 32 : 4, max: 32, tone: 'accent', active: live },
        { id: 'done', label: 'Sent', value: live ? 18_460 : 18_420, max: 20_000 },
      ]}
      format={{ notation: 'compact', maximumFractionDigits: 1 }}
      className="w-full"
    />
  )
}

const KB: Intl.NumberFormatOptions = { style: 'unit', unit: 'kilobyte', unitDisplay: 'short', maximumFractionDigits: 0 }

export function ImagesInstrument({ live }: InstrumentProps) {
  const served = live ? 38 : 186
  return (
    <div className="flex w-full flex-col gap-3 text-ui-xs">
      <div className="flex items-center justify-between gap-3 text-fg-muted">
        <span className="font-mono">hero.jpg · {live ? '390' : '1440'} px</span>
        <Badge variant="secondary">{live ? 'AVIF' : 'WebP'}</Badge>
      </div>
      <div className="grid grid-cols-[3.25rem_minmax(0,1fr)_4rem] items-center gap-x-3 gap-y-2 font-mono tabular-nums">
        <span className="text-fg-muted">Upload</span>
        <HatchedBar orientation="horizontal" value={1} className="h-3" />
        <span className="text-end text-fg-muted">2,400 kB</span>
        <span className="text-fg-muted">Served</span>
        <HatchedBar orientation="horizontal" fill="solid" tone="accent" value={served} max={2400} className="h-3" />
        <span className="text-end font-medium text-fg">
          <Counter value={served} from={2400} format={KB} duration="slow" />
        </span>
      </div>
      <p className="border-t border-line pt-2.5 text-fg-muted">
        <span className="font-mono font-medium text-fg tabular-nums">
          <Counter value={Math.round((1 - served / 2400) * 100)} inView={false} duration="slow" />%
        </span>{' '}
        lighter than the upload, on every view
      </p>
    </div>
  )
}

const SECRETS = [
  { key: 'DATABASE_URL', value: 'pg://prod.db.internal' },
  { key: 'STRIPE_SECRET', value: 'sk_demo_4eC39HqLyjWD' },
]
const mask = (value: string) => '•'.repeat(Math.min(value.length, 16))

export function SecretsInstrument({ live }: InstrumentProps) {
  return (
    <div className="flex w-full flex-col gap-3">
      <dl className="flex flex-col divide-y divide-line overflow-hidden rounded-md border border-line bg-canvas font-mono text-ui-xs">
        {SECRETS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-3 px-3 py-2">
            <dt className="w-28 shrink-0 truncate text-fg-muted">{s.key}</dt>
            <dd className={cn('min-w-0 flex-1 truncate', i === 0 && live ? 'text-fg' : 'text-fg-muted')}>
              <ScrambleText trigger="change" duration="slow">
                {i === 0 && live ? s.value : mask(s.value)}
              </ScrambleText>
            </dd>
          </div>
        ))}
      </dl>
      <p className="flex items-center gap-1.5 text-ui-xs text-fg-muted">
        {live ? <EyeIcon size={13} className="shrink-0" /> : <LockIcon size={13} className="shrink-0" />}
        {live ? 'Shown to you, and written to the audit log' : 'Encrypted at rest, AES-256'}
      </p>
    </div>
  )
}
