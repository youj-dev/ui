import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { useYouj } from '@youj/core'
import { cn } from '@youj/core'
import {
  BadgeCheckIcon,
  BanIcon,
  BracesIcon,
  BugIcon,
  CloudIcon,
  CodeIcon,
  CoinsIcon,
  CommandIcon,
  CpuIcon,
  CreditCardIcon,
  GaugeIcon,
  GiftIcon,
  GitCommitIcon,
  GitMergeIcon,
  GitPullRequestIcon,
  KanbanIcon,
  KeyIcon,
  LoaderDotsIcon,
  PackageIcon,
  PercentIcon,
  PlugIcon,
  ReceiptIcon,
  ScanFaceIcon,
  ServerIcon,
  ShieldAlertIcon,
  ShieldIcon,
  ShoppingBagIcon,
  ShoppingCartIcon,
  SigmaIcon,
  StoreIcon,
  TableIcon,
  TagIcon,
  TrendingDownIcon,
  TruckIcon,
  WalletIcon,
  WebhookIcon,
} from './index'
import { ease, focusRing, Stage } from './story-kit'

const meta = {
  title: 'Icons/In context/Commerce, dev & security',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'The commerce, development, security and data icons inside real product UI. Icons in a button, link or `data-yj-trigger` card play when that parent is hovered or keyboard-focused. State icons follow the state they describe: a cart item added, a card paid, a store closed, a pull request merged, a cloud synced, a plug disconnected, an alert resolved, a face verified, a trend flipped. Under reduced motion every icon holds its resting pose and state icons switch instantly.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

/* ── Shared UI ───────────────────────────────────────────────────────────── */

type Tone = 'success' | 'warning' | 'danger' | 'accent' | 'neutral'
/* Tints stay at 5% so tinted text keeps 4.5:1 on light surfaces; a hairline border carries the color. */
const toneChip: Record<Tone, string> = {
  success: 'border-success-line bg-success-subtle text-success',
  warning: 'border-warning-line bg-warning-subtle text-warning',
  danger: 'border-danger-line bg-danger-subtle text-danger',
  accent: 'border-accent-line bg-accent-subtle text-accent',
  neutral: 'border-line bg-well text-fg-muted',
}

function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn('rounded-2xl border border-line bg-surface shadow-sm', className)}>{children}</section>
}

type Variant = 'primary' | 'secondary' | 'ghost'
function Button({ variant = 'secondary', className, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex h-9 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium whitespace-nowrap disabled:cursor-default disabled:opacity-60',
        ease,
        focusRing,
        variant === 'primary' && 'bg-accent text-on-accent hover:opacity-90',
        variant === 'secondary' && 'border border-line bg-surface text-fg hover:bg-hover',
        variant === 'ghost' && 'text-fg-muted hover:bg-hover hover:text-fg',
        className,
      )}
      {...props}
    />
  )
}

