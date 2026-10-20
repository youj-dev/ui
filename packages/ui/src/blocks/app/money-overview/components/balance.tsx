'use client'

import type { ReactNode } from 'react'
import { ArrowDownLeftIcon, ArrowUpRightIcon, EyeClosedIcon, EyeIcon, PlusIcon, ReceiptIcon, SendIcon } from '@youj/icons'
import { Badge } from '../../../../components/ui/badge'
import { Button } from '../../../../components/ui/button'
import { cn } from '../../../../lib/utils'
import { Amount } from './amount'
import { Eyebrow } from '../../../../components/ui/typography'

export function Balance({ balance, hidden, onToggle, onSend }: { balance: number; hidden: boolean; onToggle: () => void; onSend: () => void }) {
  const actions: { label: string; icon: ReactNode; onClick?: () => void }[] = [
    { label: 'Send', icon: <SendIcon size={18} className="rtl:-scale-x-100" />, onClick: onSend },
    { label: 'Request', icon: <ArrowDownLeftIcon size={18} className="rtl:-scale-x-100" /> },
    { label: 'Top up', icon: <PlusIcon size={18} /> },
    { label: 'Pay bills', icon: <ReceiptIcon size={18} /> },
  ]
  return (
    <section aria-labelledby="kite-balance" className="rounded-xl border border-line bg-surface p-5 md:p-6">
      <div className="flex items-center gap-2">
        <Eyebrow render={<h2 id="kite-balance" />} className="text-ui text-fg-muted">
          Everyday balance
        </Eyebrow>
        <Button variant="ghost" size="icon-sm" aria-pressed={hidden} aria-label="Hide amounts" onClick={onToggle} className="text-fg-muted">
          {hidden ? <EyeClosedIcon size={16} /> : <EyeIcon size={16} />}
        </Button>
      </div>
      <Amount value={balance} hidden={hidden} className="mt-1 text-4xl font-semibold tracking-tight text-fg" />
      <p className="mt-2 flex items-center gap-2 text-ui-sm text-fg-muted">
        <Badge variant="success">
          <ArrowUpRightIcon size={12} /> 3.2%
        </Badge>
        more than this time last month
      </p>
      <div className="mt-6 grid grid-cols-4 gap-2">
        {actions.map((a) => (
          <button
            key={a.label}
            type="button"
            onClick={a.onClick}
            className="group flex flex-col items-center gap-1.5 rounded-lg py-1 text-ui-sm text-fg-muted focus-ring hover:text-fg"
          >
            <span
              className={cn(
                'grid size-11 place-items-center rounded-full transition-[background-color,scale] yj-duration-fast ease-standard group-active:scale-95 reduced:group-active:scale-100',
                a.onClick ? 'bg-accent text-on-accent group-hover:yj-solid-shade' : 'bg-band text-fg group-hover:bg-hover',
              )}
            >
              {a.icon}
            </span>
            {a.label}
          </button>
        ))}
      </div>
    </section>
  )
}
