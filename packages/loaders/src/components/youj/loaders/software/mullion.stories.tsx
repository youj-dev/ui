import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMullion, meta as about } from './mullion'

export default { title: 'Visuals/Loaders/Software/Mullion', tags: ['autodocs'], ...loaderMeta(LoaderMullion, about) } satisfies Meta<typeof LoaderMullion>

const s = loaderStories(LoaderMullion, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