function Chip({ tone = 'neutral', children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-6 items-center gap-1.5 rounded-full border px-2 text-xs font-medium whitespace-nowrap', toneChip[tone], className)}>{children}</span>
}

function Switch({ on, onChange, label, disabled }: { on: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={disabled}
      onClick={onChange}
      className={cn('relative h-5 w-9 shrink-0 rounded-full disabled:opacity-60', ease, focusRing, on ? 'bg-accent' : 'bg-line-strong')}
    >
      <span
        className={cn(
          'absolute top-0.5 left-0.5 size-4 rounded-full bg-surface shadow-sm transition-transform duration-(--yj-duration-base) ease-standard',
          on && 'translate-x-4',
        )}
      />
    </button>
  )
}

function Segmented<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-lg border border-line bg-canvas p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            'inline-flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium',
            ease,
            focusRing,
            value === o.value ? 'bg-key text-fg shadow-sm' : 'text-fg-muted hover:text-fg',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Runs `fn` after `beats` deliberate beats, on the motion time scale; restarting cancels the previous run. */
function useLater() {
  const k = useYouj()
  const t = useRef<ReturnType<typeof setTimeout>>(undefined)
  useEffect(() => () => clearTimeout(t.current), [])
  return (beats: number, fn: () => void) => {
    clearTimeout(t.current)
    t.current = setTimeout(fn, k.ms('deliberate') * beats)
  }
}

const money = (n: number) => `$${n.toFixed(2)}`

/* ── Checkout ────────────────────────────────────────────────────────────── */

const ITEMS = [
  { name: 'Halo desk lamp', detail: 'Graphite · Qty 1', price: 129, swatch: 'bg-fg' },
  { name: 'Linen notebook set', detail: 'A5, dotted · Qty 2', price: 36, swatch: 'bg-warning' },
]

function CheckoutDemo() {
  const later = useLater()
  const [added, setAdded] = useState(false)
  const [gift, setGift] = useState(true)
  const [code, setCode] = useState('SPRING15')
  const [promo, setPromo] = useState<string | null>(null)
  const [method, setMethod] = useState<'card' | 'wallet' | 'points'>('card')
  const [fulfil, setFulfil] = useState<'delivery' | 'pickup'>('delivery')
  const [slot, setSlot] = useState<'today' | 'late'>('today')
  const [pay, setPay] = useState<'idle' | 'processing' | 'paid'>('idle')

  const goods = ITEMS.reduce((s, i) => s + i.price, 0) + (added ? 24 : 0)
  const discount = promo ? goods * 0.15 : 0
  const shipping = fulfil === 'delivery' ? 9 : 0
  const total = goods - discount + (gift ? 5 : 0) + shipping
  const closed = fulfil === 'pickup' && slot === 'late'
  const locked = pay !== 'idle'

  const payNow = () => {
    setPay('processing')
    later(2.5, () => setPay('paid'))
  }

  return (
    <Stage>
      <div className="grid w-full max-w-[980px] grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_380px]">
        <Panel>
          <header className="flex items-center gap-2.5 border-b border-line px-5 py-4" data-yj-trigger>
            <span className="text-fg-muted">
              <ShoppingBagIcon size={18} />
            </span>
            <h2 className="text-sm font-semibold text-fg">Your bag</h2>
            <Chip className="ml-auto">{added ? 3 : 2} items</Chip>
          </header>

          <ul>
            {[...ITEMS, ...(added ? [{ name: 'Brass pen', detail: 'Refillable · Qty 1', price: 24, swatch: 'bg-accent-line' }] : [])].map((item) => (
              <li key={item.name} className="flex items-center gap-4 border-b border-line px-5 py-3.5">
                <span className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-well">
                  <span className={cn('size-5 rounded-full', item.swatch)} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.name}</p>
                  <p className="text-xs text-fg-muted">{item.detail}</p>
                </div>
                <span className="text-sm text-fg tabular-nums">{money(item.price)}</span>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-4 border-b border-line bg-canvas px-5 py-3.5">
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-fg-muted">Complete the set</p>
              <p className="text-sm text-fg">Brass pen · {money(24)}</p>
            </div>
            <Button onClick={() => setAdded((a) => !a)} disabled={locked} aria-pressed={added} className={cn('min-w-[104px]', added && 'text-success')}>
              <ShoppingCartIcon size={16} active={added} />
              {added ? 'Added' : 'Add'}
            </Button>
          </div>

          <div className="flex items-center gap-3 border-b border-line px-5 py-3.5">
            <span className={cn(ease, gift ? 'text-accent' : 'text-fg-muted')}>
              <GiftIcon size={18} active={gift} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm text-fg">Gift wrap</p>
              <p className="text-xs text-fg-muted">{gift ? 'Wrapped, with a handwritten note · +$5.00' : 'Add paper, ribbon and a note · +$5.00'}</p>
            </div>
            <Switch on={gift} onChange={() => setGift((g) => !g)} label="Gift wrap" disabled={locked} />
          </div>

          <div className="px-5 py-4">
            {promo ? (
              <div className="flex items-center gap-3 rounded-xl border border-line bg-canvas px-3 py-2.5" data-yj-trigger>
                <span className="text-success">
                  <TagIcon size={18} trigger="mount" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-[13px] text-fg">{promo}</p>
                  <p className="text-xs text-fg-muted">15% off everything in your bag</p>
                </div>
                <span className="text-sm text-success tabular-nums">−{money(discount)}</span>
                <Button variant="ghost" className="h-7 px-2 text-xs" disabled={locked} onClick={() => setPromo(null)}>
                  Remove
                </Button>
              </div>
            ) : (
              <form
                className="flex items-center gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (code.trim()) setPromo(code.trim().toUpperCase())
                }}
              >
                <label className="sr-only" htmlFor="promo">
                  Promo code
                </label>
                <input
                  id="promo"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Promo code"
                  className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-canvas px-3 font-mono text-[13px] text-fg outline-none placeholder:text-fg-subtle focus-visible:ring-2 focus-visible:ring-accent"
                />
                <Button type="submit" disabled={locked}>
                  <PercentIcon size={16} />
                  Apply
                </Button>
              </form>
            )}
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <div className="border-b border-line px-5 py-4">
            <h2 className="text-sm font-semibold text-fg">Payment</h2>
          </div>

          <fieldset className="flex flex-col gap-2 border-b border-line px-5 py-4" disabled={locked}>
            <legend className="sr-only">Payment method</legend>
            {(
              [
                ['card', 'Card', '•••• 4242 · expires 08/29', CreditCardIcon],
                ['wallet', 'Wallet', 'Pay with your device', WalletIcon],
                ['points', 'Points', '1,240 points · worth $12.40', CoinsIcon],
              ] as const
            ).map(([id, label, detail, Icon]) => (
              <label
                key={id}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent',
                  ease,
                  method === id ? 'border-accent bg-accent-subtle' : 'border-line hover:bg-hover',
                )}
              >
                <input type="radio" name="method" value={id} checked={method === id} onChange={() => setMethod(id)} className="sr-only" />
                <span className={method === id ? 'text-accent' : 'text-fg-muted'}>
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm text-fg">{label}</span>
                  <span className="block text-xs text-fg-muted">{detail}</span>
                </span>
                <span className={cn('size-4 rounded-full border', method === id ? 'border-[5px] border-accent' : 'border-line-strong')} />
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-3 border-b border-line px-5 py-4">
            <Segmented
              label="Fulfillment"
              value={fulfil}
              onChange={(v) => !locked && setFulfil(v)}
              options={[
                { value: 'delivery', label: 'Delivery' },
                { value: 'pickup', label: 'Pick up' },
              ]}
            />
            {fulfil === 'delivery' ? (
              <div className="flex items-center gap-3" data-yj-trigger>
                <span className="text-fg-muted">
                  <TruckIcon size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">Express · arrives Thursday</p>
                  <p className="text-xs text-fg-muted">Tracked, signature on delivery</p>
                </div>
                <span className="text-sm text-fg tabular-nums">{money(shipping)}</span>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className={cn(ease, closed ? 'text-fg-subtle' : 'text-success')}>
                  <StoreIcon size={18} active={closed} aria-label={closed ? 'Store closed' : 'Store open'} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-fg">Hudson St. store</p>
                  <p className="text-xs text-fg-muted">{closed ? 'Closed at 8 pm · collect tomorrow from 9 am' : 'Open now · ready in 2 hours'}</p>
                </div>
                <Segmented
                  label="Pickup time"
                  value={slot}
                  onChange={(v) => !locked && setSlot(v)}
                  options={[
                    { value: 'today', label: '5 pm' },
                    { value: 'late', label: '9 pm' },
                  ]}
                />
              </div>
            )}
          </div>

          <dl className="flex flex-col gap-1.5 px-5 py-4 text-sm">
            {[
              ['Subtotal', money(goods)],
              ...(promo ? [['Discount', `−${money(discount)}`]] : []),
              ...(gift ? [['Gift wrap', money(5)]] : []),
              ['Shipping', shipping ? money(shipping) : 'Free'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-fg-muted">
                <dt>{k}</dt>
                <dd className="tabular-nums">{v}</dd>
              </div>
            ))}
            <div className="mt-1.5 flex justify-between border-t border-line pt-2.5 text-base font-semibold text-fg">
              <dt>Total</dt>
              <dd className="tabular-nums">{money(total)}</dd>
            </div>
          </dl>

          <div className="flex flex-col gap-3 px-5 pb-5">
            <Button
              variant={pay === 'paid' ? 'secondary' : 'primary'}
              onClick={payNow}
              disabled={locked}
              className={cn('h-11 w-full text-[15px]', pay === 'paid' && 'text-success disabled:opacity-100', pay === 'processing' && 'disabled:opacity-90')}
            >
              <CreditCardIcon size={18} active={pay === 'paid'} />
              {pay === 'idle' && `Pay ${money(total)}`}
              {pay === 'processing' && (
                <>
                  Processing
                  <LoaderDotsIcon size={16} />
                </>
              )}
              {pay === 'paid' && 'Paid'}
            </Button>
            <p className="sr-only" aria-live="polite">
              {pay === 'processing' ? 'Processing payment' : pay === 'paid' ? `Paid ${money(total)}` : ''}
            </p>
            {pay === 'paid' ? (
              <div className="flex items-center justify-between gap-2">
                <a href="#" onClick={(e) => e.preventDefault()} className={cn('inline-flex h-8 items-center gap-1.5 rounded-md px-1 text-sm text-fg-muted hover:text-fg', ease, focusRing)}>
                  <ReceiptIcon size={16} />
                  View receipt
                </a>
                <Button variant="ghost" className="h-8 text-xs" onClick={() => setPay('idle')}>
                  Start over
                </Button>
              </div>
            ) : (
              <p className="text-center text-xs text-fg-muted">Payments are encrypted and processed securely.</p>
            )}
          </div>
        </Panel>
      </div>
    </Stage>
  )
}

export const Checkout: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A checkout summary. Add the pen and the cart takes it in; gift wrap opens the gift; the pickup store rolls its shutter down for a 9 pm slot; Pay taps the card and folds its stripe into a check once the payment clears.',
      },
    },
  },
  render: () => <CheckoutDemo />,
}

