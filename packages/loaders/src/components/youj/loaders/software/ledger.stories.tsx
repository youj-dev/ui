import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderLedger, meta as about } from './ledger'

export default { title: 'Visuals/Loaders/Software/Ledger', tags: ['autodocs'], ...loaderMeta(LoaderLedger, about) } satisfies Meta<typeof LoaderLedger>

const s = loaderStories(LoaderLedger, { hero: 'Software at work, using the shared application context.' })
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
