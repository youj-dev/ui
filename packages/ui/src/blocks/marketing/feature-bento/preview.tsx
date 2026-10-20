'use client'

import { useId, useState } from 'react'
import { LockIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Switch } from '../../../components/ui/switch'
import { cn } from '../../../lib/utils'

/* The one demo you can use: a real Switch password-protects the preview
 * beside it. The page blurs behind a frosted gate and the address bar grows a
 * lock; switching off lifts it. The preview itself is a picture (inert).
 * Reduced motion: the gate appears and goes without a fade. */

const DEFAULT_LABELS = {
  gate: 'Password required',
  protection: 'Password protection',
  protectedHint: 'Only people with the password can open it',
  publicHint: 'Anyone with the link can open it',
  protectedBadge: 'Protected',
  publicBadge: 'Public',
}

export function PreviewDemo({ labels: labelsProp }: { labels?: Partial<typeof DEFAULT_LABELS> }) {
  const labels = { ...DEFAULT_LABELS, ...labelsProp }
  const labelId = useId()
  const hintId = useId()
  const [locked, setLocked] = useState(false)
  return (
    <div className="flex h-full flex-col gap-3">
      <div aria-hidden inert className="relative flex min-h-48 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-canvas">
        <div className="flex items-center gap-2 border-b border-line bg-transparent px-3 py-2">
          <span className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="size-2 rounded-full bg-well" />
            ))}
          </span>
          <span className="mx-auto inline-flex max-w-full min-w-0 items-center gap-1.5 rounded-md bg-canvas px-2.5 py-0.5 text-ui-xs text-fg-muted">
            <span className={cn('inline-flex overflow-hidden transition-[width,opacity] yj-duration-base ease-standard', locked ? 'w-3 opacity-100' : 'w-0 opacity-0')}>
              <LockIcon size={12} strokeWidth={2} />
            </span>
            <span className="truncate">checkout-copy.northwind.app</span>
          </span>
        </div>
        <div className="relative flex flex-1 flex-col gap-3 p-4">
          <div className="flex items-center gap-3 text-ui-xs">
            <span className="text-ui-sm font-semibold tracking-tight text-fg">acme</span>
            <span className="ms-auto flex gap-3 text-fg-muted max-sm:hidden">
              <span>Shop</span>
              <span>Journal</span>
              <span className="text-fg">Bag (3)</span>
            </span>
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-[1.2fr_1fr]">
            <div className="flex flex-col gap-2.5 pt-1">
              <span className="text-ui-lg font-semibold tracking-tight text-fg">Checkout</span>
              <span className="flex flex-col gap-1">
                <span className="text-ui-xs text-fg-muted">Email</span>
                <span className="flex h-7 items-center rounded-md border border-line px-2 text-ui-xs text-fg">mara@acme.co</span>
              </span>
              <span className="flex flex-col gap-1">
                <span className="text-ui-xs text-fg-muted">Card</span>
                <span className="flex h-7 items-center justify-between gap-2 rounded-md border border-line px-2 text-ui-xs text-fg tabular-nums">
                  •••• 4242
                  <span className="text-fg-muted">12 / 28</span>
                </span>
              </span>
              <span className="flex flex-col gap-1 max-sm:hidden">
                <span className="text-ui-xs text-fg-muted">Delivery</span>
                {[
                  ['Standard, 3 to 5 days', 'Free', true],
                  ['Express, tomorrow', '$9.00', false],
                ].map(([option, cost, on]) => (
                  <span key={String(option)} className="flex h-7 items-center gap-2 rounded-md border border-line px-2 text-ui-xs text-fg">
                    <span className={cn('size-3 shrink-0 rounded-full border', on ? 'border-4 border-accent' : 'border-line-strong')} />
                    <span className="min-w-0 flex-1 truncate">{option}</span>
                    <span className="text-fg-muted tabular-nums">{cost}</span>
                  </span>
                ))}
              </span>
              <span className="mt-auto grid h-7 w-full place-items-center rounded-md bg-accent text-ui-xs font-medium text-on-accent">Pay $48.00</span>
            </div>
            <div className="flex flex-col gap-2.5 rounded-md border border-line bg-transparent p-3 max-sm:hidden">
              <span className="text-ui-xs font-medium text-fg-muted">Order summary</span>
              {[
                ['Linen tote', 'Natural', 24],
                ['Field notes', '3 pack', 16],
                ['Brass pen', 'Fine', 8],
              ].map(([item, variant, price]) => (
                <span key={item} className="flex items-center gap-2 text-ui-xs text-fg">
                  <span className="grid size-7 shrink-0 place-items-center rounded-sm bg-well text-ui-xs font-medium text-fg-muted">{String(item).charAt(0)}</span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate">{item}</span>
                    <span className="truncate text-fg-muted">{variant}</span>
                  </span>
                  <span className="tabular-nums text-fg-muted">${price}.00</span>
                </span>
              ))}
              <span className="mt-auto flex justify-between border-t border-line pt-2 text-ui-xs font-medium text-fg">
                <span>Total</span>
                <span className="tabular-nums">$48.00</span>
              </span>
            </div>
          </div>
          <div
            className={cn(
              'absolute inset-0 grid place-items-center bg-canvas/60 youj-allow-glass backdrop-blur-sm transition-opacity yj-duration-base ease-standard',
              locked ? 'opacity-100' : 'opacity-0',
            )}
          >
            <div
              className={cn(
                'flex w-44 flex-col items-center gap-2 rounded-lg border border-line bg-surface p-3 text-center shadow-md transition-[translate,scale] yj-duration-slow ease-enter',
                locked ? 'translate-y-0 scale-100' : 'translate-y-1.5 scale-95',
              )}
            >
              <span className="grid size-8 place-items-center rounded-full bg-accent-subtle text-accent">
                <LockIcon size={16} />
              </span>
              <span className="text-ui-sm font-medium text-fg">{labels.gate}</span>
              <span className="h-6 w-full rounded-md border border-line bg-canvas" />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-3 py-2.5">
        <div className="flex min-w-0 flex-1 flex-col">
          <span id={labelId} className="text-ui-sm font-medium text-fg">
            {labels.protection}
          </span>
          <span id={hintId} className="truncate text-ui-xs text-fg-muted">
            {locked ? labels.protectedHint : labels.publicHint}
          </span>
        </div>
        <Badge variant={locked ? 'default' : 'success'} className="max-sm:hidden">
          {locked ? labels.protectedBadge : labels.publicBadge}
        </Badge>
        <Switch checked={locked} onCheckedChange={setLocked} aria-labelledby={labelId} aria-describedby={hintId} />
      </div>
    </div>
  )
}
