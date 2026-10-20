import type { Meta, StoryObj } from '@storybook/react-vite'
import { DurationScale } from '../components/duration-scale'
import { EasingVisualiser } from '../components/easing-visualiser'
import { SpringPlayground } from '../components/spring-playground'
import { StaggerDemo } from '../components/stagger-demo'

const meta: Meta = {
  title: 'Foundations/Motion',
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-4">{Story()}</div>],
}
export default meta

export const Easing: StoryObj = { render: () => <EasingVisualiser /> }
export const Durations: StoryObj = { render: () => <DurationScale /> }
export const Springs: StoryObj = { render: () => <SpringPlayground /> }
export const Stagger: StoryObj = { render: () => <StaggerDemo /> }
