'use client'

import { CurrencySwap, type CurrencySwapAsset } from '@youj/react'

const currencies: CurrencySwapAsset[] = [
  { id: 'eur', symbol: 'EUR', name: 'Euro', price: 1, decimals: 2 },
  { id: 'usd', symbol: 'USD', name: 'US dollar', price: 0.92, decimals: 2 },
  { id: 'gbp', symbol: 'GBP', name: 'Pound sterling', price: 1.17, decimals: 2 },
  { id: 'jpy', symbol: 'JPY', name: 'Japanese yen', price: 0.0061, decimals: 0 },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

/* Topping up a travel wallet: a 0.5% exchange fee comes off through `convert`. */
export default function CurrencySwapCheckout() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-3">
      <div className="flex items-baseline justify-between px-1">
        <p className="text-ui font-medium text-fg">Top up travel wallet</p>
        <p className="text-ui-sm text-fg-muted">0.5% fee included</p>
      </div>
      <CurrencySwap
        assets={currencies}
        currency="EUR"
        defaultFrom="eur"
        defaultTo="jpy"
        defaultAmount={300}
        convert={(amount, from, to) => (from.price && to.price ? (amount * from.price * 0.995) / to.price : undefined)}
        submitLabel="Top up"
        pendingLabel="Topping up…"
        successLabel="Added to wallet"
        onSubmit={() => wait(1000)}
      />
    </div>
  )
}
