import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderWhisper, meta as about } from './whisper'

export default { title: 'Visuals/Loaders/Waves/Whisper', tags: ['autodocs'], ...loaderMeta(LoaderWhisper, about) } satisfies Meta<typeof LoaderWhisper>

const s = loaderStories(LoaderWhisper)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
