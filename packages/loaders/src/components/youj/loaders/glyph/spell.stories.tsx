import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderSpell, meta as about } from './spell'

export default { title: 'Visuals/Loaders/Glyph/Spell', tags: ['autodocs'], ...loaderMeta(LoaderSpell, about) } satisfies Meta<typeof LoaderSpell>

const s = loaderStories(LoaderSpell)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
