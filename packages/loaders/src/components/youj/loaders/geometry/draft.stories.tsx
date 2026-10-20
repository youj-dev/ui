import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderDraft, meta as about } from './draft'

export default { title: 'Visuals/Loaders/Geometry/Draft', tags: ['autodocs'], ...loaderMeta(LoaderDraft, about) } satisfies Meta<typeof LoaderDraft>

const s = loaderStories(LoaderDraft)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
