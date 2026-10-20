import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderCurl, meta as about } from './curl'

export default { title: 'Visuals/Loaders/Geometry/Curl', tags: ['autodocs'], ...loaderMeta(LoaderCurl, about) } satisfies Meta<typeof LoaderCurl>

const s = loaderStories(LoaderCurl)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
