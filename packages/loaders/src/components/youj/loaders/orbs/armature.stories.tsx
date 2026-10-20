import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderArmature, meta as about } from './armature'

export default { title: 'Visuals/Loaders/Orbs/Armature', tags: ['autodocs'], ...loaderMeta(LoaderArmature, about) } satisfies Meta<typeof LoaderArmature>

const s = loaderStories(LoaderArmature)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
