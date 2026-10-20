import type { Meta, StoryObj } from '@storybook/react-vite'
import type { AtmosphereScene } from '@youj/motion/backgrounds'
import { atmosphereStill } from '@youj/motion/components/youj/backgrounds/atmosphere'
import { YoujProvider } from '@youj/core/lib/youj/provider'
import { ImageAccordion, type ImageAccordionItem, type ImageAccordionProps } from './image-accordion'

/** The docs' backdrops that are code: the Atmosphere scenes as stills (no live shader in a small panel), in the toolbar's light or dark. */
function Backdrop({ scene }: { scene: AtmosphereScene }) {
  return (
    <div aria-hidden className="relative size-full">
      <div className="absolute inset-0 in-data-[theme=dark]:hidden" style={atmosphereStill(scene, 'light')} />
      <div className="absolute inset-0 hidden in-data-[theme=dark]:block" style={atmosphereStill(scene, 'dark')} />
    </div>
  )
}

const PLACES: ImageAccordionItem[] = [
  { id: 'meadow', media: <Backdrop scene="meadow" />, title: 'Meadow', description: 'One grass green, with sky and gold' },
  { id: 'sandstone', media: <Backdrop scene="sandstone" />, title: 'Sandstone', description: 'One raw sienna, with a night blue' },
  { id: 'cinnabar', media: <Backdrop scene="cinnabar" />, title: 'Cinnabar', description: 'One English red, with ivory' },
  { id: 'umber', media: <Backdrop scene="umber" />, title: 'Umber', description: 'One brass, with a slate blue' },
]

const meta: Meta<ImageAccordionProps> = {
  title: 'UI/Media/Image Accordion',
  component: ImageAccordion,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A row or column of pictures where one is open wide and the rest wait as slim strips. Pointing at a strip, focusing it or pressing it opens it (`activation="click"`: only a press, Enter or Space), and the open panel shows its caption. The component never changes size: the panels share its box, so only the split moves. Panels are buttons in one tab stop: the arrow keys of the orientation (mirrored in RTL), Home and End move between them; each is named by its title and described by its line, and the open one carries `aria-current`. Motion: the split glides on the smooth spring, the caption fades up once its panel opens. Reduced motion: both jump.',
      },
    },
  },
  args: { items: PLACES, defaultValue: 'meadow' },
  argTypes: {
    activation: { control: 'inline-radio', options: ['hover', 'click'] },
    orientation: { control: 'inline-radio', options: ['horizontal', 'vertical'] },
  },
}
export default meta
type Story = StoryObj<ImageAccordionProps>

const frame = 'w-[48rem] max-w-[calc(100vw-2rem)]'

export const Playground: Story = {
  render: (args) => (
    <div className={frame}>
      <ImageAccordion {...args} />
    </div>
  ),
}

/** Stacked panels: Up and Down move between them. */
export const Vertical: Story = {
  args: { orientation: 'vertical' },
  render: (args) => (
    <div className="w-[28rem] max-w-[calc(100vw-2rem)]">
      <ImageAccordion {...args} />
    </div>
  ),
}

/** Panels open only on a press, Enter or Space; hover and arrow keys just point. */
export const ClickActivation: Story = {
  args: { activation: 'click' },
  render: (args) => (
    <div className={frame}>
      <ImageAccordion {...args} />
    </div>
  ),
}

/** The split and the caption jump instead of gliding. */
export const ReducedMotion: Story = {
  render: (args) => (
    <YoujProvider reducedMotion="always">
      <div className={frame}>
        <ImageAccordion {...args} />
      </div>
    </YoujProvider>
  ),
}
