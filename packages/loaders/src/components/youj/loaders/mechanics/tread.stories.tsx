import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTread, meta as about } from './tread'

export default { title: 'Visuals/Loaders/Mechanics/Tread', tags: ['autodocs'], ...loaderMeta(LoaderTread, about) } satisfies Meta<typeof LoaderTread>

const s = loaderStories(LoaderTread)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
