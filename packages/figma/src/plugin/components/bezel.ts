/* The bezel style, as the kit draws it. bezel.css restyles the components by
 * their data-slot hooks; each component file here branches on bezel() and
 * draws those recipes with the bezel/* Color variables (the helpers and mixes
 * read from bezel.css by the data step), the bezel/pill and
 * bezel/field-radius Theme numbers, the Bezel/lift and Bezel/key effects
 * and the Bezel/Eyebrow and Bezel/Title text styles. The fragments below are
 * the recipes drawn; the drift guard fails when one changes, pointing here. */

export const BEZEL_SOURCE = {
  file: 'packages/ui/src/styles/bezel.css',
  classes: [
    // Button
    "[data-size='default'], .yj-button-md)& {\n      padding-inline: calc(var(--spacing) * 3.5);",
    "[data-size='sm'], .yj-button-sm)& {\n      padding-inline: calc(var(--spacing) * 3);",
    "[data-size='lg'], .yj-button-lg)& {\n      padding-inline: calc(var(--spacing) * 4.5);",
    "[data-size='xs'], .yj-button-xs)& {\n      padding-inline: calc(var(--spacing) * 2.5);",
    // The primary's fill is the theme's action (ui.css --action): ink in Basalt, so the drawing holds.
    "[data-variant='default'], .yj-button-default):not([data-fill='custom'])& {",
    'oklch(from var(--color-action) calc(l + 0.03 * var(--yj-action-ink)) c h),',
    "[data-variant='secondary'], .yj-button-secondary)& {\n      background-color: var(--color-control);\n        box-shadow: inset 0 0 0 1px var(--bz-secondary-ring), var(--ui--shadow-xs-soft), inset 0 1px 0 0 var(--ui--edge-highlight);",
    'background-color: var(--bz-secondary-hover);',
    // Fields
    "[data-slot='input-otp-slot']\n      )& {\n      border-color: var(--ui--field-line);\n      background-color: var(--ui--field-fill);",
    ":is([data-slot='input'], [data-slot='textarea'], [data-slot='sidebar-input'])& {\n      padding-inline: calc(var(--spacing) * 3);",
    "[data-slot='textarea']& {\n      padding-block: calc(var(--spacing) * 2);",
    'padding-inline-start: calc(var(--spacing) * 3);',
    // Eyebrows and field labels
    // Labels take the theme's label voice (--yj-label-*): Basalt's mono capitals, so the drawing holds.
    "[data-slot='eyebrow']&,\n    [data-slot='sidebar-group-label']& {\n      font-family: var(--yj-label-font, inherit);\n      font-size: var(--text-ui-xs);",
    "[data-slot='field'][data-orientation='vertical'] > [data-slot='field-label']&,",
    // Tracks and keys
    "[data-slot='tabs-list'][data-variant='pill'][data-orientation='horizontal']& {\n      height: var(--spacing-control);",
    'padding: 3px;',
    'gap: 2px;',
    "> [data-slot='tabs-trigger']& {\n      height: 100%;\n      padding-inline: calc(var(--spacing) * 3);",
    'background-color: var(--color-key);\n      box-shadow: 0 0 0 1px var(--bz-key-ring), var(--ui--shadow-xs-soft), inset 0 1px 0 0 var(--bz-key-edge);',
    "[role='tab'][data-active]& {\n      color: var(--color-fg);",
    // Badge
    "[data-slot='badge']& {\n      height: calc(var(--spacing) * 5.5);\n      padding-inline: calc(var(--spacing) * 2.25);\n      font-weight: 500;",
    "[data-slot='badge'][data-variant='secondary']& {\n      background-color: var(--color-control);\n        border-color: var(--bz-secondary-ring);\n        color: var(--color-fg-muted);",
    "[data-slot='badge'][data-variant='outline']& {\n      border-color: var(--color-line-strong);",
    "[data-slot='badge-dot']& {\n      width: calc(var(--spacing) * 1.5);\n      height: calc(var(--spacing) * 1.5);",
    // Switch
    "[data-slot='switch']:not([data-variant='liquid'])[data-size='default']& {\n      width: calc(var(--spacing) * 10);\n      height: calc(var(--spacing) * 5.5);\n      padding: 3px;",
    "[data-slot='switch']:not([data-variant='liquid'])[data-size='sm']& {\n      width: calc(var(--spacing) * 7.5);\n      height: calc(var(--spacing) * 4.5);\n      padding: 2.5px;",
    "background-color: var(--color-fg-subtle);",
    "[data-slot='switch']:not([data-variant='liquid'])[data-size='default'] > [data-slot='switch-thumb']& {\n      width: calc(var(--spacing) * 4);",
    "[data-slot='switch']:not([data-variant='liquid'])[data-size='sm'] > [data-slot='switch-thumb']& {\n      width: calc(var(--spacing) * 3.25);",
    // Checkbox and radio
    ":is([data-slot='checkbox'], [data-slot='checkbox-mark'])& {\n      width: calc(var(--spacing) * 4.5);\n      height: calc(var(--spacing) * 4.5);\n      border-radius: min(5px, calc(var(--yj-radius) * 100));",
    "[data-slot='radio-group-item']& {\n      width: calc(var(--spacing) * 4.5);",
    // Table
    ":is([data-slot='table-head'], [data-slot='data-table-header-row'] > th)& {\n      height: calc(var(--spacing) * 8);",
    "[data-slot='table-cell']& {\n      padding-block: calc(var(--spacing) * (2 - 0.5 * var(--ui--compact, 0)));",
    // Overlays
    "border-radius: min(var(--radius-overlay-lg), calc(100rem - var(--ui--compact, 0) * (100rem - 1rem * var(--yj-scale, 1))));",
    "padding: calc(var(--spacing) * (3.5 - var(--ui--compact, 0))) calc(var(--spacing) * (5 - var(--ui--compact, 0)));",
    'background-color: var(--bz-band);',
    "[data-slot='popover-content']& {\n      padding: calc(var(--spacing) * (4.5 - var(--ui--compact, 0)));",
    "[data-slot='tooltip-content']& {\n      border-radius: calc(var(--spacing) * 2);\n      padding: calc(var(--spacing) * 1) calc(var(--spacing) * 2.25);",
    'padding: 5px;',
    'border-radius: calc(var(--radius-overlay) - 5px);',
    // Progress and slider
    "[data-slot='progress-track']& {\n      height: 4px;\n      background-color: var(--color-well);",
    "[data-slot='slider-track'][data-orientation='horizontal']& {\n      height: 4px;",
    "[data-slot='slider-thumb-knob']& {\n      border-width: 3px;\n      border-color: var(--color-canvas);\n      background-color: var(--color-fg);",
    // Kbd
    "[data-slot='kbd']& {\n      height: calc(var(--spacing) * 5.5);\n      min-width: calc(var(--spacing) * 5.5);\n      padding-inline: calc(var(--spacing) * 1.5);\n      border-radius: calc(var(--spacing) * 1.5);",
    // Card
    "[data-slot='card']:not([data-lift])& {\n      box-shadow: var(--ui-shadow-sm);",
    'grid-template-columns: fit-content(62%) minmax(0, 1fr) auto;',
    'padding-block: calc(var(--card-band) * (0.875 + 0.125 * var(--ui--compact, 0)));',
    "content: '/' / '';",
    'padding-block: calc(var(--card-band) * (21 - var(--ui--compact, 0)) / 30);',
    '--card-spacing: var(--ui--panel-x, calc(var(--spacing) * 6));',
  ],
}

type FieldState = 'rest' | 'hover' | 'focus' | 'open' | 'invalid' | 'disabled'

/** A clear 1px edge, so a field keeps its box when the edge only shows on focus or invalid. */
const clearEdge = (): SolidPaint => ({ type: 'SOLID', color: { r: 0, g: 0, b: 0 }, opacity: 0 })

/**
 * Bezel's field (input, textarea, select trigger): a filled well with no
 * outline at rest, lifting on hover; focus keeps the ring edge and halo,
 * invalid its danger edge; disabled keeps Classic's muted fill (its
 * disabled: utility outranks the recipe). The corner is the theme's field
 * corner (both looks), or the multi-line one (`area`) for a field that
 * grows past one line.
 */
export function bezelFieldLook(state: FieldState, area = false) {
  return {
    stroke: state === 'focus' || state === 'open' ? 'role/focus' : state === 'invalid' ? 'role/danger' : clearEdge(),
    fill: state === 'disabled' ? 'role/band' : state === 'hover' ? 'bezel/field-hover' : 'role/field',
    effect: state === 'focus' ? 'Focus/field' : undefined,
    opacity: state === 'disabled' ? 0.5 : undefined,
    radius: area ? 'bezel/field-area-radius' : 'bezel/field-radius',
  }
}
