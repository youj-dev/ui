import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLamina, meta as about } from './lamina'

export default { title: 'Visuals/Loaders/Orbs/Lamina', tags: ['autodocs'], ...loaderMeta(LoaderLamina, about) } satisfies Meta<typeof LoaderLamina>

const s = loaderStories(LoaderLamina)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
