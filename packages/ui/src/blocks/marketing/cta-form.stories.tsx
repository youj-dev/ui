import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { ThemeScope } from '@youj/core'
import { CheckIcon, UsersIcon } from '@youj/icons'
import { CtaForm } from './cta-form'

const meta: Meta<typeof CtaForm> = {
  title: 'Blocks/Marketing/CTA form',
  component: CtaForm,
  // The section is shorter than a screen: the page under it wears the same theme, so the frame shows no seam.
  render: (args) => {
    const page = (
      <div className="min-h-dvh bg-canvas">
        <CtaForm {...args} />
      </div>
    )
    return args.theme ? <ThemeScope theme={args.theme}>{page}</ThemeScope> : page
  },
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'section', preset: 'basalt' },
    docs: {
      description: {
        component:
          'Turn interest into an inquiry with a form for work email and team size beside your pitch.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof CtaForm>

export const Default: Story = {}

/** The signup API is down: the form keeps the email and team size and raises an alert. */
export const SendFails: Story = {
  args: { onSubmit: () => new Promise((_, reject) => setTimeout(() => reject(new Error('Service unavailable')), 900)) },
}

/** Inside a pricing page, below the plans: laid out by the host. */
export const Embedded: Story = {
  args: { embedded: true },
  render: (args) => (
    <main className="mx-auto min-h-dvh max-w-5xl bg-canvas p-6">
      <h1 className="sr-only">Pricing</h1>
      <CtaForm {...args} />
    </main>
  ),
}

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    onSubmit: fn(),
    proof: [
      { icon: CheckIcon, text: 'Every lab test in one timeline' },
      { icon: UsersIcon, text: 'Shared with your care team in a tap' },
    ],
    teamSizes: ['Solo', '2–5', '6–20'],
    defaultValues: { teamSize: '2–5' },
    requireWorkEmail: false,
    copy: {
      eyebrow: 'Clinic pilot',
      title: 'Bring your practice onto Meridian',
      description: 'We migrate your patient records over a weekend and train your front desk on Monday.',
      cardTitle: 'Book a pilot',
      cardDescription: 'We reply within one working day.',
      emailLabel: 'Email',
      emailPlaceholder: 'you@clinic.org',
      teamSizeLabel: 'Practitioners',
      submit: 'Request the pilot',
      finePrint: 'HIPAA-ready. No commitment.',
      doneHeading: (email: string) => `We’ll write to ${email}`,
      doneSteps: (size: string) => ['Pick a migration weekend.', `We set up ${size} practitioner seats.`],
    },
  },
}
