import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderBisect, meta as about } from './bisect'

export default { title: 'Visuals/Loaders/Interface/Bisect', tags: ['autodocs'], ...loaderMeta(LoaderBisect, about) } satisfies Meta<typeof LoaderBisect>

const s = loaderStories(LoaderBisect)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
