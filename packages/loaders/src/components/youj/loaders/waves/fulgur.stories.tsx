import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFulgur, meta as about } from './fulgur'

export default { title: 'Visuals/Loaders/Waves/Fulgur', tags: ['autodocs'], ...loaderMeta(LoaderFulgur, about) } satisfies Meta<typeof LoaderFulgur>

const s = loaderStories(LoaderFulgur)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
