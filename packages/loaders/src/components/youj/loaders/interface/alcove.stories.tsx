import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderAlcove, meta as about } from './alcove'

export default { title: 'Visuals/Loaders/Interface/Alcove', tags: ['autodocs'], ...loaderMeta(LoaderAlcove, about) } satisfies Meta<typeof LoaderAlcove>

const s = loaderStories(LoaderAlcove, { hero: 'Indexing records in a product workspace and its task list.', heroLabel: 'Indexing records' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
