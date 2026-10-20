import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSachet, meta as about } from './sachet'

export default { title: 'Visuals/Loaders/Interface/Sachet', tags: ['autodocs'], ...loaderMeta(LoaderSachet, about) } satisfies Meta<typeof LoaderSachet>

const s = loaderStories(LoaderSachet, { hero: 'Filtering candidates in a product workspace and its task list.', heroLabel: 'Filtering candidates' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
