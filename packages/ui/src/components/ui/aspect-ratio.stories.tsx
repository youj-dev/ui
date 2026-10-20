import type { Meta, StoryObj } from '@storybook/react-vite'
import { MusicIcon, PlayIcon } from '@youj/icons'
import { AspectRatio } from './aspect-ratio'
import { Skeleton } from './skeleton'

const meta: Meta<typeof AspectRatio> = {
  title: 'UI/Layout/AspectRatio',
  component: AspectRatio,
  tags: ['autodocs'],
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'A box that keeps its shape as its width changes: the CSS aspect-ratio property, with the ratio as a number (16 / 9). The space is reserved before media loads, so nothing below it shifts. Fill it with a `size-full` child.',
      },
    },
  },
  args: { ratio: 16 / 9 },
}
export default meta
type Story = StoryObj<typeof AspectRatio>

/** A 16:9 video, a 1:1 cover and a 4:5 portrait, each holding its shape in a fluid column. */
export const Hero: Story = {
  render: () => (
    <div className="grid w-full max-w-3xl grid-cols-[2fr_1fr_1fr] items-start gap-4">
      <figure className="flex flex-col gap-2">
        <AspectRatio ratio={16 / 9} className="overflow-hidden rounded-lg border border-line">
          <div className="grid size-full place-items-center bg-linear-to-br from-accent/30 via-band to-canvas">
            <span className="grid size-12 place-items-center rounded-full bg-canvas text-fg shadow-md">
              <PlayIcon size={20} />
            </span>
          </div>
        </AspectRatio>
        <figcaption className="text-ui-sm text-fg-muted">16 / 9 · Launch keynote</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        <AspectRatio ratio={1} className="overflow-hidden rounded-lg border border-line">
          <div className="grid size-full place-items-center bg-linear-to-tr from-fg/15 to-band text-fg-muted">
            <MusicIcon size={24} />
          </div>
        </AspectRatio>
        <figcaption className="text-ui-sm text-fg-muted">1 · Cover</figcaption>
      </figure>
      <figure className="flex flex-col gap-2">
        <AspectRatio ratio={4 / 5} className="overflow-hidden rounded-lg">
          <Skeleton className="size-full rounded-none" />
        </AspectRatio>
        <figcaption className="text-ui-sm text-fg-muted">4 / 5 · Loading</figcaption>
      </figure>
    </div>
  ),
}
