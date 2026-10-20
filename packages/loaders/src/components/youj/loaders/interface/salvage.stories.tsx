import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSalvage, meta as about } from './salvage'

export default { title: 'Visuals/Loaders/Interface/Salvage', tags: ['autodocs'], ...loaderMeta(LoaderSalvage, about) } satisfies Meta<typeof LoaderSalvage>

const s = loaderStories(LoaderSalvage)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
