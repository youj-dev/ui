import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { CurrencySwap, type CurrencySwapAsset } from './currency-swap'

/* Each coin's own mark, drawn inline. */
const C2 = '#2775CA' // youj-allow: the coin's own brand color
const C3 = '#627EEA' // youj-allow: the coin's own brand color
const C4 = '#9945FF' // youj-allow: the coin's own brand color
const C5 = '#F7931A' // youj-allow: the coin's own brand color
const C6 = '#fff' // youj-allow: the coin's own brand color

const BTC =
  'M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.548v-.002zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.525 2.107c-.345-.087-.705-.167-1.064-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.132-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.76 1.68-1.93h.01zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.524 2.75 2.084v.006z'

const BitcoinMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <circle cx="12" cy="12" r="11" fill={C6} />
    <path fill={C5} d={BTC} />
  </svg>
)

const EthereumMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <circle cx="12" cy="12" r="11" fill={C6} />
    <g transform="translate(5.5 5.5) scale(.54)">
      <path fill={C3} d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
    </g>
  </svg>
)

const SolanaMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <circle cx="12" cy="12" r="11" fill={C6} />
    <g transform="translate(5.5 5.5) scale(.54)">
      <path fill={C4} d="m23.8764 18.0313-3.962 4.1393a.9201.9201 0 0 1-.306.2106.9407.9407 0 0 1-.367.0742H.4599a.4689.4689 0 0 1-.2522-.0733.4513.4513 0 0 1-.1696-.1962.4375.4375 0 0 1-.0314-.2545.4438.4438 0 0 1 .117-.2298l3.9649-4.1393a.92.92 0 0 1 .3052-.2102.9407.9407 0 0 1 .3658-.0746H23.54a.4692.4692 0 0 1 .2523.0734.4531.4531 0 0 1 .1697.196.438.438 0 0 1 .0313.2547.4442.4442 0 0 1-.1169.2297zm-3.962-8.3355a.9202.9202 0 0 0-.306-.2106.941.941 0 0 0-.367-.0742H.4599a.4687.4687 0 0 0-.2522.0734.4513.4513 0 0 0-.1696.1961.4376.4376 0 0 0-.0314.2546.444.444 0 0 0 .117.2297l3.9649 4.1394a.9204.9204 0 0 0 .3052.2102c.1154.049.24.0744.3658.0746H23.54a.469.469 0 0 0 .2523-.0734.453.453 0 0 0 .1697-.1961.4382.4382 0 0 0 .0313-.2546.4444.4444 0 0 0-.1169-.2297zM.46 6.7225h18.7815a.9411.9411 0 0 0 .367-.0742.9202.9202 0 0 0 .306-.2106l3.962-4.1394a.4442.4442 0 0 0 .117-.2297.4378.4378 0 0 0-.0314-.2546.453.453 0 0 0-.1697-.196.469.469 0 0 0-.2523-.0734H4.7596a.941.941 0 0 0-.3658.0745.9203.9203 0 0 0-.3052.2102L.1246 5.9687a.4438.4438 0 0 0-.1169.2295.4375.4375 0 0 0 .0312.2544.4512.4512 0 0 0 .1692.196.4689.4689 0 0 0 .2518.0739z" />
    </g>
  </svg>
)

const UsdcMark = () => (
  <svg viewBox="0 0 24 24" aria-hidden focusable="false">
    <circle cx="12" cy="12" r="11" fill={C6} />
    <g transform="translate(5.5 5.5) scale(.54)">
      <path fill={C2} d="M20.788 3.832c-.101-.105-.197-.213-.301-.317-.103-.103-.211-.202-.32-.302A11.903 11.903 0 0 0 12 0a11.926 11.926 0 0 0-8.486 3.514C-1.062 8.09-1.16 15.47 3.213 20.168c.099.108.197.214.3.32.104.103.21.2.317.3A11.92 11.92 0 0 0 12 24c3.206 0 6.22-1.247 8.487-3.512 4.576-4.576 4.673-11.956.301-16.656zm-16.655.301A11.057 11.057 0 0 1 12 .874c2.825 0 5.49 1.048 7.55 2.958l-1.001 1.002A9.646 9.646 0 0 0 12 2.292a9.644 9.644 0 0 0-6.865 2.844A9.644 9.644 0 0 0 2.292 12c0 2.448.9 4.753 2.542 6.549L3.831 19.55C-.201 15.191-.101 8.367 4.133 4.133zm13.798 1.318v.002l-1.015 1.014A7.346 7.346 0 0 0 12 4.589 7.357 7.357 0 0 0 6.761 6.76 7.362 7.362 0 0 0 4.589 12a7.34 7.34 0 0 0 1.877 4.913l-1.014 1.016A8.77 8.77 0 0 1 3.167 12a8.77 8.77 0 0 1 2.588-6.245A8.771 8.771 0 0 1 12 3.167c2.213 0 4.301.809 5.931 2.284zM18.537 12c0 1.745-.681 3.387-1.916 4.622S13.746 18.538 12 18.538a6.491 6.491 0 0 1-4.296-1.621l-.001-.004c-.11-.094-.22-.188-.324-.291a6.027 6.027 0 0 1-.293-.326A6.47 6.47 0 0 1 5.466 12c0-1.746.679-3.387 1.914-4.621A6.488 6.488 0 0 1 12 5.465c1.599 0 3.105.576 4.295 1.62.111.096.224.19.326.295.104.104.2.214.295.324A6.482 6.482 0 0 1 18.537 12zM7.084 17.534h.001A7.349 7.349 0 0 0 12 19.413a7.35 7.35 0 0 0 5.239-2.174A7.354 7.354 0 0 0 19.412 12a7.364 7.364 0 0 0-1.876-4.916l1.013-1.012A8.777 8.777 0 0 1 20.834 12a8.765 8.765 0 0 1-2.589 6.246A8.764 8.764 0 0 1 12 20.834a8.782 8.782 0 0 1-5.93-2.285l1.014-1.015zm12.783 2.333A11.046 11.046 0 0 1 12 23.125a11.042 11.042 0 0 1-7.551-2.957l1.004-1.001a9.64 9.64 0 0 0 6.549 2.542 9.639 9.639 0 0 0 6.865-2.846A9.642 9.642 0 0 0 21.71 12a9.64 9.64 0 0 0-2.543-6.548l1.001-1.002c4.031 4.359 3.935 11.182-.301 15.417z" />
    </g>
  </svg>
)

