import type { Meta, StoryObj } from '@storybook/react-vite'
import { SetupStepper } from './setup-stepper'

const meta: Meta<typeof SetupStepper> = {
  title: 'Blocks/App/Setup Stepper',
  component: SetupStepper,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Set something up step by step: name it, pick from a list, place a slider, switch pills on and choose who gets access. The settings it will save update beside the form as you go. An AI assistant, a store and a course read the same way.',
      },
    },
  },
  argTypes: { step: { control: { type: 'inline-radio' }, options: [0, 1, 2] } },
}
export default meta
type Story = StoryObj<typeof SetupStepper>

/** Step 2 of 3, Behavior. Drag Creativity, switch tools on, change the model: watch the config’s lines wash and gain their `~`. */
export const Default: Story = { name: 'New assistant' }

/** Starts at Purpose, the first step. */
export const FirstStep: Story = { args: { step: 0 } }

/** On a page of its own: `embedded={false}` draws the centered canvas and the page's `h1` around it. By default it's the card alone, for your page to place. */
export const Standalone: Story = { args: { embedded: false } }

/** Commerce: a store's name, theme, payment methods and shipping zones. No slider (`scale={null}`), so the config skips its section; the card keeps the assistant's height. */
export const NewStore: Story = {
  name: 'New store',
  args: {
    scale: null,
    initial: {
      description: 'Small-batch ceramics for the kitchen table, made in Portland and shipped in plastic-free packaging.',
      name: 'Northwind Goods',
      choice: 'atlas',
      level: 0,
      options: ['card'],
      audience: 'domestic',
    },
    choices: [
      { value: 'atlas', label: 'Atlas', hint: 'Image-led, roomy' },
      { value: 'ledger', label: 'Ledger', hint: 'Dense catalog' },
      { value: 'meadow', label: 'Meadow', hint: 'Soft, editorial' },
    ],
    options: [
      { value: 'card', label: 'Credit card', id: 'payments.card' },
      { value: 'wallet', label: 'Digital wallet', id: 'payments.wallet' },
      { value: 'transfer', label: 'Bank transfer', id: 'payments.transfer' },
      { value: 'later', label: 'Pay later', id: 'payments.later' },
      { value: 'cod', label: 'Cash on delivery', id: 'payments.cod' },
    ],
    audiences: [
      { value: 'domestic', label: 'United States only' },
      { value: 'na', label: 'United States and Canada' },
      { value: 'world', label: 'Worldwide' },
    ],
    copy: {
      brand: 'Shopfront',
      title: 'New store',
      subtitle: 'Name it, pick how it looks and how customers pay. The config on the right is what gets saved.',
      stepDetails: 'Basics',
      stepDetailsDescription: 'A sentence or two for the top of your storefront.',
      stepSettings: 'Storefront',
      stepSettingsDescription: 'Its name, the theme it wears and the payment methods you accept.',
      stepAccess: 'Shipping',
      stepAccessDescription: 'Where orders can go. You can add zones after your first sale.',
      description: 'Store description',
      descriptionRequired: 'Say what the store sells.',
      name: 'Store name',
      namePlaceholder: 'northwind-goods',
      nameHint: (handle: string) => (handle ? `Your store lives at ${handle}.shopfront.example` : 'Lowercase letters, numbers and dashes.'),
      nameRequired: 'Give it a name of 3 to 32 characters.',
      choice: 'Theme',
      options: 'Payment methods',
      optionsCount: (count: number) => (count ? `${count} accepted` : 'None accepted'),
      audience: 'Shipping zones',
      create: 'Open store',
      created: 'Open',
      previewFile: 'store.toml',
      previewSections: { main: '[store]', scale: '[unused]', options: '[payments]', access: '[shipping]' },
      previewKeys: { name: 'name', choice: 'theme', description: 'about', level: 'unused', options: 'accept', audience: 'ships_to' },
      changed: (count: number) => (count ? `${count} ${count === 1 ? 'change' : 'changes'} from the starter` : 'Starter defaults'),
      doneTitle: (handle: string) => `${handle} is open`,
      doneDescription: 'Add your first product, or preview the storefront as a customer.',
      open: 'Add a product',
    },
  },
}

/** Education: a course's title, level, weekly pace and modules. The pace slider runs 1 to 12 hours in whole steps, and the level's weeks are written after its hint. */
export const NewCourse: Story = {
  name: 'New course',
  args: {
    scale: {
      min: 1,
      max: 12,
      step: 1,
      ticks: 11,
      decimals: 0,
      zones: [{ label: 'Relaxed', to: 3 }, { label: 'Steady', to: 7 }, { label: 'Intensive' }],
    },
    initial: {
      description: 'A first course in turning spreadsheets into charts people can read at a glance. No coding needed.',
      name: 'Charts for everyone',
      choice: 'beginner',
      level: 4,
      options: ['data', 'color'],
      audience: 'cohort',
    },
    choices: [
      { value: 'beginner', label: 'Beginner', hint: 'No prerequisites', measure: 6 },
      { value: 'intermediate', label: 'Intermediate', hint: 'Basic statistics', measure: 8 },
      { value: 'advanced', label: 'Advanced', hint: 'Projects with real data', measure: 10 },
    ],
    options: [
      { value: 'data', label: 'Reading data', id: 'modules.data' },
      { value: 'color', label: 'Color and contrast', id: 'modules.color' },
      { value: 'story', label: 'Telling a story', id: 'modules.story' },
      { value: 'dash', label: 'Dashboards', id: 'modules.dashboards' },
      { value: 'review', label: 'Peer review', id: 'modules.review' },
    ],
    audiences: [
      { value: 'self', label: 'Self-paced, open to anyone' },
      { value: 'cohort', label: 'Cohort with a start date' },
      { value: 'private', label: 'Invited students only' },
    ],
    copy: {
      brand: 'Campfire Learning',
      title: 'New course',
      subtitle: 'Outline the course and how fast it moves. The config on the right is what students get.',
      stepDetails: 'Overview',
      stepDetailsDescription: 'What students will be able to do when they finish.',
      stepSettings: 'Structure',
      stepSettingsDescription: 'Its title, level, weekly pace and the modules it covers.',
      stepAccess: 'Enrollment',
      stepAccessDescription: 'Who can join. You can change this before the first class.',
      description: 'Course summary',
      descriptionRequired: 'Say what students will learn.',
      name: 'Course title',
      namePlaceholder: 'charts-for-everyone',
      nameHint: (handle: string) => (handle ? `Students find it at /courses/${handle}` : 'Lowercase letters, numbers and dashes.'),
      nameRequired: 'Give it a title of 3 to 32 characters.',
      choice: 'Level',
      measure: (amount: string) => `${amount} weeks`,
      scale: 'Pace (hours per week)',
      options: 'Modules',
      optionsCount: (count: number) => (count ? `${count} included` : 'None included'),
      audience: 'Who can enroll',
      create: 'Publish course',
      created: 'Published',
      previewFile: 'course.toml',
      previewSections: { main: '[course]', scale: '[schedule]', options: '[modules]', access: '[enrollment]' },
      previewKeys: { name: 'title', choice: 'level', description: 'summary', level: 'hours_per_week', options: 'included', audience: 'open_to' },
      changed: (count: number) => (count ? `${count} ${count === 1 ? 'change' : 'changes'} from the draft` : 'Draft defaults'),
      doneTitle: (handle: string) => `${handle} is published`,
      doneDescription: 'Share the link with your first cohort, or preview it as a student.',
      open: 'View course',
    },
  },
}
