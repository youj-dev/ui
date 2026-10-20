import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderChaperone, meta as about } from './chaperone'

export default { title: 'Visuals/Loaders/Science/Chaperone', tags: ['autodocs'], ...loaderMeta(LoaderChaperone, about) } satisfies Meta<typeof LoaderChaperone>

const s = loaderStories(LoaderChaperone)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
