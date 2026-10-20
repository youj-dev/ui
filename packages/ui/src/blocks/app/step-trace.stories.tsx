import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { StepTrace } from './step-trace'
import type { StepTraceKind, StepTraceRun, StepTraceStep } from './step-trace/data'

const meta: Meta<typeof StepTrace> = {
  title: 'Blocks/App/Step Trace',
  component: StepTrace,
  // The gallery's picture: the demo run, without its Demo data badge.
  args: { demoMarker: false },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Watch one run work through its steps, then open any step to see what it was given and what it produced. An AI agent, a web request and a lab sample read the same way.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof StepTrace>

/** A release-notes agent: tool calls and model calls, one tool failing and a draft streaming in. */
export const Default: Story = { name: 'AI agent run' }

/** Frozen part-way, for a still. */
export const Paused: Story = { args: { live: false } }

/** The run complete: one failure, the rest through, ready to publish. */
export const Completed: Story = { args: { start: 40, live: false, defaultOpen: 'shots' } }

const json = (value: unknown) => JSON.stringify(value, null, 2)

const milliseconds = new Intl.NumberFormat('en', { style: 'unit', unit: 'millisecond', unitDisplay: 'narrow', maximumFractionDigits: 0 })
const kilobytes = new Intl.NumberFormat('en', { style: 'unit', unit: 'kilobyte', unitDisplay: 'narrow', maximumFractionDigits: 1 })
const bytes = new Intl.NumberFormat('en', { style: 'unit', unit: 'byte', unitDisplay: 'narrow', maximumFractionDigits: 0 })
const dollars = new Intl.NumberFormat('en', { style: 'currency', currency: 'USD' })
const benchMinutes = new Intl.NumberFormat('en', { style: 'unit', unit: 'minute', unitDisplay: 'narrow', maximumFractionDigits: 1 })
const milliliters = new Intl.NumberFormat('en', { style: 'unit', unit: 'milliliter', unitDisplay: 'narrow', maximumFractionDigits: 1 })

const REQUEST: StepTraceRun = { id: 'req_8f21', name: 'POST /checkout', task: 'Place the order for cart 4417 and send the receipt', method: 'api-gateway 3.8', place: 'eu-west-1' }

const SPANS: StepTraceKind[] = [
  { id: 'edge', label: 'Edge', tone: 'chart-1' },
  { id: 'service', label: 'Service', tone: 'chart-2' },
  { id: 'db', label: 'Database', tone: 'chart-3' },
  { id: 'external', label: 'External', tone: 'chart-5' },
]

const CHECKOUT: StepTraceStep[] = [
  {
    id: 'gateway',
    label: 'gateway',
    kind: 'edge',
    after: [],
    attempts: [0.012],
    size: { input: 612, output: 596 },
    input: json({ method: 'POST', path: '/checkout', headers: { authorization: 'Bearer …', 'content-type': 'application/json' } }),
    output: json({ routed: 'checkout-svc', rate_limit: { remaining: 58 } }),
  },
  {
    id: 'auth',
    label: 'auth.verify',
    kind: 'service',
    after: ['gateway'],
    attempts: [0.045],
    size: { input: 380, output: 224 },
    input: json({ token: 'eyJhbGciOi…', audience: 'shop' }),
    output: json({ user: 'u_9f3a', scopes: ['cart', 'orders'] }),
  },
  {
    id: 'cart',
    label: 'cart.load',
    kind: 'service',
    after: ['auth'],
    attempts: [0.038],
    size: { input: 140, output: 2310 },
    input: json({ cart: 4417 }),
    output: json({ items: 3, subtotal: 148.5, currency: 'USD', coupon: null }),
  },
  {
    id: 'stock',
    label: 'inventory.reserve',
    kind: 'db',
    after: ['cart'],
    attempts: [0.021],
    size: { input: 410, output: 182 },
    input: json({ skus: ['TS-204', 'MG-007', 'CP-112'], hold_minutes: 15 }),
    output: json({ reserved: 3, expires_in: 900 }),
  },
  {
    id: 'pricing',
    label: 'pricing.quote',
    kind: 'service',
    after: ['cart'],
    attempts: [0.031],
    size: { input: 520, output: 340 },
    input: json({ items: 3, ship_to: 'DE', coupon: null }),
    output: json({ total: 162.4, tax: 13.9, shipping: 0 }),
  },
  {
    id: 'payments',
    label: 'payments.charge',
    kind: 'external',
    after: ['stock', 'pricing'],
    attempts: [0.35, 0.29],
    error: '503 Service Unavailable: retried once',
    size: { input: 760, output: 410 },
    cost: 0.47,
    input: json({ amount: 162.4, currency: 'USD', card: '•••• 4242', idempotency_key: 'chk-4417-1' }),
    output: json({ status: 'succeeded', charge: 'ch_3Nf0aB', fee: 0.47 }),
  },
  {
    id: 'receipt',
    label: 'mail.send',
    kind: 'external',
    after: ['payments'],
    attempts: [0.4],
    fails: true,
    error: '504 Gateway Timeout: mail provider did not answer',
    size: { input: 3100, output: 0 },
    input: json({ to: 'ava@example.com', template: 'receipt', order: 'ORD-8812' }),
    output: json({ status: 504, error: 'Gateway Timeout' }),
  },
  {
    id: 'webhook',
    label: 'webhook.notify',
    kind: 'external',
    after: ['receipt'],
    attempts: [0.2],
    input: json({ event: 'order.created', order: 'ORD-8812' }),
    output: '',
  },
]

/** Tech: an HTTP request through gateway, auth, cart and payments, each span with its payload. Payments retried once; the receipt email timed out, so the webhook behind it was skipped. */
export const CheckoutRequest: Story = {
  name: 'Checkout request',
  args: {
    run: REQUEST,
    kinds: SPANS,
    steps: CHECKOUT,
    defaultOpen: 'payments',
    format: {
      duration: (ms) => milliseconds.format(ms),
      size: (n) => (n >= 1024 ? kilobytes.format(n / 1024) : bytes.format(n)),
      cost: (n) => dollars.format(n),
    },
    onApprove: fn(),
    copy: {
      title: 'Checkout',
      state: { running: 'In flight', done: 'Completed', failed: 'Failed' },
      steps: 'Spans',
      elapsed: 'Latency',
      size: 'Payload',
      cost: 'Fees',
      graph: 'Spans of the request',
      graphHint: 'Pick a span',
      closeStep: 'Close span',
      sizeInOut: 'Request / response',
      input: 'Request',
      output: 'Response',
      skippedAfter: 'Skipped: a span it needs failed or was skipped.',
      approve: 'Pin this trace',
      approving: 'Pinning…',
      approved: 'Pinned',
      announceDone: (failed: number) => (failed ? `Request complete, ${failed} ${failed === 1 ? 'span' : 'spans'} failed` : 'Request complete'),
      announcePublished: 'Trace pinned',
    },
  },
}

const LAB: StepTraceRun = { id: 'S-2291', name: 'Serum sample', task: 'Run the lipid panel for patient 7731 and release the result', method: 'Assay line 3', place: 'Lab B' }

const BENCH: StepTraceKind[] = [
  { id: 'intake', label: 'Intake', tone: 'chart-1' },
  { id: 'instrument', label: 'Instrument', tone: 'chart-3' },
  { id: 'review', label: 'Review', tone: 'chart-4' },
]

const SAMPLE: StepTraceStep[] = [
  {
    id: 'intake',
    label: 'intake',
    kind: 'intake',
    after: [],
    attempts: [1.4],
    input: 'Tube S-2291, serum, drawn 08:12 by Nurse Okafor. Label and wristband match.',
    output: 'Accepted. Volume 4.5 mL, no clots, stored at 4 °C.',
  },
  {
    id: 'spin',
    label: 'centrifuge',
    kind: 'instrument',
    after: ['intake'],
    attempts: [4.8],
    size: { input: 4500, output: 2100 },
    input: 'Spin 10 minutes at 3,000 g.',
    output: 'Serum separated. No hemolysis seen.',
  },
  {
    id: 'assay',
    label: 'assay',
    kind: 'instrument',
    after: ['spin'],
    attempts: [0.9, 6.2],
    error: 'Reagent pack low: swapped for pack R-118 and re-run',
    size: { input: 2100, output: 840 },
    cost: 3.2,
    input: 'Lipid panel on 2.1 mL: total cholesterol, HDL, LDL, triglycerides.',
    output: 'Total 182 mg/dL. HDL 54. LDL 108. Triglycerides 96. All within range.',
  },
  {
    id: 'qc',
    label: 'quality check',
    kind: 'review',
    after: ['assay'],
    attempts: [1.1],
    input: 'Compare against control lots L-40 and L-41 run in the same batch.',
    output: 'Both controls within two standard deviations.',
  },
  {
    id: 'review',
    label: 'pathologist review',
    kind: 'review',
    after: ['qc'],
    attempts: [2.6],
    input: 'Panel and controls for S-2291, flagged for nothing.',
    output: 'Reviewed and signed by Dr. Alvarez. Ready to release.',
  },
]

/** Science: a sample through intake, centrifuge, assay and review, every step's input and output as plain text. The assay re-ran once on a fresh reagent pack. */
export const LabSample: Story = {
  name: 'Lab sample',
  args: {
    run: LAB,
    kinds: BENCH,
    steps: SAMPLE,
    defaultOpen: 'assay',
    format: { duration: (ms) => benchMinutes.format(ms / 1000), size: (n) => milliliters.format(n / 1000), cost: (n) => dollars.format(n) },
    copy: {
      title: 'Lipid panel',
      state: { running: 'In progress', done: 'Finished', failed: 'Failed' },
      steps: 'Stages',
      elapsed: 'Time on bench',
      size: 'Volume',
      cost: 'Reagents',
      graph: 'Stages of the sample',
      graphHint: 'Pick a stage',
      closeStep: 'Close stage',
      sizeInOut: 'Volume in / out',
      input: 'Instruction',
      output: 'Result',
      approve: 'Release result',
      approving: 'Releasing…',
      approved: 'Released',
      announceDone: () => 'Sample complete',
      announcePublished: 'Result released',
    },
  },
}
