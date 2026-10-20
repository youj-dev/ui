import type { Meta, StoryObj } from '@storybook/react-vite'
import { MarketingCta } from './cta'
import { Faq } from './faq'
import { FeatureGrid } from './feature-grid'
import { FeatureSpotlight } from './feature-spotlight'
import { MarketingFooter } from './footer'
import { HeroCentered } from './hero-centered'
import { MarketingNavbar } from './navbar'
import { Pricing } from './pricing'
import { MarketingMetrics } from './metrics'
import { SocialProof } from './social-proof'

const meta: Meta = {
  title: 'Blocks/Marketing/Landing page',
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'screen' },
    docs: {
      description: {
        component:
          'Build a complete landing page from sections for your pitch, features, customer proof and pricing.',
      },
    },
  },
}
export default meta

export const Default: StoryObj = {
  render: () => (
    <div className="bg-canvas">
      <MarketingNavbar />
      <main>
        <HeroCentered />
        <FeatureGrid />
        <FeatureSpotlight />
        <MarketingMetrics />
        <SocialProof />
        <Pricing />
        <Faq />
        <MarketingCta />
      </main>
      <MarketingFooter />
    </div>
  ),
}
