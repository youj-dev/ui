import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCasement, meta as about } from './casement'

export default { title: 'Visuals/Loaders/Software/Casement', tags: ['autodocs'], ...loaderMeta(LoaderCasement, about) } satisfies Meta<typeof LoaderCasement>

const s = loaderStories(LoaderCasement, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
