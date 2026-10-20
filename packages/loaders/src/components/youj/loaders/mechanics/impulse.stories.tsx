import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderImpulse, meta as about } from './impulse'

export default { title: 'Visuals/Loaders/Mechanics/Impulse', tags: ['autodocs'], ...loaderMeta(LoaderImpulse, about) } satisfies Meta<typeof LoaderImpulse>

const s = loaderStories(LoaderImpulse)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
