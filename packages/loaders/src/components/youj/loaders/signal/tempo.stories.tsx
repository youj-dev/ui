import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderTempo, meta as about } from './tempo'

export default { title: 'Visuals/Loaders/Signal/Tempo', tags: ['autodocs'], ...loaderMeta(LoaderTempo, about) } satisfies Meta<typeof LoaderTempo>

const s = loaderStories(LoaderTempo)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
