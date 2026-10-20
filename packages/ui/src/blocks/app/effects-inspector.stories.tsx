import type { Meta, StoryObj } from '@storybook/react-vite'
import { fn } from 'storybook/test'
import { DEFAULT_EFFECTS, EffectsInspector } from './effects-inspector'

const meta: Meta<typeof EffectsInspector> = {
  title: 'Blocks/App/Effects inspector',
  component: EffectsInspector,
  parameters: {
    layout: 'fullscreen',
    showcase: { kind: 'card' },
    docs: {
      description: {
        component:
          'A design tool’s effects panel with the thing it styles beside it. A stack of collapsible panels (drop or inner shadow, stroke, fill, layer blur) edits a live button and the CSS it comes to. Drag a field’s handle to scrub it (Shift is ×10, Alt ×0.1), type, or use the arrow keys.',
      },
    },
  },
}
export default meta
type Story = StoryObj<typeof EffectsInspector>

export const Default: Story = {}

/** The blur on, progressive: the button sharpens from the top down between Start and End. */
export const ProgressiveBlur: Story = {
  name: 'Progressive blur',
  args: { defaultValue: { ...DEFAULT_EFFECTS, blur: { ...DEFAULT_EFFECTS.blur, enabled: true, type: 'progressive', radius: 10, start: 20, end: 90 } } },
}

/** Everything but the fill taken out of the stack; Add effect brings them back. */
export const Removed: Story = {
  args: {
    defaultValue: {
      ...DEFAULT_EFFECTS,
      shadow: { ...DEFAULT_EFFECTS.shadow, present: false, enabled: false },
      stroke: { ...DEFAULT_EFFECTS.stroke, present: false, enabled: false },
      blur: { ...DEFAULT_EFFECTS.blur, present: false },
    },
  },
}

/** The app's own values and words (here German), kept through `onValueChange`. */
export const WithYourData: Story = {
  name: 'With your data',
  args: {
    defaultValue: { ...DEFAULT_EFFECTS, shadow: { ...DEFAULT_EFFECTS.shadow, type: 'inner', y: 4, blur: 12, spread: 0 }, fill: { ...DEFAULT_EFFECTS.fill, color: '#ff7a45' } },
    onValueChange: fn(),
    copy: {
      title: 'Effekte',
      description: 'Schatten, Kontur, Füllung und Unschärfe für eine Ebene.',
      add: 'Effekt hinzufügen',
      preview: 'Vorschau',
      button: 'Schaltfläche',
      shadow: 'Schatten',
      shadowTypes: { drop: 'Schlagschatten', inner: 'Innerer Schatten' },
      stroke: 'Kontur',
      fill: 'Füllung',
      blur: 'Ebenenunschärfe',
      position: 'Position',
      color: 'Farbe',
    },
  },
}

/** Standalone: the block draws its own page. */
export const Standalone: Story = { args: { embedded: false } }
