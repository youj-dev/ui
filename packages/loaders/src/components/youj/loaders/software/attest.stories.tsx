import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAttest, meta as about } from './attest'

export default { title: 'Visuals/Loaders/Software/Attest', tags: ['autodocs'], ...loaderMeta(LoaderAttest, about) } satisfies Meta<typeof LoaderAttest>

const s = loaderStories(LoaderAttest, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
