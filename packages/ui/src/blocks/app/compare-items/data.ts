import type { RadarChartAxis } from '../../../components/ui/radar-chart'

/** One thing in the catalog: its score on every axis, and its specs. */
export interface CompareItem {
  id: string
  name: string
  /** Its score on each axis, by axis id. */
  scores: Record<string, number>
  /** Its value for each spec, by spec id. A spec it has no value for shows a dash. */
  specs: Record<string, string | number | boolean>
}

/** One row of the overview table. */
export interface CompareSpec {
  id: string
  label: string
  /** How its values read. 'number' formats with `format`, 'boolean' as Yes or No badges. */
  kind: 'text' | 'number' | 'boolean'
  /** Intl.NumberFormat options for a number, e.g. `{ style: 'currency', currency: 'USD' }`. */
  format?: Intl.NumberFormatOptions
  /** Written after a number, quieter: "tokens", "per 1M tokens". */
  unit?: string
  /** Which end of a number row is best. Without it the row has no best. A boolean row's best is Yes. */
  better?: 'higher' | 'lower'
}

export const AXES: RadarChartAxis[] = [
  { id: 'reasoning', label: 'Reasoning', description: 'How well it works through problems that take several steps.' },
  { id: 'code', label: 'Code', description: 'Writing, explaining and fixing programs.' },
  { id: 'speed', label: 'Speed', description: 'How quickly the first words arrive and how fast the rest follow.' },
  { id: 'value', label: 'Value', description: 'What you get for each dollar spent.' },
  { id: 'memory', label: 'Memory', description: 'How much of a long conversation or document it keeps in view.' },
  { id: 'vision', label: 'Vision', description: 'Reading images, charts and screenshots.' },
  { id: 'tools', label: 'Tools', description: 'Calling other programs and using what comes back.' },
  { id: 'safety', label: 'Safety', description: 'Staying within its limits when pushed.' },
]

const USD: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }

export const SPECS: CompareSpec[] = [
  { id: 'maker', label: 'Made by', kind: 'text' },
  { id: 'released', label: 'Released', kind: 'text' },
  { id: 'context', label: 'Context length', kind: 'number', format: { notation: 'compact', maximumFractionDigits: 0 }, unit: 'tokens', better: 'higher' },
  { id: 'input', label: 'Input price', kind: 'number', format: USD, unit: 'per 1M tokens', better: 'lower' },
  { id: 'output', label: 'Output price', kind: 'number', format: USD, unit: 'per 1M tokens', better: 'lower' },
  { id: 'reasoning', label: 'Reasoning mode', kind: 'boolean' },
  { id: 'vision', label: 'Image input', kind: 'boolean' },
  { id: 'tools', label: 'Tool calling', kind: 'boolean' },
  { id: 'weights', label: 'Open weights', kind: 'boolean' },
]

export const ITEMS: CompareItem[] = [
  {
    id: 'atlas',
    name: 'Atlas 2',
    scores: { reasoning: 88, code: 82, speed: 56, value: 48, memory: 90, vision: 76, tools: 84, safety: 80 },
    specs: { maker: 'Marlow Labs', released: 'Sep 2026', context: 1_000_000, input: 3, output: 15, reasoning: true, vision: true, tools: true, weights: false },
  },
  {
    id: 'quill',
    name: 'Quill S',
    scores: { reasoning: 64, code: 70, speed: 92, value: 90, memory: 52, vision: 58, tools: 66, safety: 72 },
    specs: { maker: 'Fernbridge', released: 'Aug 2026', context: 200_000, input: 0.25, output: 1.25, reasoning: false, vision: true, tools: true, weights: false },
  },
  {
    id: 'meridian',
    name: 'Meridian',
    scores: { reasoning: 76, code: 58, speed: 70, value: 66, memory: 70, vision: 88, tools: 52, safety: 90 },
    specs: { maker: 'Tidewater', released: 'Jun 2026', context: 400_000, input: 1.2, output: 6, reasoning: true, vision: true, tools: false, weights: false },
  },
  {
    id: 'lumen',
    name: 'Lumen Pro',
    scores: { reasoning: 92, code: 90, speed: 38, value: 34, memory: 84, vision: 62, tools: 90, safety: 68 },
    specs: { maker: 'Kestrel Works', released: 'Oct 2026', context: 512_000, input: 6, output: 30, reasoning: true, vision: false, tools: true, weights: false },
  },
  {
    id: 'basalt',
    name: 'Basalt 8B',
    scores: { reasoning: 46, code: 52, speed: 96, value: 98, memory: 34, vision: 20, tools: 40, safety: 60 },
    specs: { maker: 'Fernbridge', released: 'Jul 2026', context: 64_000, input: 0.05, output: 0.2, reasoning: false, vision: false, tools: false, weights: true },
  },
  {
    id: 'cirrus',
    name: 'Cirrus',
    scores: { reasoning: 70, code: 74, speed: 62, value: 72, memory: 58, vision: 70, tools: 76, safety: 78 },
    specs: { maker: 'Marlow Labs', released: 'May 2026', context: 128_000, input: 0.8, output: 4, reasoning: true, vision: true, tools: true, weights: true },
  },
]

/** The picks it opens with. */
export const START = ['atlas', 'quill', 'meridian']

export const DEFAULT_COPY = {
  title: 'Compare models',
  description: 'Pick up to four and see where each one is strongest.',
  highlightBest: 'Highlight best',
  models: 'Models to compare',
  pickerOf: (position: number) => `Model ${position}`,
  remove: (name: string) => `Remove ${name}`,
  add: 'Add model',
  chart: 'Scores by model',
  overview: 'Overview',
  yes: 'Yes',
  no: 'No',
  empty: '–',
  best: 'best in this row',
}

export type CompareItemsCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
