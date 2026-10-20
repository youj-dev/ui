import type { Meta, StoryObj } from '@storybook/react-vite'
import { illustrations } from '@youj/illustrations'
import { Button } from '../../components/ui/button'
import { AuthHeader, AuthShell } from './shell'

const meta: Meta<typeof AuthShell> = {
  title: 'Blocks/Auth/Shell',
  component: AuthShell,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen', illustration: true, partOf: 'app-auth-flow' },
    docs: {
      description: {
        component:
          'Frame your sign-in screens with a centered card or a split page with room for artwork.',
      },
    },
  },
  argTypes: { illustration: { control: 'select', options: illustrations.map((i) => i.id) } },
}
export default meta
type Story = StoryObj<typeof AuthShell>

const content = (
  <div className="flex flex-col gap-6">
    <AuthHeader title="Your page here" description="Anything that belongs on an auth screen." />
    <Button size="lg">Continue</Button>
  </div>
)

export const Card: Story = { args: { variant: 'card', children: content } }

export const Split: Story = { args: { variant: 'split', children: content } }

/** The split layout with another scene in its art panel: the vault, for a security-minded product. */
export const SplitSecurity: Story = { name: 'Split, security', args: { variant: 'split', illustration: 'security', children: content } }

/** Another product's brand, quote and legal links. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    variant: 'split',
    illustration: 'security',
    brand: { name: 'Fernleaf Health', href: '/' },
    copy: {
      quote: '“Our patients book, pay and message us in one place now. Front-desk calls halved in a month.”',
      quoteName: 'Amara Diallo',
      quoteRole: 'Practice Manager, Riverside Clinic',
      legalBefore: 'By continuing you accept our',
      legalTerms: 'patient terms',
      legalPrivacy: 'privacy notice',
    },
    links: { terms: '/legal/terms', privacy: '/legal/privacy' },
    children: content,
  },
}
