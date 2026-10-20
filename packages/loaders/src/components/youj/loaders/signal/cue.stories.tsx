import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCue, meta as about } from './cue'

export default { title: 'Visuals/Loaders/Signal/Cue', tags: ['autodocs'], ...loaderMeta(LoaderCue, about) } satisfies Meta<typeof LoaderCue>

const s = loaderStories(LoaderCue)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
