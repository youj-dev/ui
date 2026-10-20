import type { Meta, StoryObj } from '@storybook/react-vite'
import { CompareItems } from './compare-items'

const meta: Meta<typeof CompareItems> = {
  title: 'Blocks/App/Compare Items',
  component: CompareItems,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'Two to four things side by side: a picker heads each column, a radar shows where each is strong, and an overview lines every spec up by column. Highlight best marks the best value in each row.',
      },
    },
  },
  argTypes: { theme: { control: false } },
}
export default meta
type Story = StoryObj<typeof CompareItems>

/** Three models picked, the radar over the overview, nothing marked. */
export const Default: Story = {}

/** The best value in each row marked with a dot in its column's color, the rest quieter. */
export const HighlightBest: Story = { name: 'Highlight best', args: { defaultHighlight: true } }

/** Four columns, the most there are colors for: the add button is gone and each column can be removed. */
export const FourModels: Story = { name: 'Four models', args: { defaultValue: ['atlas', 'quill', 'meridian', 'lumen'], defaultHighlight: true } }

/** Two columns, the fewest: nothing can be removed. */
export const TwoModels: Story = { name: 'Two models', args: { defaultValue: ['atlas', 'basalt'] } }

/** Other data: trail shoes scored on their own axes, with their own specs. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    copy: { title: 'Compare shoes', description: 'Pick up to three and see how they run.', add: 'Add shoe', models: 'Shoes to compare', chart: 'Scores by shoe', pickerOf: (n: number) => `Shoe ${n}` },
    maxItems: 3,
    axes: [
      { id: 'grip', label: 'Grip', description: 'Hold on wet rock and loose dirt.' },
      { id: 'cushion', label: 'Cushion', description: 'How soft the landing feels after hours.' },
      { id: 'weight', label: 'Lightness', description: 'How little you notice them on your feet.' },
      { id: 'durable', label: 'Durability', description: 'Miles before the outsole wears through.' },
      { id: 'dry', label: 'Drying', description: 'How fast they dry after a river crossing.' },
    ],
    specs: [
      { id: 'drop', label: 'Drop', kind: 'number', format: { maximumFractionDigits: 0 }, unit: 'mm', better: 'lower' },
      { id: 'weight', label: 'Weight', kind: 'number', format: { maximumFractionDigits: 0 }, unit: 'g', better: 'lower' },
      { id: 'price', label: 'Price', kind: 'number', format: { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }, better: 'lower' },
      { id: 'vegan', label: 'Vegan', kind: 'boolean' },
      { id: 'rock', label: 'Rock plate', kind: 'boolean' },
    ],
    items: [
      { id: 'ridge', name: 'Ridgeline', scores: { grip: 90, cushion: 60, weight: 54, durable: 82, dry: 50 }, specs: { drop: 6, weight: 310, price: 160, vegan: false, rock: true } },
      { id: 'brook', name: 'Brook Run', scores: { grip: 66, cushion: 84, weight: 78, durable: 58, dry: 88 }, specs: { drop: 8, weight: 262, price: 140, vegan: true, rock: false } },
      { id: 'scree', name: 'Scree', scores: { grip: 78, cushion: 48, weight: 92, durable: 52, dry: 74 }, specs: { drop: 4, weight: 228, price: 150, vegan: true, rock: false } },
      { id: 'moor', name: 'Moorland', scores: { grip: 72, cushion: 72, weight: 62, durable: 90, dry: 40 }, specs: { drop: 10, weight: 340, price: 180, vegan: false, rock: true } },
    ],
    defaultValue: ['ridge', 'brook'],
  },
}

const USD0: Intl.NumberFormatOptions = { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }

/** Family-sized electric cars: range, charge time, price and seats. */
export const ElectricCars: Story = {
  name: 'Electric cars',
  args: {
    copy: { title: 'Compare electric cars', description: 'Pick up to four and see which suits the family.', add: 'Add car', models: 'Cars to compare', chart: 'Scores by car', pickerOf: (n: number) => `Car ${n}`, overview: 'Specs' },
    axes: [
      { id: 'range', label: 'Range', description: 'How far a full charge takes you on the highway.' },
      { id: 'charging', label: 'Charging', description: 'How quickly a fast charger fills it.' },
      { id: 'value', label: 'Value', description: 'What you get for the sticker price.' },
      { id: 'space', label: 'Space', description: 'Room for people and luggage.' },
      { id: 'drive', label: 'Driving', description: 'Acceleration, handling and ride comfort.' },
    ],
    specs: [
      { id: 'maker', label: 'Made by', kind: 'text' },
      { id: 'range', label: 'Range', kind: 'number', format: { maximumFractionDigits: 0 }, unit: 'mi', better: 'higher' },
      { id: 'charge', label: 'Charge 10–80%', kind: 'number', format: { maximumFractionDigits: 0 }, unit: 'min', better: 'lower' },
      { id: 'price', label: 'Starting price', kind: 'number', format: USD0, better: 'lower' },
      { id: 'seats', label: 'Seats', kind: 'number', format: { maximumFractionDigits: 0 }, better: 'higher' },
      { id: 'tow', label: 'Tow hitch', kind: 'boolean' },
      { id: 'heat', label: 'Heat pump', kind: 'boolean' },
    ],
    items: [
      { id: 'voltra', name: 'Voltra Cruiser', scores: { range: 86, charging: 78, value: 52, space: 90, drive: 74 }, specs: { maker: 'Orrery Motors', range: 330, charge: 24, price: 52900, seats: 7, tow: true, heat: true } },
      { id: 'finch', name: 'Finch E', scores: { range: 60, charging: 64, value: 92, space: 58, drive: 62 }, specs: { maker: 'Fernbridge Auto', range: 235, charge: 32, price: 28400, seats: 5, tow: false, heat: false } },
      { id: 'meridian', name: 'Meridian GT', scores: { range: 94, charging: 90, value: 40, space: 64, drive: 96 }, specs: { maker: 'Tidewater Cars', range: 405, charge: 18, price: 61500, seats: 5, tow: false, heat: true } },
      { id: 'alder', name: 'Alder Wagon', scores: { range: 78, charging: 70, value: 70, space: 82, drive: 68 }, specs: { maker: 'Kestrel Works', range: 295, charge: 28, price: 41200, seats: 5, tow: true, heat: true } },
      { id: 'pebble', name: 'Pebble City', scores: { range: 42, charging: 56, value: 86, space: 40, drive: 54 }, specs: { maker: 'Marlow Motors', range: 180, charge: 36, price: 24900, seats: 4, tow: false, heat: false } },
    ],
    defaultValue: ['voltra', 'finch', 'alder'],
    defaultHighlight: true,
  },
}

