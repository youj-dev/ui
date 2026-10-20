import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { defineTheme } from '@youj/core'
import { PlaceholderPage } from '../../docs/placeholder-page'
import { CookieConsent } from './cookie-consent'

/** The showcase's warm amber accent. */
const cookieTheme = defineTheme({
  accent: 'oklch(0.6 0.1 60)', // youj-allow: theme accent
})

const meta: Meta<typeof CookieConsent> = {
  title: 'Blocks/Marketing/Cookie Consent',
  component: CookieConsent,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'overlay' },
    docs: {
      description: {
        component:
          'Let visitors choose their cookie preferences with a banner they can reopen later.',
      },
    },
  },
  // Over a stand-in page, as it rises over yours. The showcase's look: the block itself inherits the app's theme.
  args: { children: <PlaceholderPage />, theme: cookieTheme },
}
export default meta
type Story = StoryObj<typeof CookieConsent>

export const Banner: Story = {}

export const Preferences: Story = { args: { defaultOpen: 'preferences' } }

export const WithYourData: Story = {
  name: 'With your data',
  args: {
    categories: [
      {
        id: 'essential',
        title: 'Essential',
        description: 'Keep your account secure and your trip itinerary saved between visits.',
        required: true,
        cookies: [{ name: 'tl_auth', purpose: 'Signed-in session', expires: 'Session' }],
      },
      {
        id: 'personalisation',
        title: 'Personalisation',
        description: 'Suggest destinations based on the trips you have browsed.',
        cookies: [{ name: 'tl_recent', purpose: 'Recently viewed trips', expires: '60 days' }],
      },
    ],
    onSave: fn(),
    onValueChange: fn(),
    policyHref: '#privacy',
    copy: {
      title: 'Cookies help us plan better trips',
      description: 'We keep you signed in and, if you allow it, suggest places you might like. See our',
      policyLink: 'privacy notice',
      dialogDescription: 'Choose which cookies Tideline may set.',
      footnote: 'Your choice is stored for twelve months.',
    },
  },
}

/** A news site's four categories, with its own words. Props only. */
export const NewspaperSite: Story = {
  name: 'Newspaper site',
  args: {
    categories: [
      {
        id: 'necessary',
        title: 'Necessary',
        description: 'Keep you signed in to your subscription and remember your consent choice.',
        required: true,
        cookies: [
          { name: 'ch_session', purpose: 'Subscriber sign-in', expires: 'Session' },
          { name: 'ch_consent', purpose: 'Your cookie choice', expires: '6 months' },
        ],
      },
      {
        id: 'analytics',
        title: 'Analytics',
        description: 'Show us which stories are read, so the newsroom knows what matters. Anonymous.',
        cookies: [
          { name: '_ch_vid', purpose: 'Counts unique readers', expires: '1 year' },
          { name: '_ch_depth', purpose: 'Measures scroll depth', expires: 'Session' },
        ],
      },
      {
        id: 'ads',
        title: 'Personalized ads',
        description: 'Match ads to your interests, which helps keep reporting free for everyone.',
        cookies: [
          { name: '_ad_seg', purpose: 'Interest segments', expires: '90 days' },
          { name: '_ad_freq', purpose: 'Limits repeat ads', expires: '30 days' },
        ],
      },
      {
        id: 'video',
        title: 'Embedded video',
        description: 'Let videos from other services play inside articles. They may set their own cookies.',
        cookies: [{ name: 'VIDEO_PREF', purpose: 'Remembers volume and captions', expires: '1 year' }],
      },
    ],
    onSave: fn(),
    onValueChange: fn(),
    policyHref: '#privacy',
    copy: {
      title: 'Your privacy at The Cedar Herald',
      description: 'We use cookies to run the site, understand readership and, if you agree, show ads you’re more likely to care about. Read our',
      policyLink: 'privacy policy',
      dialogDescription: 'Choose which cookies The Cedar Herald may set. Reading never requires ads.',
      footnote: 'We keep your choice for six months, then ask again.',
    },
  },
}
