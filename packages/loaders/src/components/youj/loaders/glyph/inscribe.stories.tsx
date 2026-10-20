import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderInscribe, meta as about } from './inscribe'

export default { title: 'Visuals/Loaders/Glyph/Inscribe', tags: ['autodocs'], ...loaderMeta(LoaderInscribe, about) } satisfies Meta<typeof LoaderInscribe>

const s = loaderStories(LoaderInscribe)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