/** Laptops for a school year: battery, weight, price and screen. */
export const LaptopsForSchool: Story = {
  name: 'Laptops for school',
  args: {
    copy: { title: 'Laptops for school', description: 'Pick up to three and see which will last the school day.', add: 'Add laptop', models: 'Laptops to compare', chart: 'Scores by laptop', pickerOf: (n: number) => `Laptop ${n}`, overview: 'Specs' },
    maxItems: 3,
    axes: [
      { id: 'battery', label: 'Battery', description: 'Hours away from a charger.' },
      { id: 'portable', label: 'Portability', description: 'How light and slim it is in a backpack.' },
      { id: 'value', label: 'Value', description: 'What you get for the price.' },
      { id: 'screen', label: 'Screen', description: 'Size, sharpness and glare in a bright classroom.' },
      { id: 'tough', label: 'Toughness', description: 'Survives drops, spills and lockers.' },
    ],
    specs: [
      { id: 'maker', label: 'Made by', kind: 'text' },
      { id: 'battery', label: 'Battery life', kind: 'number', format: { maximumFractionDigits: 0 }, unit: 'hours', better: 'higher' },
      { id: 'weight', label: 'Weight', kind: 'number', format: { minimumFractionDigits: 1, maximumFractionDigits: 1 }, unit: 'lb', better: 'lower' },
      { id: 'price', label: 'Price', kind: 'number', format: USD0, better: 'lower' },
      { id: 'screen', label: 'Screen size', kind: 'number', format: { maximumFractionDigits: 1 }, unit: 'in' },
      { id: 'touch', label: 'Touchscreen', kind: 'boolean' },
      { id: 'stylus', label: 'Stylus included', kind: 'boolean' },
    ],
    items: [
      { id: 'slate', name: 'Slate 11', scores: { battery: 92, portable: 94, value: 70, screen: 52, tough: 66 }, specs: { maker: 'Quillmark', battery: 14, weight: 2.4, price: 549, screen: 11.6, touch: true, stylus: true } },
      { id: 'kestrel', name: 'Kestrel Air', scores: { battery: 80, portable: 82, value: 58, screen: 86, tough: 60 }, specs: { maker: 'Kestrel Works', battery: 11, weight: 2.9, price: 899, screen: 13.5, touch: false, stylus: false } },
      { id: 'brindle', name: 'Brindle Study', scores: { battery: 66, portable: 54, value: 94, screen: 70, tough: 90 }, specs: { maker: 'Brindle', battery: 9, weight: 3.6, price: 379, screen: 14, touch: false, stylus: false } },
      { id: 'tallow', name: 'Tallow Flip', scores: { battery: 70, portable: 66, value: 62, screen: 76, tough: 74 }, specs: { maker: 'Tallow Computing', battery: 10, weight: 3.1, price: 649, screen: 13.3, touch: true, stylus: true } },
      { id: 'fenwick', name: 'Fenwick Pro', scores: { battery: 88, portable: 72, value: 36, screen: 96, tough: 58 }, specs: { maker: 'Fenwick', battery: 13, weight: 3.3, price: 1_299, screen: 14.2, touch: false, stylus: false } },
    ],
    defaultValue: ['slate', 'kestrel', 'brindle'],
  },
}

/** Drawn as its own page, with the card's title as the page's `h1`. */
export const Standalone: Story = { args: { embedded: false, defaultHighlight: true } }
