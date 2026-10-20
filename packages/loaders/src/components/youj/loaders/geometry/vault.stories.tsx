import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderVault, meta as about } from './vault'

export default { title: 'Visuals/Loaders/Geometry/Vault', tags: ['autodocs'], ...loaderMeta(LoaderVault, about) } satisfies Meta<typeof LoaderVault>

const s = loaderStories(LoaderVault)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
