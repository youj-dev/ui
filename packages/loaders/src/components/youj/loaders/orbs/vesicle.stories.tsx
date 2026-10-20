import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderVesicle, meta as about } from './vesicle'

export default { title: 'Visuals/Loaders/Orbs/Vesicle', tags: ['autodocs'], ...loaderMeta(LoaderVesicle, about) } satisfies Meta<typeof LoaderVesicle>

const s = loaderStories(LoaderVesicle)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