const crypto: CurrencySwapAsset[] = [
  { id: 'btc', symbol: 'BTC', name: 'Bitcoin', price: 64250, icon: <BitcoinMark /> },
  { id: 'eth', symbol: 'ETH', name: 'Ether', price: 3120.4, icon: <EthereumMark /> },
  { id: 'sol', symbol: 'SOL', name: 'Solana', price: 148.22, icon: <SolanaMark /> },
  { id: 'usdc', symbol: 'USDC', name: 'USD Coin', price: 1, decimals: 2, icon: <UsdcMark /> },
]

const money: CurrencySwapAsset[] = [
  { id: 'usd', symbol: 'USD', name: 'US dollar', price: 1, decimals: 2 },
  { id: 'eur', symbol: 'EUR', name: 'Euro', price: 1.09, decimals: 2 },
  { id: 'gbp', symbol: 'GBP', name: 'Pound sterling', price: 1.27, decimals: 2 },
  { id: 'jpy', symbol: 'JPY', name: 'Japanese yen', price: 0.0067, decimals: 0 },
]

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const meta: Meta<typeof CurrencySwap> = {
  title: 'UI/Inputs/Currency Swap',
  component: CurrencySwap,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A converter card: what you pay (an amount field and its currency) over what you receive (the converted amount, rolling digit by digit), each with its value below, a round button that flips the two sides, the rate and the primary action. A flip sends each side gliding into the other’s place while the arrows turn; the amount received becomes the amount paid. Assets carry a `price`, or the app passes `rate` or `convert`. Amounts and values format in the provider locale. Reduced motion: the sides swap and the figure changes at once.',
      },
    },
  },
  argTypes: {
    currency: { control: 'inline-radio', options: ['USD', 'EUR', 'JPY'] },
    disabled: { control: 'boolean' },
  },
  args: { assets: crypto, defaultAmount: 0.5, currency: 'USD', disabled: false },
}
export default meta
type Story = StoryObj<typeof CurrencySwap>

/** Crypto, with an awaited action. */
export const Playground: Story = {
  render: (args) => <CurrencySwap {...args} pendingLabel="Swapping…" successLabel="Swapped" onSubmit={() => wait(1200)} />,
}

/** Plain currencies in a checkout: euros paid for a dollar price. */
export const Currencies: Story = {
  args: { assets: money, defaultFrom: 'eur', defaultTo: 'usd', defaultAmount: 250, currency: 'EUR' },
  render: (args) => <CurrencySwap {...args} submitLabel="Pay" pendingLabel="Paying…" successLabel="Paid" onSubmit={() => wait(1000)} />,
}

/** Controlled: the app owns the pair and the amount, and a 0.3% fee comes off through `convert`. */
export const Controlled: Story = {
  render: function Render(args) {
    const [from, setFrom] = useState('eth')
    const [to, setTo] = useState('usdc')
    const [amount, setAmount] = useState<number | null>(1.25)
    return (
      <div className="flex flex-col items-center gap-3">
        <CurrencySwap
          {...args}
          from={from}
          onFromChange={setFrom}
          to={to}
          onToChange={setTo}
          amount={amount}
          onAmountChange={setAmount}
          convert={(value, a, b) => (a.price && b.price ? (value * a.price * 0.997) / b.price : undefined)}
          onSubmit={() => wait(900)}
        />
        <p className="text-ui-sm text-fg-muted">
          {from} → {to} · {amount ?? '–'}
        </p>
      </div>
    )
  },
}

/** A failing action: the button shakes to its error and recovers. */
export const Failure: Story = {
  render: (args) => (
    <CurrencySwap
      {...args}
      errorLabel="Quote expired"
      onSubmit={async () => {
        await wait(900)
        throw new Error('Quote expired')
      }}
    />
  ),
}

export const Disabled: Story = { args: { disabled: true }, render: (args) => <CurrencySwap {...args} onSubmit={() => undefined} /> }
