import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAuger, meta as about } from './auger'

export default { title: 'Visuals/Loaders/Mechanics/Auger', tags: ['autodocs'], ...loaderMeta(LoaderAuger, about) } satisfies Meta<typeof LoaderAuger>

const s = loaderStories(LoaderAuger)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
