import type { Meta, StoryObj } from '@storybook/react-vite'
import { DotGrid } from '../grids'
import { Illustration, illustrationCategories, illustrations, type IllustrationCategory, type IllustrationId } from './registry'

type Args = { scene: IllustrationId; category: IllustrationCategory | 'all'; assemble: boolean; float: boolean; explode: 'hover' | 0 | 1; unit: number }

const meta: Meta<Args> = {
  title: 'Motion/Graphics/Illustrations',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Ready-made isometric scenes for product moments, each a small composition of the graphics kit framed to one shared volume, so any scene swaps for any other without the layout moving. Grouped by category: data, infrastructure, app and lifecycle for building the product, and everyday categories, from commerce, food and travel to sports, weather, pets and science, for everything people use it for. Shaded from the theme in every preset and scheme. They assemble as they come into view, their hero part floats, and `explode="hover"` parts a stack or raises the lit part while the pointer is over the scene. Decorative by default; `title` names one. `illustrations` lists them as `{ id, name, category, Component }` and `illustrationCategories` their categories in order, and `<Illustration scene="database" />` draws one by id (what a block\'s `illustration` prop takes). Reduced motion: the finished scene, still.',
      },
    },
  },
  args: { scene: 'database', category: 'all', assemble: true, float: true, explode: 'hover', unit: 22 },
  argTypes: {
    scene: { control: 'select', options: illustrations.map((i) => i.id) },
    category: { control: 'select', options: ['all', ...illustrationCategories.map((c) => c.id)] },
    explode: { control: 'select', options: ['hover', 0, 1] },
    unit: { control: { type: 'range', min: 12, max: 32, step: 2 } },
  },
}
export default meta
type Story = StoryObj<Args>

/** Every scene, in its category, on drafting dots. Hover one to take it apart; pick a category in Controls to narrow it. */
export const Gallery: Story = {
  render: ({ category: only, assemble, float, explode }) => (
    <div className="grid w-full grid-cols-[repeat(auto-fill,minmax(15rem,1fr))] gap-3 p-4">
      {illustrations.filter((scene) => only === 'all' || scene.category === only).map(({ id, name, category, Component }) => (
        <figure key={id} data-scene={id} className="relative isolate flex flex-col overflow-hidden rounded-xl border border-line bg-surface">
          <DotGrid gap={16} />
          <div className="grid flex-1 place-items-center px-3 pt-4 pb-2">
            <Component assemble={assemble} float={float} explode={explode} />
          </div>
          <figcaption className="flex flex-col gap-0.5 border-t border-line px-3 py-2">
            <span className="truncate text-[13px] font-medium text-fg">{name}</span>
            <span className="truncate font-mono text-[11px] text-fg-subtle">
              {category} · {id}
            </span>
          </figcaption>
        </figure>
      ))}
    </div>
  ),
}

/** One scene with every prop on the Controls panel. */
export const Scene: Story = {
  render: ({ scene, category: _category, ...props }) => (
    <div className="relative isolate m-6 w-fit max-w-[92vw] overflow-hidden rounded-2xl border border-line bg-surface p-6">
      <DotGrid gap={18} />
      <Illustration scene={scene} {...props} />
    </div>
  ),
}

/** Every scene taken apart, as hovering shows it: stacks parted, the lit part raised. */
export const Exploded: Story = { args: { explode: 1 }, render: Gallery.render }

/** Reduced motion: every scene finished and still. Switch Motion to "reduced" in the toolbar. */
export const ReducedMotion: Story = { name: 'Reduced motion', args: { explode: 0 }, render: Gallery.render }
