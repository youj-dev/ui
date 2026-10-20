import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderMedoid, meta as about } from './medoid'

export default { title: 'Visuals/Loaders/Interface/Medoid', tags: ['autodocs'], ...loaderMeta(LoaderMedoid, about, 'Clustering records') } satisfies Meta<typeof LoaderMedoid>

const s = loaderStories(LoaderMedoid, { hero: 'A product status and an inline task at their working sizes.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
