'use client'

import { useState, type ComponentProps } from 'react'
import { ThemeScope, type ThemeInput } from '@youj/core'
import { AppPage } from '../../components/ui/app-page'
import { cn } from '../../lib/utils'
import { Balance } from './money-overview/components/balance'
import { Budgets } from './money-overview/components/budgets'
import { Cards } from './money-overview/components/cards'
import { SendDrawer } from './money-overview/components/send-drawer'
import { Spending } from './money-overview/components/spending'
import { Transactions } from './money-overview/components/transactions'
import { CARDS, makeTransactions } from './money-overview/data'
import { demo } from './money-overview/format'

/* A personal bank's home screen, content only (the app's frame brings the
 * top bar and tabs). From `lg` up it is two columns, the balance, cards and
 * activity beside spending and budgets; below, one column.
 * - The balance is a Counter; the eye toggle morphs it (MorphLabel) to dots
 *   and back, and every figure on the page hides with it.
 * - Cards sit in a swipeable Carousel; spending is a donut whose slices and
 *   Counters re-sweep when the period ToggleGroup changes; budgets are
 *   Progress bars that turn warning when over.
 * - Transactions are grouped by day; search filters them through
 *   PresenceList.
 * - Send money is a Drawer (from the bottom on phones, the side on wide
 *   screens): pick a payee, an amount, review, then Button's onAction sends
 *   it; a drawn check lands, the balance Counter counts down and the payment
 *   drops into Today.
 * Demo content — edit after adding. Reduced motion: counters, slices, the
 * morph and the list change in place. */

interface MoneyOverviewProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** Wraps the screen in this theme. Default: the theme around it. */
  theme?: ThemeInput
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, across the whole width, with no `main` or canvas of its own. Default true; `false` draws its own page (a `main` on a canvas). */
  embedded?: boolean
  /** Sends a payment; resolve when the bank has taken it, and the balance and today's list follow. Default: a short demo wait. */
  onSend?: (payment: { payee: string; amount: number; note: string }) => Promise<unknown> | unknown
}

function MoneyOverview({ theme, embedded = true, onSend, className, ...rest }: MoneyOverviewProps) {
  const [hidden, setHidden] = useState(false)
  const [sending, setSending] = useState(false)
  const [balance, setBalance] = useState(CARDS[0]!.balance)
  const [txns, setTxns] = useState(() => makeTransactions())

  const send = async (name: string, amount: number, note: string) => {
    await (onSend ? onSend({ payee: name, amount, note }) : demo('MoneyOverview: onSend', 900))
    setBalance((b) => Math.round((b - amount) * 100) / 100)
    setTxns((list) => [{ id: `t${Date.now()}`, merchant: note ? `${name} · ${note}` : name, category: 'transfer', amount: -amount, time: Date.now() }, ...list])
  }

  const columns = (
    // Two columns by the page's width (AppPage, or the standalone column), not the window's: in a frame the sidebar takes its share.
    <div className="grid items-start gap-5 @4xl:grid-cols-[1.2fr_1fr]">
      <div className="flex min-w-0 flex-col gap-6">
        <Balance balance={balance} hidden={hidden} onToggle={() => setHidden((h) => !h)} onSend={() => setSending(true)} />
        <Cards balance={balance} hidden={hidden} />
        <Transactions txns={txns} hidden={hidden} />
      </div>
      <div className="flex min-w-0 flex-col gap-5 @4xl:sticky @4xl:top-6">
        <Spending hidden={hidden} />
        <Budgets hidden={hidden} />
      </div>
    </div>
  )
  const drawer = <SendDrawer open={sending} onOpenChange={setSending} balance={balance} onSend={send} />

  const page = embedded ? (
    <AppPage {...rest} title="Hi, Sam" width="fill" className={cn('text-fg', className)}>
      {columns}
      {drawer}
    </AppPage>
  ) : (
    <main {...(rest as ComponentProps<'main'>)} className={cn('min-h-dvh bg-canvas text-fg', className)}>
      <div className="@container mx-auto flex max-w-6xl flex-col gap-5 px-4 py-4 md:px-8 md:py-6">
        <h1 className="text-2xl font-semibold tracking-tight text-fg">Hi, Sam</h1>
        {columns}
      </div>
      {drawer}
    </main>
  )
  return <ThemeScope theme={theme}>{page}</ThemeScope>
}

export { MoneyOverview }
export type { MoneyOverviewProps }
