import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderFolio, meta as about } from './folio'

export default { title: 'Visuals/Loaders/Interface/Folio', tags: ['autodocs'], ...loaderMeta(LoaderFolio, about, 'Indexing records') } satisfies Meta<typeof LoaderFolio>

const s = loaderStories(LoaderFolio)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
