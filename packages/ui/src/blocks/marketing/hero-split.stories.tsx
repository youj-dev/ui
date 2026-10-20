import { useLayoutEffect, useRef, type ReactNode } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Badge } from '../../components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { HeroSplit } from './hero-split'

const meta: Meta<typeof HeroSplit> = {
  title: 'Blocks/Marketing/Hero split',
  component: HeroSplit,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section' },
    docs: {
      description: {
        component:
          'Pair your opening pitch with the product in a window, and let the selling points steer it: each point sends the window’s camera to its part of the screen, where that part plays its moment.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof HeroSplit>

export const Default: Story = {
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <HeroSplit {...args} />
    </div>
  ),
}

const INVOICES = [
  { id: 'INV-2041', who: 'Fernhill Bakery', amount: '$1,240.00', paid: true },
  { id: 'INV-2042', who: 'Copperline Studio', amount: '$860.50', paid: true },
  { id: 'INV-2043', who: 'Harbor & Pine', amount: '$3,120.00', paid: false },
]

/** Lays the screen out at 560px and zooms it to the window, so a phone shows the same picture as a desktop (as the demo screen does). */
function FitToWindow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    const host = el?.parentElement
    if (!el || !host) return
    const fit = () => {
      if (host.clientWidth) el.style.zoom = String(host.clientWidth / 560)
    }
    fit()
    const observer = new ResizeObserver(fit)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={ref} className="w-140">
      {children}
    </div>
  )
}

/** A finance product's pitch and its own screen in the window, with points that zoom to its parts. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: {
      badge: 'Now with automatic reminders',
      headline: 'Get paid without chasing anyone',
      description: 'Ledgerly sends the invoice, nudges on the due date and matches the payment when it lands. You just see it turn green.',
      url: 'app.ledgerly.com',
    },
    points: [
      { id: 'paid', label: 'See what has landed, as it lands', focus: { x: 0.72, y: 0.5, zoom: 1.8 } },
      { id: 'due', label: 'Reminders that sound like you', focus: { x: 0.8, y: 0.8, zoom: 1.8 } },
      { id: 'payouts', label: 'Payouts in two business days', focus: { x: 0.3, y: 0.18, zoom: 1.6 } },
    ],
    media: (
      <FitToWindow>
        <Card className="rounded-none border-0 shadow-none">
          <CardHeader>
            <CardTitle>Invoices</CardTitle>
            <CardDescription>This week · next payout Friday</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="flex flex-col divide-y divide-line">
              {INVOICES.map((invoice) => (
                <li key={invoice.id} className="flex items-center gap-3 py-2.5">
                  <span className="min-w-0 flex-1 truncate text-ui font-medium">
                    {invoice.who} <span className="font-normal text-fg-muted">· {invoice.id}</span>
                  </span>
                  <span className="text-ui tabular-nums">{invoice.amount}</span>
                  <Badge variant={invoice.paid ? 'success' : 'warning'}>{invoice.paid ? 'Paid' : 'Due Friday'}</Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </FitToWindow>
    ),
    primaryCta: { label: 'Send your first invoice', href: '/invoices/new', onClick: fn() },
    secondaryCta: { label: 'Watch a demo', href: '/demo', onClick: fn() },
    onValueChange: fn(),
  },
  render: (args) => (
    <div className="min-h-dvh bg-canvas">
      <HeroSplit {...args} />
    </div>
  ),
}
