import type { Meta, StoryObj } from '@storybook/react-vite'
import { ColorSwatches, ContrastMatrix } from '../components/color-system'

const meta: Meta = {
  title: 'Foundations/Color',
  parameters: { layout: 'padded' },
  decorators: [(Story) => <div className="mx-auto max-w-5xl p-4">{Story()}</div>],
}
export default meta

export const Swatches: StoryObj = { render: () => <ColorSwatches /> }
export const Contrast: StoryObj = { render: () => <ContrastMatrix /> }
