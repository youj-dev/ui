import { cva } from 'class-variance-authority'

/* The variants that cast a shadow press the theme's way: a soft theme scales
 * them a touch like every button; a hard-shadow theme presses them into their
 * shadow instead, moving by its offset as it collapses (ui.css --ui--press-*). */
const PRESS_INTO_SHADOW =
  'active:scale-[calc(1_-_var(--ui--press-depth,0.03)_*_var(--ui--press-soft)_*_var(--yj-motion,1))] own:active:translate-(--ui--press-shift) own:active:shadow-xs-soft'

/* A trigger that anchors a popup (a menu, select, popover) never moves on
 * press: the popup measures the trigger as it opens, so a scaled or shifted
 * trigger would open it a pixel off and then twitch as the press releases.
 * Its press depth and shift are zero; its colour and the open state's
 * highlight are the feedback instead. (Spelt out in full so Tailwind's
 * scanner sees the classes.) */
const STILL_ANCHOR =
  '[&:is([aria-haspopup]:not([aria-haspopup=false]),[role=combobox],[data-popup-open])]:[--ui--press-depth:0] [&:is([aria-haspopup]:not([aria-haspopup=false]),[role=combobox],[data-popup-open])]:[--ui--press-shift:0px]'

/* Each variant and size also names itself in a `yj-button-*` class, so a
 * style can find an element that takes buttonVariants() without being a
 * Button (a link styled as one) the way it finds a Button's data-variant
 * and data-size. */
const buttonVariants = cva(
  [
    'group/button relative own:inline-flex own:shrink-0 items-center justify-center own:whitespace-nowrap own:select-none',
    'own:rounded-button own:border own:border-transparent own:bg-clip-padding own:font-medium',
    // Colours change on the fast token; the press (scale, translate) releases on the CSS spring.
    'transition-[color,background-color,border-color,box-shadow,opacity,scale,translate]',
    'own:[transition-duration:calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-fast)*var(--yj-motion,1)),calc(var(--yj-duration-spring)*var(--yj-motion,1)),calc(var(--yj-duration-spring)*var(--yj-motion,1))]',
    'own:[transition-timing-function:var(--ease-standard),var(--ease-standard),var(--ease-standard),var(--ease-standard),var(--ease-standard),var(--ease-spring),var(--ease-spring)]',
    'focus-ring',
    // The press: in on the instant token, then released on the spring, so it
    // lands with a little weight after the finger lifts. Nothing moves under
    // reduced motion: the depth is scaled by --yj-motion (0 when reduced),
    // which no layer can outrank. Every size reads as the same push: .97, an
    // icon button .96, and one wider than 220px .985 (Button marks it
    // data-wide when pressed).
    'active:scale-[calc(1_-_var(--ui--press-depth,0.03)_*_var(--yj-motion,1))] own:active:yj-duration-instant own:active:ease-standard reduced:active:translate-none',
    'data-wide:[--ui--press-depth:0.015]',
    STILL_ANCHOR,
    'data-disabled:pointer-events-none data-disabled:not-data-loading:opacity-50',
    // A disabled button that keeps focus (focusableWhenDisabled) shows its ring at full strength; the dimming took it to 2.4:1.
    'data-disabled:not-data-loading:focus-visible:opacity-100',
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    // Optical inset: a glyph at either end reads as more padding than text
    // does, so a leading/trailing icon pulls 2px toward its edge.
    '[&>svg:first-child]:-ms-0.5 [&>svg:last-child]:-me-0.5',
    '[&_[data-slot=button-label]>svg:first-child]:-ms-0.5 [&_[data-slot=button-label]>svg:last-child]:-me-0.5',
  ],
  {
    variants: {
      variant: {
        default: ['yj-button-default own:border-(--ui--fill-edge) own:bg-action own:text-on-action own:shadow-xs own:yj-solid-hover', PRESS_INTO_SHADOW],
        secondary: 'yj-button-secondary own:bg-hover own:text-fg own:hover:bg-hover own:aria-expanded:bg-selected',
        outline: ['yj-button-outline own:border-line own:bg-transparent own:text-fg own:shadow-xs own:hover:bg-hover own:aria-expanded:bg-hover', PRESS_INTO_SHADOW],
        ghost:
          'yj-button-ghost own:text-fg-muted own:hover:bg-hover own:hover:text-fg own:aria-expanded:bg-hover own:aria-expanded:text-fg',
        danger: ['yj-button-danger own:border-(--ui--fill-edge) own:bg-danger own:text-on-accent own:shadow-xs own:yj-solid-hover', PRESS_INTO_SHADOW],
        link: 'yj-button-link own:text-accent underline-offset-4 hover:underline own:active:scale-100',
      },
      size: {
        xs: "yj-button-xs own:touch:yj-hit own:h-control-xs own:gap-1 own:rounded-button-xs own:px-2 own:text-ui-sm [&_svg:not([class*='size-'])]:size-3.5",
        sm: 'yj-button-sm own:touch:yj-hit own:h-control-sm own:rounded-button-sm own:gap-1.5 own:px-2.5 own:text-ui',
        default: 'yj-button-md own:h-control own:gap-1.5 own:px-3 own:text-ui',
        lg: 'yj-button-lg own:h-control-lg own:gap-2 own:rounded-button-lg own:px-4 own:text-ui-lg',
        icon: 'yj-button-icon [--ui--press-depth:0.04] own:size-control',
        'icon-xs': "yj-button-icon [--ui--press-depth:0.04] own:touch:yj-hit own:size-control-xs own:rounded-button-xs [&_svg:not([class*='size-'])]:size-3.5",
        'icon-sm': 'yj-button-icon [--ui--press-depth:0.04] own:touch:yj-hit own:size-control-sm own:rounded-button-sm',
        'icon-lg': "yj-button-icon [--ui--press-depth:0.04] own:size-control-lg own:rounded-button-lg [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export { buttonVariants }
