import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLexicon, meta as about } from './lexicon'

export default { title: 'Visuals/Loaders/Interface/Lexicon', tags: ['autodocs'], ...loaderMeta(LoaderLexicon, about) } satisfies Meta<typeof LoaderLexicon>

const s = loaderStories(LoaderLexicon, { hero: 'Indexing documents in a product workspace and its task list.', heroLabel: 'Indexing documents' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
