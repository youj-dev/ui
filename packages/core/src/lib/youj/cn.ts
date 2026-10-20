import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

/* Youj's cn, taught the utilities its stylesheets add. Without this,
 * tailwind-merge reads `text-ui` as a color and drops `text-fg-muted` beside
 * it, and cannot tell that `h-control` and `h-full` conflict. Keep these lists
 * in step with the @theme tokens in @youj/react's ui.css. */
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ['ui', 'ui-xs', 'ui-sm', 'ui-lg'],
      spacing: ['control', 'control-xs', 'control-sm', 'control-lg'],
      radius: [
        'control',
        'control-xs',
        'control-sm',
        'control-lg',
        'mark',
        'button',
        'button-xs',
        'button-sm',
        'button-lg',
        'field',
        'field-xs',
        'field-sm',
        'field-lg',
        'field-area',
        'choice',
        'choice-xs',
        'choice-sm',
        'choice-lg',
        'choice-key',
        'chip',
        'surface',
        'overlay',
        'overlay-lg',
      ],
      shadow: ['xs-soft', 'sm-soft'],
    },
    classGroups: {
      // presets.css's yj-duration-*: a duration that follows Speed and reduced motion
      duration: [{ 'yj-duration': ['instant', 'fast', 'base', 'slow', 'deliberate'] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
