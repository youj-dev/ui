import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderGraft, meta as about } from './graft'

export default { title: 'Visuals/Loaders/Software/Graft', tags: ['autodocs'], ...loaderMeta(LoaderGraft, about) } satisfies Meta<typeof LoaderGraft>

const s = loaderStories(LoaderGraft, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