/* ── Pull requests ───────────────────────────────────────────────────────── */

interface PullRequest {
  id: number
  title: string
  branch: string
  commits: number
  checks: 'passed' | 'review'
}

const PULLS: PullRequest[] = [
  { id: 482, title: 'Checkout v2: one-page payment', branch: 'feat/checkout-v2', commits: 6, checks: 'passed' },
  { id: 479, title: 'Cache product images at the edge', branch: 'perf/image-cache', commits: 3, checks: 'review' },
  { id: 471, title: 'Retry failed webhooks with backoff', branch: 'fix/webhook-retries', commits: 4, checks: 'passed' },
]

const SNIPPET = {
  code: `await fetch(endpoint, {
  method: 'POST',
  headers: { 'x-signature': sign(body) },
  body: JSON.stringify(event),
})`,
  json: `{
  "type": "order.paid",
  "order": "ord_4821",
  "amount": 17905,
  "currency": "usd"
}`,
}

function PullRequestsDemo() {
  const later = useLater()
  const [merged, setMerged] = useState<Record<number, boolean>>({ 471: true })
  const [bugFixed, setBugFixed] = useState(false)
  const [synced, setSynced] = useState(true)
  const [connected, setConnected] = useState(true)
  const [view, setView] = useState<'code' | 'json'>('json')

  const redeploy = () => {
    setSynced(false)
    later(3, () => setSynced(true))
  }

  return (
    <Stage>
      <div className="grid w-full max-w-[1040px] grid-cols-[minmax(0,1fr)] items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Panel>
          <header className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
            <p className="mr-2 font-mono text-sm text-fg">acme/storefront</p>
            <nav aria-label="Repository" className="flex items-center gap-1">
              <a href="#" aria-current="page" onClick={(e) => e.preventDefault()} className={cn('inline-flex h-8 items-center gap-2 rounded-md bg-selected px-2.5 text-sm text-fg', ease, focusRing)}>
                <GitPullRequestIcon size={16} />
                Pull requests
                <span className="font-mono text-[11px] text-fg-muted">{PULLS.filter((p) => !merged[p.id]).length}</span>
              </a>
              <a href="#" onClick={(e) => e.preventDefault()} className={cn('inline-flex h-8 items-center gap-2 rounded-md px-2.5 text-sm text-fg-muted hover:text-fg', ease, focusRing)}>
                <GitMergeIcon size={16} />
                Merge queue
              </a>
            </nav>
            <Button variant="secondary" className="ml-auto h-8 gap-2 pr-1.5 text-fg-muted" aria-label="Search K, shortcut command K">
              Search{' '}
              <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-line bg-canvas px-1 font-mono text-[11px] text-fg-muted">
                <CommandIcon size={11} strokeWidth={2} />K
              </kbd>
            </Button>
          </header>

          <ul>
            {PULLS.map((pr) => {
              const isMerged = Boolean(merged[pr.id])
              return (
                <li key={pr.id} className="flex items-center gap-3 border-b border-line px-4 py-3.5">
                  <span className={cn('mt-0.5 self-start', ease, isMerged ? 'text-accent' : 'text-success')}>
                    <GitPullRequestIcon size={18} active={isMerged} aria-label={isMerged ? 'Merged' : 'Open'} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{pr.title}</p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-fg-muted">
                      <span>#{pr.id}</span>
                      <span className="font-mono">{pr.branch}</span>
                      <span className="inline-flex items-center gap-1" data-yj-trigger>
                        <GitCommitIcon size={14} />
                        {pr.commits} commits
                      </span>
                    </p>
                  </div>
                  {isMerged ? (
                    <Chip tone="accent">Merged</Chip>
                  ) : pr.checks === 'passed' ? (
                    <Button className="h-8" onClick={() => setMerged((m) => ({ ...m, [pr.id]: true }))}>
                      <GitMergeIcon size={15} />
                      Merge
                    </Button>
                  ) : (
                    <Chip tone="warning">Review required</Chip>
                  )}
                </li>
              )
            })}
            <li className="flex items-center gap-3 px-4 py-3.5">
              <span className={cn('mt-0.5 self-start', ease, bugFixed ? 'text-success' : 'text-danger')}>
                <BugIcon size={18} active={bugFixed} aria-label={bugFixed ? 'Fixed' : 'Open bug'} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">Totals round the wrong way with 3+ discounts</p>
                <p className="mt-0.5 text-xs text-fg-muted">Issue #88 · reported by support · {bugFixed ? 'fixed in #482' : 'high priority'}</p>
              </div>
              <Button variant="ghost" className="h-8" aria-pressed={bugFixed} onClick={() => setBugFixed((f) => !f)}>
                {bugFixed ? 'Reopen' : 'Mark fixed'}
              </Button>
            </li>
          </ul>
        </Panel>

        <div className="flex min-w-0 flex-col gap-4">
          <Panel className="p-4">
            <div className="flex items-center gap-3">
              <span className={cn(ease, synced ? 'text-success' : 'text-fg-muted')}>
                <CloudIcon size={20} active={synced} aria-label={synced ? 'Synced' : 'Deploying'} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">Production</p>
                <p className="text-xs text-fg-muted" aria-live="polite">
                  {synced ? 'Synced with main · 2 regions' : 'Deploying 6f2c1ab…'}
                </p>
              </div>
              <Button className="h-8" onClick={redeploy} disabled={!synced}>
                Redeploy
              </Button>
            </div>
            <ul className="mt-3 flex flex-col gap-1">
              {[
                { Icon: ServerIcon, name: 'iad1 · Washington', meta: '12 ms' },
                { Icon: ServerIcon, name: 'fra1 · Frankfurt', meta: '18 ms' },
                { Icon: CpuIcon, name: 'Build machine', meta: '8 vCPU' },
              ].map(({ Icon, name, meta: m }) => (
                <li key={name}>
                  <a href="#" onClick={(e) => e.preventDefault()} className={cn('flex items-center gap-2.5 rounded-lg px-2 py-2 text-fg-muted hover:bg-hover hover:text-fg', ease, focusRing)}>
                    <Icon size={16} />
                    <span className="text-[13px] text-fg">{name}</span>
                    <span className="ml-auto font-mono text-[11px]">{m}</span>
                  </a>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel className="flex flex-col gap-3 p-4">
            <div className="flex items-center gap-3">
              <span className={cn(ease, connected ? 'text-fg' : 'text-fg-subtle')}>
                <PlugIcon size={20} active={!connected} aria-label={connected ? 'Connected' : 'Disconnected'} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-fg">Chat alerts</p>
                <p className="text-xs text-fg-muted">{connected ? 'Posting deploys to #releases' : 'Disconnected · no alerts are sent'}</p>
              </div>
              <Switch on={connected} onChange={() => setConnected((c) => !c)} label="Chat alerts" />
            </div>
            <a href="#" onClick={(e) => e.preventDefault()} className={cn('flex items-center gap-3 rounded-lg border border-line px-3 py-2.5 hover:bg-hover', ease, focusRing)}>
              <span className="text-fg-muted">
                <WebhookIcon size={18} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-mono text-[13px] text-fg">order.paid</span>
                <span className="block text-xs text-fg-muted">3 endpoints · 99.8% delivered</span>
              </span>
            </a>
          </Panel>

          <Panel className="overflow-hidden">
            <div className="flex items-center gap-2 border-b border-line px-4 py-2.5">
              <p className="text-sm font-medium text-fg">Payload</p>
              <div className="ml-auto flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="h-8 gap-1.5 px-2 text-xs"
                  aria-pressed={view === 'json'}
                  onClick={() => setView((v) => (v === 'json' ? 'code' : 'json'))}
                >
                  <CodeIcon size={16} active={view === 'json'} />
                  JSON
                </Button>
                <Button variant="ghost" className="h-8 w-8 px-0" aria-label="Edit schema" title="Edit schema">
                  <BracesIcon size={16} />
                </Button>
              </div>
            </div>
            <pre className="overflow-x-auto bg-canvas px-4 py-3 font-mono text-[12px] leading-relaxed text-fg-muted">
              {SNIPPET[view]}
            </pre>
          </Panel>
        </div>
      </div>
    </Stage>
  )
}

export const PullRequests: Story = {
  name: 'Pull requests',
  parameters: {
    docs: {
      description: {
        story:
          'A repository console. Merge swings the pull request icon over into a merged branch; Mark fixed curls the bug up and strikes it out; Redeploy lets the cloud unsync and re-sync; the plug pulls apart when alerts are disconnected; the payload toggle bends `< >` into `{ }`.',
      },
    },
  },
  render: () => <PullRequestsDemo />,
}

/* ── Security ────────────────────────────────────────────────────────────── */

function Row({ icon, title, detail, children }: { icon: ReactNode; title: string; detail: ReactNode; children?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-5 py-3.5 last:border-0">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-fg">{title}</p>
        <p className="text-xs text-fg-muted">{detail}</p>
      </div>
      {children}
    </div>
  )
}

function SecurityDemo() {
  const later = useLater()
  const [resolved, setResolved] = useState(false)
  const [face, setFace] = useState<'off' | 'scanning' | 'on'>('off')
  const [rotated, setRotated] = useState(false)

  const enrol = () => {
    setFace('scanning')
    later(2.5, () => setFace('on'))
  }

  return (
    <Stage>
      <Panel className="w-full max-w-[580px]">
        <header className="flex items-center gap-2.5 border-b border-line px-5 py-4" data-yj-trigger>
          <span className="text-fg-muted">
            <ShieldIcon size={18} trigger="mount" />
          </span>
          <h2 className="text-sm font-semibold text-fg">Security</h2>
          <span className="ml-auto text-xs text-fg-muted">Last reviewed today</span>
        </header>

        <div className="border-b border-line p-4">
          <div role="status" className={cn('flex gap-3 rounded-xl border p-3.5', ease, resolved ? 'border-success-line bg-success-subtle' : 'border-warning-line bg-warning-subtle')}>
            <span className={cn('mt-0.5', ease, resolved ? 'text-success' : 'text-warning')}>
              <ShieldAlertIcon size={20} active={resolved} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-fg">{resolved ? 'Sign-in confirmed' : 'Sign-in from a new device'}</p>
              <p className="mt-0.5 text-[13px] leading-snug text-fg-muted">
                {resolved ? 'We’ll remember this device. No action needed.' : 'Chrome on Windows · Lisbon, Portugal · 2 minutes ago'}
              </p>
              {!resolved && (
                <div className="mt-3 flex gap-2">
                  <Button className="h-8" onClick={() => setResolved(true)}>
                    It was me
                  </Button>
                  <Button variant="ghost" className="h-8">
                    Secure account
                  </Button>
                </div>
              )}
            </div>
            {resolved && (
              <Button variant="ghost" className="h-8 self-start px-2 text-xs" onClick={() => setResolved(false)}>
                Undo
              </Button>
            )}
          </div>
        </div>

        <Row
          icon={
            <span className={cn(ease, face === 'on' ? 'text-success' : 'text-fg-muted')}>
              <ScanFaceIcon size={18} active={face === 'on'} />
            </span>
          }
          title="Face ID"
          detail={face === 'on' ? 'Approves payments and new devices' : face === 'scanning' ? 'Hold still, looking for your face…' : 'Approve payments with a glance'}
        >
          {face === 'on' ? (
            <Chip tone="success">On</Chip>
          ) : (
            <Button className="h-8 min-w-[88px]" onClick={enrol} disabled={face === 'scanning'} aria-live="polite">
              {face === 'scanning' ? <LoaderDotsIcon size={16} aria-label="Scanning" /> : 'Set up'}
            </Button>
          )}
        </Row>
        <Row
          icon={
            <span className="text-fg-muted">
              <KeyIcon size={18} />
            </span>
          }
          title="API keys"
          detail={
            <>
              <span className="font-mono">sk_demo_…4f2a</span> · {rotated ? 'rotated just now' : 'last rotated 18 days ago'}
            </>
          }
        >
          <Button className="h-8" onClick={() => setRotated(true)}>
            <KeyIcon size={15} />
            Rotate
          </Button>
        </Row>
        <Row
          icon={
            <span className="text-success">
              <BadgeCheckIcon size={18} trigger="mount" aria-label="Verified" />
            </span>
          }
          title="acme.com"
          detail="Verified domain · DNS record found"
        >
          <Chip tone="success">Verified</Chip>
        </Row>
        <Row
          icon={
            <span className="text-fg-muted">
              <BanIcon size={18} />
            </span>
          }
          title="Blocked accounts"
          detail="3 accounts can’t sign in or message you"
        >
          <Button variant="ghost" className="h-8">
            <BanIcon size={15} />
            Manage
          </Button>
        </Row>
      </Panel>
    </Stage>
  )
}

export const Security: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A security settings panel. “It was me” tips the alert’s exclamation over into a check; Face ID scans, then locks on and swaps the smile for a check; Rotate turns the key; the shield ripples and the verified seal stamps itself on mount.',
      },
    },
  },
  render: () => <SecurityDemo />,
}

