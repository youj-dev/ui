import type { Meta } from '@storybook/react-vite'
import { loaderMeta, loaderStories } from '../story-kit'
import { LoaderUmbra, meta as about } from './umbra'

export default { title: 'Visuals/Loaders/Signal/Umbra', tags: ['autodocs'], ...loaderMeta(LoaderUmbra, about) } satisfies Meta<typeof LoaderUmbra>

const s = loaderStories(LoaderUmbra)
export const Hero = s.Hero
export const Playground = s.Playground
export const Sizes = s.Sizes
export const ReducedMotion = s.ReducedMotion
