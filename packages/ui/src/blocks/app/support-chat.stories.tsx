import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { graphite } from '@youj/core'
import { PlaceholderPage } from '../../docs/placeholder-page'
import { SupportChat } from './support-chat'

const meta: Meta<typeof SupportChat> = {
  title: 'Blocks/App/Support Chat',
  component: SupportChat,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay', preset: 'graphite', address: 'app.tern.io/data/sources' },
    docs: {
      description: {
        component:
          'Give your customers a place to ask for help with a floating support chat widget.',
      },
    },
  },
  // Shown open over a stand-in page, as it floats over yours, in the showcase's look: the block itself inherits the app's theme.
  args: { children: <PlaceholderPage />, theme: graphite },
}
export default meta
type Story = StoryObj<typeof SupportChat>

/** Open on home: greeting, team, recent conversations, help search. */
export const Home: Story = { args: { defaultOpen: true } }

/** Closed, with two unread replies from Mira: the badge and the teaser. */
export const Closed: Story = {}

/** A new conversation with the assistant: try "My events stopped showing up", then "Still missing, get a person". */
export const Conversation: Story = { args: { defaultOpen: true, defaultView: 'new' } }

/** Mid-conversation with a person, after the handoff. */
export const WithAgent: Story = { args: { defaultOpen: true, defaultView: 'c-2231' } }

/** A closed conversation, waiting for its rating. */
export const Rating: Story = { args: { defaultOpen: true, defaultView: 'c-2107' } }

/** The team is away: home says when they're back, and asking for a person takes an email. */
export const Offline: Story = { args: { defaultOpen: true, defaultView: 'new', online: false } }

const ANA = { id: 'ana', name: 'Ana Ruiz', first: 'Ana', role: 'Data engineer', presence: 'online' as const }
const OWEN = { id: 'owen', name: 'Owen Hart', first: 'Owen', role: 'Support', presence: 'away' as const }

/** Quarry’s desk: its own team, a past thread, help articles, and replies from `onSend`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultOpen: true,
    brand: { name: 'Quarry' },
    user: { name: 'Lee Park', first: 'Lee', email: 'lee@fernway.co' },
    team: [ANA, OWEN],
    threads: [
      {
        id: 'q-118',
        title: 'Warehouse sync lagging',
        stage: 'agent',
        agent: ANA,
        unread: 1,
        when: '1h',
        messages: [
          { id: 'q1', from: 'user', text: 'Our Snowflake sync is 40 minutes behind.', at: new Date('2027-01-10T08:10:00Z') },
          { id: 'q2', from: 'agent', agent: ANA, text: 'A long-running merge held the lock. It finished, and the sync has caught up.', at: new Date('2027-01-10T08:32:00Z') },
        ],
        suggestions: ['Thanks, all good'],
      },
    ],
    articles: [
      { id: 'schedules', title: 'Run models on a schedule', topic: 'Models', minutes: 3 },
      { id: 'snowflake', title: 'Connect Snowflake with key-pair auth', topic: 'Warehouses', minutes: 4 },
      { id: 'alerts', title: 'Alert on failed runs in Slack', topic: 'Alerts', minutes: 2 },
    ],
    getArticleHref: (article) => `https://quarry.app/docs/${article.id}`,
    onSend: fn(async ({ text }: { text: string }) =>
      /person|human/i.test(text)
        ? { kind: 'handoff' as const, text: 'Bringing in Ana from the data team.', greeting: 'Hi Lee, Ana here. Which pipeline is it?' }
        : { kind: 'bot' as const, text: 'Most failed runs come from an expired warehouse credential. Check **Settings → Connections**.', suggestions: ['Talk to a person'] },
    ),
    onLeaveEmail: fn(),
    onRate: fn(),
    onFeedback: fn(),
    onOpenChange: fn(),
    copy: {
      helpPrompt: 'what are you stuck on?',
      replyTime: 'Usually replies within the hour',
      openers: ['A run failed', 'Talk to a person'],
      greeting: (first, bot) => `Hi ${first}, I’m **${bot}**. Ask me about pipelines, models and warehouses.`,
    },
  },
}

const DANA = { id: 'dana', name: 'Dana Whitfield', first: 'Dana', role: 'Pharmacist', presence: 'online' as const }
const RAUL = { id: 'raul', name: 'Raul Ortiz', first: 'Raul', role: 'Pharmacy technician', presence: 'online' as const }

/** A pharmacy's help desk: refill questions answered by the assistant, a pharmacist joins on request. Props only. */
export const PharmacyHelp: Story = {
  name: 'Pharmacy help',
  args: {
    defaultOpen: true,
    defaultView: 'new',
    brand: { name: 'Larkspur Pharmacy' },
    user: { name: 'Maya Brooks', first: 'Maya', email: 'maya@brooksfamily.net' },
    team: [DANA, RAUL],
    threads: [],
    articles: [
      { id: 'refill', title: 'Refill a prescription online', topic: 'Refills', minutes: 2 },
      { id: 'transfer', title: 'Transfer a prescription from another pharmacy', topic: 'Refills', minutes: 3 },
      { id: 'insurance', title: 'Update your insurance card', topic: 'Billing', minutes: 1 },
    ],
    getArticleHref: (article) => `https://larkspurrx.example/help/${article.id}`,
    onSend: async ({ text, stage }: { text: string; stage: string }) => {
      if (stage !== 'agent' && /pharmacist|person|someone|talk/i.test(text))
        return {
          kind: 'handoff' as const,
          text: 'Of course. I’m asking a pharmacist to join and sharing what we’ve covered so far.',
          agent: DANA,
          greeting: 'Hi Maya, Dana here. Your refill is ready for pickup after 2:00 p.m. today. Would you like it moved to delivery instead?',
          suggestions: ['Pickup is fine', 'Please deliver it'],
        }
      return {
        kind: 'bot' as const,
        text: 'Most refills are ready within **two hours** of your request. Check the status under **My prescriptions → Refills**, or I can bring in a pharmacist for questions about dosage or interactions.',
        suggestions: ['Talk to a pharmacist'],
      }
    },
    copy: {
      helpPrompt: 'what can we help with?',
      openers: ['When is my refill ready?', 'Talk to a pharmacist'],
      greeting: (first, bot) => `Hi ${first}, I’m **${bot}**. I can check refills, hours and insurance, and bring in a pharmacist whenever you’d like.`,
      replyTime: 'Pharmacists usually reply within 10 minutes',
      backAt: 'Back at 8:00 a.m. ET',
      offlineReply: 'The pharmacy is closed right now and reopens at 8:00 a.m. ET. Leave your email and we’ll reply there first thing.',
      handoffGreeting: (user, agent) => `Hi ${user}, ${agent} here. I’ve read the thread and I’m looking at your prescriptions now.`,
      handoffSuggestions: ['Thank you', 'I have a question about a dose'],
      searchPlaceholder: 'Search refills and billing',
    },
    children: (
      <main className="mx-auto flex max-w-4xl flex-col gap-2 px-6 py-10">
        <h1 className="text-xl font-semibold tracking-tight text-fg">My prescriptions</h1>
        <p className="text-ui text-fg-muted">3 active, 1 refill ready for pickup. Last updated today at 9:40 a.m.</p>
      </main>
    ),
  },
}