/* ── Dashboard ───────────────────────────────────────────────────────────── */

const PERIODS = {
  '7d': { revenue: '$48.2k', revenueDelta: -3.2, orders: '1,284', ordersDelta: 4.1, load: 78, tasks: 14 },
  '30d': { revenue: '$212k', revenueDelta: 12.4, orders: '5,902', ordersDelta: -1.8, load: 41, tasks: 9 },
} as const

function Delta({ value }: { value: number }) {
  const up = value > 0
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-medium tabular-nums', ease, up ? 'text-success' : 'text-danger')}>
      <TrendingDownIcon size={14} strokeWidth={1.75} active={up} aria-label={up ? 'Rising' : 'Falling'} />
      {up ? '+' : '−'}
      {Math.abs(value)}%
    </span>
  )
}

function Kpi({ icon, label, value, children }: { icon: ReactNode; label: string; value: ReactNode; children?: ReactNode }) {
  return (
    <div data-yj-trigger tabIndex={0} className={cn('flex flex-col gap-3 rounded-xl border border-line bg-surface p-4 hover:border-line-strong', ease, focusRing)}>
      <div className="flex items-center justify-between text-fg-muted">
        <span className="text-[13px]">{label}</span>
        {icon}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold tracking-tight text-fg tabular-nums">{value}</span>
        {children}
      </div>
    </div>
  )
}

