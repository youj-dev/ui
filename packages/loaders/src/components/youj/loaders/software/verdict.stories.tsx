import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderVerdict, meta as about } from './verdict'

export default { title: 'Visuals/Loaders/Software/Verdict', tags: ['autodocs'], ...loaderMeta(LoaderVerdict, about) } satisfies Meta<typeof LoaderVerdict>

const s = loaderStories(LoaderVerdict, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
