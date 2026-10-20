import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { Procedure } from './procedure'
import { FACTS, UNITS } from './procedure/data'

const meta: Meta<typeof Procedure> = {
  title: 'Blocks/App/Procedure',
  component: Procedure,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Follow a procedure that scales its inputs to your yield and keeps timers beside the steps, with a ring that splits what a yield amounts to. The demo is a recipe; stories show a lab protocol and a batched cocktail.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof Procedure>

/** A recipe: ingredients for two, a ring of protein, carbs and fat by energy, and timers on the steps that need one. */
export const Default: Story = { name: 'Miso salmon bowl' }

/** A lighter bowl, in German: Intl spells the grams in the locale, the units and the copy carry the rest. */
export const German: Story = {
  args: {
    facts: [
      { ...FACTS[0]!, label: 'Eiweiß', amount: 31 },
      { ...FACTS[1]!, label: 'Kohlenhydrate', amount: 48 },
      { ...FACTS[2]!, label: 'Fett', amount: 14 },
    ],
    units: UNITS.map((u) => (u.id === 'tbsp' ? { ...u, label: 'EL' } : u.id === 'tsp' ? { ...u, label: 'TL' } : u)),
    copy: {
      locale: 'de-DE',
      title: 'Miso-Lachs-Bowl',
      subtitle: 'Unter der Woche · 35 Min.',
      more: 'Weitere Optionen',
      save: 'Merken',
      facts: 'Makros',
      perUnit: 'Pro Portion',
      whole: 'Ganzes Gericht',
      showing: 'Anzeigen',
      yield: 'Portionen',
      prep: 'Vorbereitung',
      cook: 'Kochen',
      level: 'Niveau',
      levelValue: 'Leicht',
      minutes: 'Min.',
      inputs: 'Zutaten',
      gathered: (done, total) => `${done} von ${total}`,
      steps: 'Zubereitung',
      step: (n) => `Schritt ${n}`,
      startTimer: (name, time) => `Timer ${name} starten, ${time}`,
      pauseTimer: (name, time) => `Timer ${name} pausieren, noch ${time}`,
      resetTimer: (name) => `Timer ${name} zurücksetzen`,
      timerDone: (name) => `Timer ${name} abgelaufen`,
      done: 'Fertig',
      status: (n) => `Für ${n} skaliert`,
      totalPerUnit: (kcal) => `${kcal} pro Portion`,
      totalWhole: (kcal) => `${kcal} für das Gericht`,
      addToList: (n) => (n ? `${n} auf die Liste` : 'Alles da'),
      adding: 'Wird hinzugefügt…',
      added: 'Hinzugefügt',
      addedAnnounce: (n) => `${n} ${n === 1 ? 'Zutat' : 'Zutaten'} zur Einkaufsliste hinzugefügt`,
    },
  },
}

/** Science: a qPCR master mix written for eight samples and scaled to the plate. Microliters come from a unit of their own; the ring splits one 25 µL reaction. */
export const LabProtocol: Story = {
  name: 'Lab protocol',
  args: {
    baseYield: 8,
    maxYield: 96,
    defaultGathered: ['master', 'water'],
    units: [{ id: 'ul', label: 'µL', step: 0.5, coarse: { from: 200, step: 5 } }],
    inputs: [
      { id: 'master', name: 'SYBR Green master mix', amount: 100, unit: 'ul', note: '2×, keep on ice' },
      { id: 'forward', name: 'Forward primer', amount: 8, unit: 'ul', note: '10 µM' },
      { id: 'reverse', name: 'Reverse primer', amount: 8, unit: 'ul', note: '10 µM' },
      { id: 'template', name: 'Template cDNA', amount: 16, unit: 'ul', note: '10 ng/µL' },
      { id: 'water', name: 'Nuclease-free water', amount: 68, unit: 'ul' },
    ],
    steps: [
      { id: 'thaw', text: 'Thaw the reagents on ice and vortex each tube for 5 seconds.' },
      { id: 'mix', text: 'Combine the master mix, primers and water in a clean tube. Mix by pipetting, never by vortexing.' },
      { id: 'plate', text: 'Pipette 23 µL of mix into each well, then add 2 µL of template.' },
      { id: 'spin', text: 'Seal the plate and spin it at 1,000 × g.', timer: 60, timerName: 'Spin' },
      { id: 'run', text: 'Run 95 °C for 10 minutes, then 40 cycles of 95 °C for 15 seconds and 60 °C for 1 minute.', timer: 80 * 60, timerName: 'Run' },
    ],
    facts: [
      { id: 'master', label: 'Master mix', amount: 12.5 },
      { id: 'water', label: 'Water', amount: 8.5 },
      { id: 'template', label: 'Template', amount: 2 },
      { id: 'primers', label: 'Primers', amount: 2 },
    ],
    factsFormat: { maximumFractionDigits: 1 },
    copy: {
      title: 'qPCR master mix',
      subtitle: 'Gene expression · 96-well plate',
      more: 'Protocol options',
      save: 'Save protocol',
      unsave: 'Saved',
      facts: 'Reaction volume',
      factsUnit: 'microliters',
      perUnit: 'Per reaction',
      whole: 'Whole batch',
      yield: 'Samples',
      prep: 'Prep',
      cook: 'Run',
      level: 'Bench',
      prepTime: 25,
      cookTime: 90,
      levelValue: 'Standard',
      inputs: 'Reagents',
      steps: 'Protocol',
      status: (n) => `Scaled for ${n} samples`,
      totalPerUnit: (total) => `${total} per reaction`,
      totalWhole: (total) => `${total} for the batch`,
      addToList: (n) => (n ? `Add ${n} to order list` : 'All on the bench'),
      addedAnnounce: (n) => `${n} ${n === 1 ? 'reagent' : 'reagents'} added to the order list`,
    },
  },
}

/** Hospitality: a margarita batched for the line, written for four drinks and scaled to the night. Measures are US fluid ounces, rounded to a quarter. */
export const CocktailBatch: Story = {
  name: 'Cocktail batch',
  args: {
    baseYield: 4,
    maxYield: 40,
    defaultGathered: ['tequila', 'syrup'],
    units: [
      { id: 'floz', format: { style: 'unit', unit: 'fluid-ounce', unitDisplay: 'short', maximumFractionDigits: 2 }, step: 0.25 },
      { id: 'tsp', label: 'tsp' },
      { id: 'piece' },
    ],
    inputs: [
      { id: 'tequila', name: 'Blanco tequila', amount: 8, unit: 'floz' },
      { id: 'lime', name: 'Fresh lime juice', amount: 4, unit: 'floz', note: 'strained' },
      { id: 'liqueur', name: 'Orange liqueur', amount: 3, unit: 'floz' },
      { id: 'syrup', name: 'Simple syrup', amount: 2, unit: 'floz', note: '1:1' },
      { id: 'water', name: 'Filtered water', amount: 3, unit: 'floz', note: 'for dilution' },
      { id: 'salt', name: 'Flaky salt', amount: 2, unit: 'tsp', note: 'for the rims' },
      { id: 'wheels', name: 'Lime wheels', amount: 4, unit: 'piece', note: 'for garnish' },
    ],
    steps: [
      { id: 'juice', text: 'Juice the limes and strain out the pulp. Use the juice within 4 hours.' },
      { id: 'stir', text: 'Stir the syrup into the tequila, liqueur and lime juice until it dissolves.' },
      { id: 'chill', text: 'Add the water, cover and chill the batch.', timer: 30 * 60, timerName: 'Chill' },
      { id: 'shake', text: 'For each drink, shake 5 fl oz of batch over ice.', timer: 12, timerName: 'Shake' },
      { id: 'serve', text: 'Strain into salt-rimmed glasses over fresh ice and garnish with a lime wheel.' },
    ],
    facts: [
      { id: 'tequila', label: 'Tequila', amount: 2 },
      { id: 'lime', label: 'Lime juice', amount: 1 },
      { id: 'liqueur', label: 'Orange liqueur', amount: 0.75 },
      { id: 'syrup', label: 'Syrup', amount: 0.5 },
      { id: 'water', label: 'Dilution', amount: 0.75 },
    ],
    factsFormat: { style: 'unit', unit: 'fluid-ounce', unitDisplay: 'short', maximumFractionDigits: 2 },
    totalFormat: { maximumFractionDigits: 2 },
    copy: {
      title: 'Margarita, batched',
      subtitle: 'Bar prep · serves the line',
      more: 'Recipe options',
      save: 'Save to the bar book',
      facts: 'Drink spec',
      factsUnit: 'fl oz',
      perUnit: 'Per drink',
      whole: 'Whole batch',
      yield: 'Drinks',
      prep: 'Prep',
      cook: 'Chill',
      level: 'Skill',
      prepTime: 15,
      cookTime: 30,
      levelValue: 'Easy',
      inputs: 'Ingredients',
      steps: 'Method',
      status: (n) => `Batched for ${n} drinks`,
      totalPerUnit: (total) => `${total} per drink`,
      totalWhole: (total) => `${total} for the batch`,
      addToList: (n) => (n ? `Add ${n} to prep list` : 'All stocked'),
      addedAnnounce: (n) => `${n} ${n === 1 ? 'item' : 'items'} added to the prep list`,
    },
  },
}

/** Skeletons in place of the card’s body while your procedure loads. */
export const Loading: Story = { args: { loading: true } }

/** No inputs yet: the message takes the body’s room. */
export const Empty: Story = { args: { inputs: [] } }

/** The procedure failed to load: the message and Retry take the body’s room. */
export const Error: Story = { args: { error: 'Couldn’t load the procedure.', onRetry: fn() } }
