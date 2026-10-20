import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAzimuth, meta as about } from './azimuth'

export default { title: 'Visuals/Loaders/Signal/Azimuth', tags: ['autodocs'], ...loaderMeta(LoaderAzimuth, about) } satisfies Meta<typeof LoaderAzimuth>

const s = loaderStories(LoaderAzimuth)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
