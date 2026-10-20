import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCaustic, meta as about } from './caustic'

export default { title: 'Visuals/Loaders/Signal/Caustic', tags: ['autodocs'], ...loaderMeta(LoaderCaustic, about) } satisfies Meta<typeof LoaderCaustic>

const s = loaderStories(LoaderCaustic)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
