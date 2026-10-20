import type { Meta, StoryObj } from '@storybook/react-vite'
import { PrinciplePair, Principles } from '../components/principles'

const meta: Meta = {
  title: 'Foundations/Principles',
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="mx-auto max-w-4xl p-4">{Story()}</div>],
}
export default meta

export const All: StoryObj = { render: () => <Principles /> }
export const LandDontBounce: StoryObj = { name: 'Land, don’t bounce', render: () => <PrinciplePair index={0} /> }
export const QuickInQuickerOut: StoryObj = { name: 'Quick in, quicker out', render: () => <PrinciplePair index={1} /> }
export const OvershootIsEarned: StoryObj = { name: 'Overshoot is earned', render: () => <PrinciplePair index={2} /> }
export const Cascade: StoryObj = { name: 'Cascade, don’t waterfall', render: () => <PrinciplePair index={3} /> }
export const FastNotSluggish: StoryObj = { name: 'Fast, not sluggish', render: () => <PrinciplePair index={4} /> }
export const ReducedKeepsMeaning: StoryObj = { name: 'Reduced motion keeps the meaning', render: () => <PrinciplePair index={5} /> }
