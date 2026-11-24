import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { JsonViewer } from './index'

const meta: Meta<typeof JsonViewer> = {
  title: 'UI/Data/JSON Viewer',
  component: JsonViewer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A JSON value as a tree that opens and closes: keys and typed values in the code palette, objects and arrays counted ("{4}", "[12]"), long strings cut short until opened, and arrays of more than a hundred items opened a hundred at a time. Each row copies its value or its path, and the header copies the whole value or opens everything. It moves like Tree view: rows open with a height glide while the chevron turns, and the keys are Tree view’s.',
      },
    },
  },
  argTypes: {
    defaultExpandDepth: { control: { type: 'number', min: 0, max: 6 } },
    collapseStringsAfter: { control: { type: 'number', min: 8, max: 200 } },
    label: { control: 'text' },
  },
  args: { defaultExpandDepth: 1, collapseStringsAfter: 80, label: 'Payload' },
}
export default meta
type Story = StoryObj<typeof JsonViewer>

const STACK = [
  'PaymentError: card_declined',
  '    at chargeInvoice (billing/charge.ts:88:11)',
  '    at retry (lib/retry.ts:41:18)',
  '    at async handleInvoice (workers/invoices.ts:203:5)',
].join('\n')

/** A failed payment as a webhook delivers it: the shape a logs inspector shows. */
const EVENT = {
  id: 'evt_01JD8Q4M2Z9X',
  type: 'invoice.payment_failed',
  created: '2026-11-24T09:41:07Z',
  livemode: false,
  attempt: 3,
  amount_due: 4900,
  currency: 'eur',
  customer: {
    id: 'cus_8812',
    name: 'Mara Okafor',
    email: 'mara@northwind.example',
    tags: ['enterprise', 'eu-west'],
    balance: -1250.5,
  },
  request: {
    method: 'POST',
    url: 'https://api.northwind.example/v1/invoices/inv_2231/pay',
    headers: {
      'content-type': 'application/json',
      'idempotency-key': 'b6f1c2e0-9d3a-4b8e-a1c4-7f0e2d9b5a11',
      'user-agent': 'northwind-webhooks/1.4',
    },
  },
  error: {
    code: 'card_declined',
    message: 'Your card was declined. The issuing bank refused the charge; ask the customer to use another card or to contact their bank.',
    retryable: true,
    next_retry_at: null,
    stack: STACK,
  },
  lines: [
    { description: 'Pro plan, monthly', quantity: 1, amount: 3900 },
    { description: 'Extra seats', quantity: 2, amount: 1000 },
  ],
  metadata: {},
}

/** Every prop as a control. */
export const Playground: Story = {
  render: (args) => (
    <div className="w-[560px] max-w-full">
      <JsonViewer {...args} value={EVENT} />
    </div>
  ),
}

/** A webhook event in a logs inspector: the top level open, deeper objects closed until you open them. Hover a row to copy its value or its path. */
export const EventPayload: Story = {
  name: 'Event payload',
  render: (args) => (
    <div className="w-[560px] max-w-full">
      <JsonViewer {...args} value={EVENT} className="max-h-[520px]" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const tree = canvas.getByRole('tree', { name: 'Payload' })
    const first = within(tree).getAllByRole('treeitem')[0]!
    // Focus a row from the keyboard: its copy buttons show, and they're next in the tab order.
    await userEvent.click(canvasElement.ownerDocument.body)
    first.focus()
    const copy = await within(first).findByRole('button', { name: 'Copy value' })
    await waitFor(() => expect(getComputedStyle(copy.parentElement!).opacity).toBe('1'))
    await userEvent.tab()
    await expect(copy).toHaveFocus()
    // Another row's buttons stay hidden.
    await userEvent.keyboard('{Shift>}{Tab}{/Shift}{ArrowDown}')
    await waitFor(() => expect(within(first).queryByRole('button', { name: 'Copy value' })).toBeNull())
  },
}

