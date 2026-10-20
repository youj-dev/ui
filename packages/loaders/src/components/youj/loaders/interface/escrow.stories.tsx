import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderEscrow, meta as about } from './escrow'

export default { title: 'Visuals/Loaders/Interface/Escrow', tags: ['autodocs'], ...loaderMeta(LoaderEscrow, about) } satisfies Meta<typeof LoaderEscrow>

const s = loaderStories(LoaderEscrow, { hero: 'Publishing results in a product workspace and its task list.', heroLabel: 'Publishing results' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
