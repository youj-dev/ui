import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { RadialNetwork } from './radial-network'

const meta: Meta<typeof RadialNetwork> = {
  title: 'Blocks/App/Radial Network',
  component: RadialNetwork,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'See what one thing reaches, ring by ring: nodes in their kind’s color, a state can give one a solid or dashed ring in its own tone, and the foot counts each state and the total for the hops shown. Security, marketing and health read the same way.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof RadialNetwork>

/** a.moreau after the takeover: four things compromised one hop out, five at risk on the next ring. */
export const Default: Story = { name: 'Account takeover' }

/** One hop: the outer ring folded into the things it hangs from, and the counts for that ring. */
export const OneHop: Story = { name: 'One hop', args: { defaultHops: 1 } }

/** Other data: a leaked deploy key, German words, your own kinds, and the hop picks in Actions. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    locale: 'de-DE',
    center: { id: 'key', name: 'deploy-key-7', short: 'DK', kind: 'code', state: 'compromised' },
    kinds: [
      { id: 'code', label: 'Code', tone: 'chart-2' },
      { id: 'infra', label: 'Infrastruktur', tone: 'chart-5' },
    ],
    states: [
      { id: 'compromised', label: 'Kompromittiert', ring: 'solid', tone: 'danger', count: true, emphasis: true },
      { id: 'at-risk', label: 'Gefährdet', ring: 'dashed', tone: 'danger', count: true },
      { id: 'clean', label: 'Sauber' },
    ],
    nodes: [
      { id: 'repo', name: 'web-app', kind: 'code', state: 'compromised', note: 'Push mit dem Schlüssel' },
      { id: 'ci', name: 'ci-pipeline', kind: 'infra', state: 'at-risk', note: 'Baut jeden Push' },
      { id: 'stage', name: 'staging', via: 'ci', kind: 'infra', state: 'at-risk' },
      { id: 'prod', name: 'production', via: 'ci', kind: 'infra', state: 'clean' },
    ],
    copy: {
      title: 'Reichweite',
      subtitle: (center: string) => `Von ${center}`,
      hops: (n: number) => (n === 1 ? '1 Schritt' : `${n} Schritte`),
      total: 'Objekte',
    },
    onHopsChange: fn(),
  },
}

/** Marketing: who one creator's posts brought in. Subscribed is a solid green ring, Trial a dashed amber one, the rest plain. */
export const ReferralNetwork: Story = {
  name: 'Referral network',
  args: {
    center: { id: 'lena', name: 'Lena Ortiz', short: 'LO', kind: 'social' },
    kinds: [
      { id: 'newsletter', label: 'Newsletter', tone: 'chart-1' },
      { id: 'social', label: 'Social', tone: 'chart-2' },
      { id: 'podcast', label: 'Podcast', tone: 'chart-3' },
      { id: 'friends', label: 'Friends', tone: 'chart-4' },
    ],
    states: [
      { id: 'converted', label: 'Subscribed', ring: 'solid', tone: 'success', count: true, emphasis: true },
      { id: 'pending', label: 'Trial', ring: 'dashed', tone: 'warning', count: true },
      { id: 'visited', label: 'Visited' },
    ],
    nodes: [
      { id: 'march', name: 'March issue', kind: 'newsletter', state: 'converted', note: 'Joined from the March issue' },
      { id: 'thread', name: 'Pricing thread', kind: 'social', state: 'converted', note: 'Replied, then signed up' },
      { id: 'pod', name: 'Maker Hours', kind: 'podcast', state: 'pending', note: 'Started a trial after episode 41' },
      { id: 'dinner', name: 'Dinner club', kind: 'friends', state: 'visited' },
      { id: 'sam', name: 'Sam Whitaker', via: 'march', kind: 'friends', state: 'converted', note: 'Forwarded the issue to a teammate' },
      { id: 'noor', name: 'Noor Haddad', via: 'march', kind: 'newsletter', state: 'pending', note: 'Trial ends Friday' },
      { id: 'dev', name: 'Dev Patel', via: 'march', kind: 'newsletter', state: 'visited' },
      { id: 'ines', name: 'Inés Rojas', via: 'thread', kind: 'social', state: 'converted', note: 'Joined from a quote post' },
      { id: 'bo', name: 'Bo Lindgren', via: 'thread', kind: 'social', state: 'visited' },
      { id: 'maya', name: 'Maya Chen', via: 'pod', kind: 'podcast', state: 'pending', note: 'Opened the pricing page twice' },
      { id: 'tom', name: 'Tom Brandt', via: 'pod', kind: 'podcast', state: 'visited' },
      { id: 'ada', name: 'Ada Kimani', via: 'dinner', kind: 'friends', state: 'converted', note: 'Joined from a dinner chat' },
      { id: 'leo', name: 'Leo Novak', via: 'dinner', kind: 'friends', state: 'visited' },
      { id: 'zoe', name: 'Zoe Park', via: 'dinner', kind: 'friends', state: 'pending' },
    ],
    copy: {
      title: 'Referral reach',
      subtitle: (center: string) => `From ${center}`,
      total: 'People',
      hopsLabel: 'Rings',
      graphLabel: (center: string) => `Who ${center} brought in`,
    },
  },
}

/** Health: who a case exposed. Positive is a solid red ring, Exposed a dashed amber one, Clear plain. */
export const ContactTracing: Story = {
  name: 'Contact tracing',
  args: {
    center: { id: 'case', name: 'Case 0412', short: 'C1', kind: 'household' },
    kinds: [
      { id: 'household', label: 'Household', tone: 'chart-1' },
      { id: 'work', label: 'Work', tone: 'chart-2' },
      { id: 'school', label: 'School', tone: 'chart-3' },
      { id: 'clinic', label: 'Clinic', tone: 'chart-4' },
    ],
    states: [
      { id: 'positive', label: 'Positive', ring: 'solid', tone: 'danger', count: true, emphasis: true },
      { id: 'exposed', label: 'Exposed', ring: 'dashed', tone: 'warning', count: true },
      { id: 'clear', label: 'Clear' },
    ],
    nodes: [
      { id: 'partner', name: 'Partner', kind: 'household', state: 'positive', note: 'Tested positive on day 3' },
      { id: 'child', name: 'Child', kind: 'household', state: 'exposed', note: 'Shared a room, test pending' },
      { id: 'desk', name: 'Desk neighbor', kind: 'work', state: 'exposed', note: 'Four hours in one meeting room' },
      { id: 'carpool', name: 'Carpool', kind: 'work', state: 'clear', note: 'Negative on day 5' },
      { id: 'waiting', name: 'Waiting room', kind: 'clinic', state: 'exposed', note: 'Same hour, same room' },
      { id: 'grand', name: 'Grandparent', via: 'partner', kind: 'household', state: 'exposed', note: 'Visited on Sunday' },
      { id: 'sitter', name: 'Sitter', via: 'partner', kind: 'household', state: 'clear' },
      { id: 'class', name: 'Class 4B', via: 'child', kind: 'school', state: 'exposed', note: 'Sat beside the child' },
      { id: 'bus', name: 'School bus', via: 'child', kind: 'school', state: 'clear' },
      { id: 'team', name: 'Sales team', via: 'desk', kind: 'work', state: 'positive', note: 'One case, symptoms on day 4' },
      { id: 'lunch', name: 'Lunch group', via: 'desk', kind: 'work', state: 'clear' },
      { id: 'rider', name: 'Carpool rider', via: 'carpool', kind: 'work', state: 'clear' },
      { id: 'nurse', name: 'Triage nurse', via: 'waiting', kind: 'clinic', state: 'exposed', note: 'Wore a mask throughout' },
      { id: 'lab', name: 'Lab desk', via: 'waiting', kind: 'clinic', state: 'clear' },
      { id: 'pharmacy', name: 'Pharmacy', via: 'waiting', kind: 'clinic', state: 'clear' },
    ],
    copy: {
      title: 'Exposure map',
      subtitle: (center: string) => `From ${center}`,
      total: 'Contacts',
      graphLabel: (center: string) => `Who ${center} exposed`,
    },
  },
}

/** Skeletons hold the graph's place while the data loads; the key and foot keep their size. */
export const Loading: Story = { args: { loading: true } }

/** Nothing reached: the empty message in the graph's place. */
export const Empty: Story = { args: { nodes: [] } }

/** The load failed: the message with Retry in the graph's place. */
export const Error: Story = { args: { error: 'Couldn’t load the graph.', onRetry: fn() } }

/** Drawn as its own page, with the title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false } }