const ORDERS = {
  object: 'list',
  url: '/v1/orders',
  has_more: true,
  next_cursor: 'ord_0250',
  data: Array.from({ length: 250 }, (_, i) => ({
    id: `ord_${String(i + 1).padStart(4, '0')}`,
    status: ['paid', 'pending', 'refunded', 'failed'][i % 4],
    total: Math.round((19 + ((i * 37) % 180) + (i % 3) * 0.5) * 100) / 100,
    items: (i % 4) + 1,
  })),
}

/** An API response with 250 orders: the array opens onto ranges of a hundred, and each range onto its orders. */
export const BigArray: Story = {
  name: 'API response',
  args: { label: 'GET /v1/orders · 200' },
  render: (args) => (
    <div className="w-[560px] max-w-full">
      <JsonViewer {...args} value={ORDERS} className="max-h-[480px]" />
    </div>
  ),
}

const TOKEN = {
  access_token:
    'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzQyIiwic2NvcGUiOiJyZWFkOm9yZGVycyB3cml0ZTpvcmRlcnMiLCJpYXQiOjE3MzI0NDE2MDAsImV4cCI6MTczMjQ0NTIwMH0.c2lnbmF0dXJlLWdvZXMtaGVyZQ',
  token_type: 'Bearer',
  expires_in: 3600,
  scope: 'read:orders write:orders',
  error_detail: STACK,
}

/** `collapseStringsAfter={40}`: longer strings end in an ellipsis, and open onto their whole text, line breaks and all. */
export const LongStrings: Story = {
  name: 'Long strings',
  args: { label: 'Token response', collapseStringsAfter: 40 },
  render: (args) => (
    <div className="w-[480px] max-w-full">
      <JsonViewer {...args} value={TOKEN} />
    </div>
  ),
}

/** `defaultExpandDepth={Infinity}`: every object and array starts open. The header button closes them all, and opens them again. */
export const AllOpen: Story = {
  name: 'All open',
  args: { label: 'Invoice', defaultExpandDepth: Infinity },
  render: (args) => (
    <div className="w-[560px] max-w-full">
      <JsonViewer {...args} value={{ customer: EVENT.customer, request: EVENT.request, lines: EVENT.lines }} />
    </div>
  ),
}

const circular: Record<string, unknown> = { name: 'node', children: [] }
;(circular.children as unknown[]).push({ name: 'child', parent: circular })

/** What each kind of value looks like, and a few edge cases: empty objects and arrays, keys that need quotes, a Date (shown as JSON writes it) and a value that holds itself. */
export const EveryValue: Story = {
  name: 'Every kind of value',
  args: { label: 'Values', defaultExpandDepth: 2 },
  render: (args) => (
    <div className="grid w-[560px] max-w-full gap-3">
      <JsonViewer
        {...args}
        value={{
          string: 'Hello',
          number: 42.5,
          negative: -7,
          boolean: true,
          null: null,
          empty_object: {},
          empty_array: [],
          'two words': 'a key with a space reads plainly',
          ' padded ': 'quoted, to show its spaces',
          '': 'an empty key',
          when: new Date(Date.UTC(2026, 10, 24, 9, 41)),
          unicode: 'café ☕ 東京',
          circular,
        }}
      />
      <JsonViewer label="A string at the root" value="Just one value" />
      <JsonViewer label="An empty array" value={[]} />
    </div>
  ),
}

/** In a narrow side panel with a fixed height: long values wrap, and the tree scrolls under the header. */
export const NarrowPanel: Story = {
  name: 'In a narrow panel',
  args: { label: 'Request' },
  render: (args) => (
    <div className="w-[300px]">
      <JsonViewer {...args} value={EVENT.request} defaultExpandDepth={2} className="max-h-60" />
    </div>
  ),
}

/** Reduced motion: rows open and close at once, and the copy icons go straight to their check. */
export const ReducedMotion: Story = {
  name: 'Reduced motion',
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className="w-[560px] max-w-full">
        <JsonViewer {...args} value={EVENT} />
      </div>
    </YoujProvider>
  ),
}
