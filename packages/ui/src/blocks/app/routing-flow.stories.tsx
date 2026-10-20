import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RoutingFlow } from './routing-flow'

const meta: Meta<typeof RoutingFlow> = {
  title: 'Blocks/App/Routing Flow',
  component: RoutingFlow,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See how a stream is routed and what it costs: the blended cost, a strategy switch (your own strategies) that reshapes the split, the source fanning out to each route as a stream as dense as its share, the routes with share, time, cost and failures, a fallback rule, and Deploy policy for the draft. LLM traffic, card payments and a water network read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof RoutingFlow>

/** The live policy, Balanced: Orrery 2 takes the most, Kestrel 3 Pro the costly answers, Moth 8B a slice on the team's own hardware. */
export const Default: Story = { name: 'LLM routing' }

/** A draft: Cost picked first, so the blended price drops against live, the badge turns to Draft and Deploy policy wakes up. */
export const Draft: Story = { args: { defaultStrategy: 'cost', onStrategyChange: fn() } }

/** Other data: three models in euros, a smaller pool, German words and the deploy in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    throughput: 86,
    routes: [
      { id: 'lumen', name: 'Lumen 4', detail: 'Vela', tone: 'chart-5', cost: 9.2, time: { typical: 0.74, slow: 1.9 }, failRate: 0.003 },
      { id: 'wren', name: 'Wren Mini', detail: 'Vela', tone: 'chart-2', cost: 0.6, time: { typical: 0.19, slow: 0.51 }, failRate: 0.004 },
      { id: 'tern', name: 'Tern 12B', detail: 'Eigenbetrieb', tone: 'chart-4', cost: 1.1, time: { typical: 0.33, slow: 0.88 }, failRate: 0.013 },
    ],
    strategies: [
      { id: 'cost', label: 'Kosten' },
      { id: 'balanced', label: 'Ausgewogen' },
      { id: 'quality', label: 'Qualität' },
    ],
    shares: {
      cost: { lumen: 0.1, wren: 0.6, tern: 0.3 },
      balanced: { lumen: 0.3, wren: 0.5, tern: 0.2 },
      quality: { lumen: 0.7, wren: 0.25, tern: 0.05 },
    },
    policy: { version: 3, strategy: 'balanced', fallback: { enabled: false, from: 'wren', to: 'lumen' } },
    copy: {
      title: 'Modell-Router',
      pool: 'support-de',
      blended: 'Mischpreis',
      sameAsLive: 'Wie live',
      changed: 'Geändert',
      perMillion: '/ 1 Mio. Tokens',
      vsLive: 'ggü. live',
      facts: (rate: string, p95: string, errors: string) => `${rate} Anfr./s · p95 ${p95} s · ${errors} Fehler`,
      routes: 'Routen',
      route: 'Modell',
      share: 'Anteil',
      cost: '€ / 1 Mio.',
      failures: 'Fehler',
      fallback: 'Ausweichen',
      fallbackIf: 'wenn',
      fallbackThen: 'scheitert, erneut mit',
      policy: (version: number) => `Richtlinie v${version}`,
      unsaved: 'Nicht gespeichert',
      revert: 'Verwerfen',
      deploy: 'Richtlinie ausrollen',
      currency: 'EUR',
    },
    onDeploy: fn(),
  },
}

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }

/** Finance: card payments over four processors. Cost is the fee per transaction, time the authorization, and a failure a decline; strategies are Cheapest, Balanced and Highest approval. */
export const PaymentRouting: Story = {
  name: 'Payment routing',
  args: {
    routes: [
      { id: 'northpay', name: 'Northpay', detail: 'Cards', tone: 'chart-1', cost: 0.34, time: { typical: 0.9, slow: 2.4 }, failRate: 0.031 },
      { id: 'ledgerline', name: 'Ledgerline', detail: 'Wallets', tone: 'chart-2', cost: 0.29, time: { typical: 1.1, slow: 3.1 }, failRate: 0.046 },
      { id: 'brightwire', name: 'Brightwire', detail: 'Acquirer', tone: 'chart-3', cost: 0.41, time: { typical: 0.7, slow: 1.8 }, failRate: 0.024 },
      { id: 'corvid', name: 'Corvid Pay', detail: 'Local', tone: 'chart-4', cost: 0.22, time: { typical: 1.6, slow: 4.2 }, failRate: 0.071 },
    ],
    strategies: [
      { id: 'cheapest', label: 'Cheapest' },
      { id: 'balanced', label: 'Balanced' },
      { id: 'approval', label: 'Highest approval' },
    ],
    shares: {
      cheapest: { northpay: 0.18, ledgerline: 0.37, brightwire: 0.05, corvid: 0.4 },
      balanced: { northpay: 0.4, ledgerline: 0.3, brightwire: 0.2, corvid: 0.1 },
      approval: { northpay: 0.45, ledgerline: 0.1, brightwire: 0.43, corvid: 0.02 },
    },
    throughput: 48,
    failWarnAt: 0.05,
    formats: {
      time: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      rate: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
    },
    policy: { version: 31, strategy: 'balanced', fallback: { enabled: true, from: 'northpay', to: 'ledgerline' } },
    copy: {
      title: 'Payment routing',
      pool: 'web checkout',
      blended: 'Blended fee',
      perMillion: '/ transaction',
      facts: (rate: string, p95: string, declined: string) => `${rate} txn/s · p95 ${p95} s · ${declined} declined`,
      source: 'Checkout',
      flow: 'Transactions by processor',
      rate: (rate: string) => `${rate}/s`,
      routes: 'Processors',
      route: 'Processor',
      time: 'Auth s',
      cost: 'Fee',
      failures: 'Denied',
      strategy: 'Routing preference',
      announceStrategy: (strategy: string, cost: string) => `${strategy}: ${cost} per transaction`,
    },
  },
}

/** Utilities: one reservoir over four treatment plants and mains. Cost is dollars per 1,000 gallons, time is hours in transit (one decimal, `timeUnit` h), a failure is water lost on the way; strategies are Lowest cost, Balanced and Pressure. */
export const WaterNetwork: Story = {
  name: 'Water network',
  args: {
    routes: [
      { id: 'ridgeview', name: 'Ridgeview Plant', tone: 'chart-1', cost: 3.2, time: { typical: 2.4, slow: 4.1 }, failRate: 0.042 },
      { id: 'millbrook', name: 'Millbrook Plant', tone: 'chart-2', cost: 2.6, time: { typical: 3.1, slow: 5.6 }, failRate: 0.065 },
      { id: 'eastgate', name: 'Eastgate Main', tone: 'chart-3', cost: 4.4, time: { typical: 1.2, slow: 2.3 }, failRate: 0.028 },
      { id: 'harbor', name: 'Harbor Link', tone: 'chart-4', cost: 5.8, time: { typical: 4.8, slow: 8.9 }, failRate: 0.118 },
    ],
    strategies: [
      { id: 'cost', label: 'Lowest cost' },
      { id: 'balanced', label: 'Balanced' },
      { id: 'pressure', label: 'Pressure' },
    ],
    shares: {
      cost: { ridgeview: 0.34, millbrook: 0.5, eastgate: 0.12, harbor: 0.04 },
      balanced: { ridgeview: 0.4, millbrook: 0.25, eastgate: 0.28, harbor: 0.07 },
      pressure: { ridgeview: 0.3, millbrook: 0.1, eastgate: 0.5, harbor: 0.1 },
    },
    throughput: 1840,
    failWarnAt: 0.1,
    formats: {
      time: { minimumFractionDigits: 1, maximumFractionDigits: 1 },
      rate: { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 },
    },
    policy: { version: 7, strategy: 'balanced', fallback: { enabled: true, from: 'ridgeview', to: 'eastgate' } },
    copy: {
      title: 'Water network',
      pool: 'North zone',
      blended: 'Blended cost',
      perMillion: '/ 1,000 gal',
      facts: (rate: string, p95: string, lost: string) => `${rate} kgal/h · transit ${p95} h · ${lost} lost`,
      source: 'Cedar Reservoir',
      flow: 'Supply by route',
      rate: (rate: string) => `${rate} kgal/h`,
      routes: 'Supply routes',
      route: 'Route',
      time: 'Transit h',
      timeUnit: 'h',
      cost: '$ / kgal',
      failures: 'Loss',
      strategy: 'Supply strategy',
      fallbackThen: 'is offline, divert to',
      policy: (version: number) => `Plan v${version}`,
      deploy: 'Deploy plan',
      announceStrategy: (strategy: string, cost: string) => `${strategy}: ${cost} per 1,000 gallons`,
    },
  },
}

/** Skeletons for the figures, the flow and the table while your data loads; the card keeps its size. */
export const Loading: Story = { args: { loading: true } }

/** Nothing to route yet: dashes for the figures, the empty message in the flow's place. */
export const Empty: Story = { args: { routes: [] } }

/** The load failed: dashes for the figures, the message with Retry in the flow's place. */
export const Error: Story = { args: { error: 'Couldn’t reach the gateway.', onRetry: fn() } }
