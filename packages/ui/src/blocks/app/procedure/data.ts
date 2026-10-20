export const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

declare const process: { env: { NODE_ENV?: string } }
const warned = new Set<string>()
/** Stands in for an action the app hasn't wired (`action` is "Block: onVerb"): warns once in development, then waits like a request. */
export function demo(action: string, ms: number) {
  if (process.env.NODE_ENV !== 'production' && !warned.has(action)) {
    warned.add(action)
    console.warn(`${action} isn't wired; showing demo behaviour`)
  }
  return wait(ms)
}

/** How a quantity is written and rounded when the yield scales it. */
export interface ProcedureUnit {
  id: string
  /** Set small after the quantity, for units Intl has no word for: "tbsp". */
  label?: string
  /** Intl.NumberFormat options for the quantity, such as `{ style: 'unit', unit: 'gram' }`. Default: up to one decimal. */
  format?: Intl.NumberFormatOptions
  /** Scaled quantities round to a multiple of this. Default 0.5. */
  step?: number
  /** From this quantity up, round to a coarser step: big weights to 5 g. */
  coarse?: { from: number; step: number }
}

/** A thing the procedure uses up, written for the base yield. */
export interface ProcedureInput {
  id: string
  name: string
  /** For the base yield. */
  amount: number
  /** A `ProcedureUnit` id. Default: a plain count. */
  unit?: string
  /** A second line: "skin on", "or tamari". */
  note?: string
}

export interface ProcedureStep {
  id: string
  text: string
  /** A timer for the step, in seconds. */
  timer?: number
  /** What the timer is called when it's announced: "Rice". */
  timerName?: string
}

/** One part of what a yield amounts to: protein, a reagent's share, a spirit. */
export interface ProcedureFact {
  id: string
  label: string
  /** Per yield, in the units of `factsFormat`. */
  amount: number
  /** What each unit of it counts for in the ring's total: energy per gram. Default 1. */
  weight?: number
}

export const BASE_YIELD = 2

export const INPUTS: ProcedureInput[] = [
  { id: 'salmon', name: 'Salmon fillet', amount: 300, unit: 'gram', note: 'skin on' },
  { id: 'rice', name: 'Short-grain rice', amount: 180, unit: 'gram' },
  { id: 'miso', name: 'White miso', amount: 2, unit: 'tbsp' },
  { id: 'mirin', name: 'Mirin', amount: 2, unit: 'tbsp' },
  { id: 'soy', name: 'Soy sauce', amount: 1, unit: 'tbsp', note: 'or tamari' },
  { id: 'edamame', name: 'Edamame, podded', amount: 120, unit: 'gram' },
  { id: 'cucumber', name: 'Cucumber', amount: 1, unit: 'piece' },
  { id: 'avocado', name: 'Avocado', amount: 1, unit: 'piece' },
  { id: 'sesame', name: 'Toasted sesame', amount: 2, unit: 'tsp' },
]

export const STEPS: ProcedureStep[] = [
  { id: 'rice', text: 'Rinse the rice until the water runs clear, then simmer it covered.', timer: 12 * 60, timerName: 'Rice' },
  { id: 'glaze', text: 'Whisk the miso, mirin and soy into a loose glaze.' },
  { id: 'salmon', text: 'Brush the salmon with half the glaze and roast it at 220 °C.', timer: 10 * 60, timerName: 'Salmon' },
  { id: 'edamame', text: 'Blanch the edamame, then cool it under the cold tap.', timer: 3 * 60, timerName: 'Edamame' },
  { id: 'build', text: 'Slice the cucumber and avocado, build the bowls and finish with sesame and the rest of the glaze.' },
]

/** What the demo's quantities are written in. */
export const UNITS: ProcedureUnit[] = [
  { id: 'gram', format: { style: 'unit', unit: 'gram', unitDisplay: 'short', maximumFractionDigits: 0 }, step: 1, coarse: { from: 50, step: 5 } },
  { id: 'milliliter', format: { style: 'unit', unit: 'milliliter', unitDisplay: 'short', maximumFractionDigits: 0 }, step: 1, coarse: { from: 50, step: 5 } },
  { id: 'tbsp', label: 'tbsp' },
  { id: 'tsp', label: 'tsp' },
  { id: 'piece' },
]

/** The demo's facts: grams per serving, with the energy each gram brings. */
export const FACTS: ProcedureFact[] = [
  { id: 'protein', label: 'Protein', amount: 38, weight: 4 },
  { id: 'carbs', label: 'Carbs', amount: 64, weight: 4 },
  { id: 'fat', label: 'Fat', amount: 22, weight: 9 },
]
export const FACTS_FORMAT: Intl.NumberFormatOptions = { style: 'unit', unit: 'gram', unitDisplay: 'short', maximumFractionDigits: 0 }

/** The ingredients the demo has on the counter already. */
export const GATHERED = ['rice', 'soy']

/** A quantity for `factor` times the base yield, rounded as the unit says (the demo: big weights to 5 g, small ones to the gram, spoons and pieces to the half). */
export function scaleAmount(input: ProcedureInput, factor: number, units: ProcedureUnit[]) {
  const unit = units.find((u) => u.id === input.unit)
  const raw = input.amount * factor
  const step = unit?.step ?? 0.5
  const to = unit?.coarse && raw >= unit.coarse.from ? unit.coarse.step : step
  return Math.max(step, Math.round(raw / to) * to)
}

export const DEFAULT_COPY = {
  title: 'Miso salmon bowl',
  subtitle: 'Weeknight · 35 min',
  more: 'More options',
  save: 'Save',
  unsave: 'Saved',
  facts: 'Macros',
  factsUnit: 'kcal',
  perUnit: 'Per serving',
  whole: 'Whole dish',
  showing: 'Show',
  yield: 'Servings',
  prep: 'Prep',
  cook: 'Cook',
  level: 'Level',
  prepTime: 10,
  cookTime: 25,
  levelValue: 'Easy',
  minutes: 'min',
  inputs: 'Ingredients',
  gathered: (done: number, total: number) => `${done} of ${total}`,
  steps: 'Method',
  step: (n: number) => `Step ${n}`,
  startTimer: (name: string, time: string) => `Start the ${name.toLowerCase()} timer, ${time}`,
  pauseTimer: (name: string, time: string) => `Pause the ${name.toLowerCase()} timer, ${time} left`,
  resetTimer: (name: string) => `Reset the ${name.toLowerCase()} timer`,
  timerDone: (name: string) => `${name} timer done`,
  done: 'Done',
  status: (amount: number) => `Scaled for ${amount}`,
  totalPerUnit: (total: string) => `${total} per serving`,
  totalWhole: (total: string) => `${total} for the dish`,
  addToList: (count: number) => (count ? `Add ${count} to list` : 'All gathered'),
  adding: 'Adding…',
  added: 'Added',
  addedAnnounce: (count: number) => `${count} ${count === 1 ? 'item' : 'items'} added to your shopping list`,
  loadingLabel: 'Loading',
  errorTitle: 'Couldn’t load the procedure.',
  retry: 'Retry',
  emptyTitle: 'Nothing here yet',
  emptyDescription: 'Add inputs and steps to write the procedure.',
}

export type ProcedureCopy = typeof DEFAULT_COPY & {
  /** How its dates, times and numbers read (BCP 47). Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}