const ORDERS = [
  { id: '#4821', who: 'Maya Chen', total: '$179.05' },
  { id: '#4817', who: 'Jonas Weber', total: '$64.00' },
  { id: '#4809', who: 'Priya Nair', total: '$212.40' },
]

function DashboardDemo() {
  const [period, setPeriod] = useState<keyof typeof PERIODS>('7d')
  const [delivered, setDelivered] = useState<Record<string, boolean>>({ '#4809': true })
  const p = PERIODS[period]
  const busy = p.load > 70

  return (
    <Stage>
      <div className="flex w-full max-w-[980px] flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[11px] tracking-[0.18em] text-fg-muted uppercase">Storefront</p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-fg">Overview</h2>
          </div>
          <Segmented
            label="Period"
            value={period}
            onChange={setPeriod}
            options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
            ]}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi icon={<SigmaIcon size={18} />} label="Revenue" value={p.revenue}>
            <Delta value={p.revenueDelta} />
          </Kpi>
          <Kpi icon={<TableIcon size={18} />} label="Orders" value={p.orders}>
            <Delta value={p.ordersDelta} />
          </Kpi>
          <Kpi
            icon={
              <span className={cn(ease, busy ? 'text-warning' : 'text-fg-muted')}>
                <GaugeIcon size={18} active={busy} aria-label={busy ? 'High load' : 'Normal load'} />
              </span>
            }
            label="API load"
            value={`${p.load}%`}
          >
            <span className={cn('text-xs', busy ? 'text-warning' : 'text-fg-muted')}>{busy ? 'near capacity' : 'healthy'}</span>
          </Kpi>
          <Kpi icon={<KanbanIcon size={18} />} label="Fulfillment board" value={p.tasks}>
            <span className="text-xs text-fg-muted">in progress</span>
          </Kpi>
        </div>

        <Panel>
          <div className="flex items-center gap-2 border-b border-line px-5 py-3.5">
            <h3 className="text-sm font-semibold text-fg">Recent orders</h3>
            <span className="ml-auto flex items-center gap-1.5 text-xs text-fg-muted" data-yj-trigger>
              <CpuIcon size={14} />
              Fraud checks running
            </span>
          </div>
          <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Recent orders</caption>
            <thead>
              <tr className="text-left text-xs text-fg-muted">
                <th className="px-5 py-2.5 font-medium">Order</th>
                <th className="hidden px-2 py-2.5 font-medium sm:table-cell">Customer</th>
                <th className="px-2 py-2.5 text-right font-medium">Total</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {ORDERS.map((o) => {
                const done = Boolean(delivered[o.id])
                return (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-5 py-3 font-mono text-[13px] text-fg">{o.id}</td>
                    <td className="hidden px-2 py-3 text-fg sm:table-cell">{o.who}</td>
                    <td className="px-2 py-3 text-right text-fg tabular-nums">{o.total}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <span className={cn(ease, done ? 'text-success' : 'text-fg-muted')}>
                          <PackageIcon size={16} active={done} />
                        </span>
                        <span className={cn('text-[13px] whitespace-nowrap', done ? 'text-success' : 'text-fg-muted')}>{done ? 'Delivered' : 'In transit'}</span>
                        <Button
                          variant="ghost"
                          className="ml-auto h-7 px-2 text-xs"
                          aria-pressed={done}
                          aria-label={done ? `Undo: mark ${o.id} in transit` : `Mark delivered: order ${o.id}`}
                          onClick={() => setDelivered((d) => ({ ...d, [o.id]: !done }))}
                        >
                          {done ? 'Undo' : 'Mark delivered'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          </div>
        </Panel>
      </div>
    </Stage>
  )
}

export const Dashboard: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'A KPI row. Switching the period flips each trend icon through flat to its new direction and swings the load gauge; cards are `data-yj-trigger` groups, so hovering one plays its icon. Marking an order delivered sets the box down and folds its tape into a check.',
      },
    },
  },
  render: () => <DashboardDemo />,
}
