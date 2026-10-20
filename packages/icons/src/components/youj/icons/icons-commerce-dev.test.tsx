import { fireEvent, render } from '@testing-library/react'
import { YoujProvider } from '@youj/core'
import { installObservers } from '@youj/core/test-utils'
import {
  BugIcon,
  CloudIcon,
  CodeIcon,
  CreditCardIcon,
  GaugeIcon,
  GiftIcon,
  GitPullRequestIcon,
  PackageIcon,
  PlugIcon,
  ScanFaceIcon,
  ShieldAlertIcon,
  ShoppingCartIcon,
  StoreIcon,
  TrendingDownIcon,
  type YoujIconComponent,
} from './index'
import { describeMorphs, describeStateLabels } from '../../../test/icon-contract'

beforeAll(installObservers)

const full = ({ children }: { children: React.ReactNode }) => <YoujProvider reducedMotion="never">{children}</YoujProvider>

const STATES: [YoujIconComponent, [string, string]][] = [
  [ShoppingCartIcon, ['empty', 'added']],
  [CreditCardIcon, ['card', 'paid']],
  [GiftIcon, ['closed', 'open']],
  [PackageIcon, ['in transit', 'delivered']],
  [StoreIcon, ['open', 'closed']],
  [CodeIcon, ['code', 'json']],
  [BugIcon, ['bug', 'fixed']],
  [GitPullRequestIcon, ['open', 'merged']],
  [CloudIcon, ['cloud', 'synced']],
  [PlugIcon, ['plugged', 'unplugged']],
  [ShieldAlertIcon, ['alert', 'resolved']],
  [ScanFaceIcon, ['scanning', 'verified']],
  [GaugeIcon, ['low', 'high']],
  [TrendingDownIcon, ['falling', 'rising']],
]

/* The path each morph lands on, in the icon's end state, and the one it leaves. */
const MORPHS: [YoujIconComponent, { to: string[]; from: string[] }][] = [
  [CreditCardIcon, { to: ['M8.75 12.25 L11 14.5 L15.25 10.25'], from: ['M2.5 10 L12 10 L21.5 10'] }],
  [PackageIcon, { to: ['M8.5 7.25 L10.75 9.5 L14.75 5.5'], from: ['M7.75 4.75 L12 7 L16.25 9.25'] }],
  [TrendingDownIcon, { to: ['M3 17 L9 11 L13 15 L21 7', 'M15 7 H21 V13'], from: ['M3 7 L9 13 L13 9 L21 17', 'M15 17 H21 V11'] }],
  [ShieldAlertIcon, { to: ['M15 10 L11 14', 'M9 12 L11 14'], from: ['M12 7.5 L12 12', 'M12 15.5 L12.01 15.5'] }],
  [CloudIcon, { to: ['M9.5 14 L11.5 16 L15 12.5'], from: ['M9.5 14 L12.25 11.25 L15 14'] }],
  [ScanFaceIcon, { to: ['M8.5 12.5 C9.33 13.33 10.17 14.17 11 15 C12.5 13.5 14 12 15.5 10.5'], from: ['M8.5 14.5 C9.5 15.8 10.7 16.5 12 16.5 C13.3 16.5 14.5 15.8 15.5 14.5'] }],
  [GitPullRequestIcon, { to: ['M15 17.5 L10.5 17.5 C8.29 17.5 6.5 15.71 6.5 13.5 L6.5 13.5', 'M6.5 8 V20.5'], from: ['M17.5 15 L17.5 9.5 C17.5 7.29 15.71 5.5 13.5 5.5 L11.5 5.5', 'M6.5 8 V15'] }],
  [StoreIcon, { to: ['M3 8 C3 8 9 8 9 8 C9 8 15 8 15 8 C15 8 21 8 21 8'], from: ['M3 8 C3 12 9 12 9 8 C9 12 15 12 15 8 C15 12 21 12 21 8'] }],
  [CodeIcon, { to: ['M9 4 C8.83 4 8.67 4 8.5 4 C7.4 4 6.5 4.9 6.5 6 C6.5 7.33 6.5 8.67 6.5 10 C6.5 11.1 5.6 12 4.5 12 C5.6 12 6.5 12.9 6.5 14 C6.5 15.33 6.5 16.67 6.5 18 C6.5 19.1 7.4 20 8.5 20 C8.67 20 8.83 20 9 20'], from: [] }],
]

describe('commerce, dev & security state icons', () => {
  describeStateLabels(STATES)

  describeMorphs(MORPHS)

  test('uncontrolled state icons still preview their change on hover', () => {
    const { container } = render(<GaugeIcon />, { wrapper: full })
    const svg = container.querySelector('svg')!
    fireEvent.pointerEnter(svg)
    expect(svg).toHaveAttribute('data-state', 'active')
    fireEvent.pointerLeave(svg)
    expect(svg).toHaveAttribute('data-state', 'rest')
  })
})
