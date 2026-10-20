import { ROLES, type Role } from '@youj/core/lib/youj/theme'

/* What each role core derives is for, by group: the theming page's role table
 * and its Markdown. Typed against core's ROLES, so a role core adds is a type
 * error here until it is described, and one it drops is too. */

export type RoleGroup = 'Surfaces' | 'Lines' | 'Text and marks' | 'Actions and states' | 'Status' | 'Data and shadow'

export const ROLE_DOCS: Record<Role, { group: RoleGroup; utility: string; use: string }> = {
  canvas: { group: 'Surfaces', utility: 'bg-canvas', use: 'The page: anything that sits on nothing.' },
  surface: { group: 'Surfaces', utility: 'bg-surface', use: 'A card or panel resting on the page.' },
  overlay: { group: 'Surfaces', utility: 'bg-overlay', use: 'What floats above content: menus, selects, popovers, dialogs, sheets, toasts.' },
  well: { group: 'Surfaces', utility: 'bg-well', use: 'Sunken: tracks, rails, unchecked boxes, skeletons, code.' },
  field: { group: 'Surfaces', utility: 'bg-field', use: 'A text field’s fill.' },
  key: { group: 'Surfaces', utility: 'bg-key', use: 'The lifted part inside a well: the selected tab, a switch thumb, a kbd cap.' },
  control: { group: 'Surfaces', utility: 'bg-control', use: 'A neutral control’s fill: secondary and outline buttons.' },
  chrome: { group: 'Surfaces', utility: 'bg-chrome', use: 'A bar attached to the frame: sidebar, app header, tab bar. Drawn in the chrome tone.' },
  'chrome-float': { group: 'Surfaces', utility: 'bg-chrome-float', use: 'Floating chrome: toolbars, islands, capsules, menubars. Drawn in the float tone.' },
  inverse: { group: 'Surfaces', utility: 'bg-inverse', use: 'The page’s opposite: tooltips and ink callouts. Drawn in the inverse tone.' },
  scrim: { group: 'Surfaces', utility: 'bg-scrim', use: 'Dims the page under a modal.' },
  'line-subtle': { group: 'Lines', utility: 'border-line-subtle', use: 'Inner dividers and table row rules.' },
  line: { group: 'Lines', utility: 'border-line', use: 'The default hairline: every border and divider.' },
  'line-strong': { group: 'Lines', utility: 'border-line-strong', use: 'Emphasized dividers and hover borders.' },
  'line-control': { group: 'Lines', utility: 'border-line-control', use: 'A control boundary, held to 3:1: fields, checkboxes, radios.' },
  fg: { group: 'Text and marks', utility: 'text-fg', use: 'Primary text and icons.' },
  'fg-muted': { group: 'Text and marks', utility: 'text-fg-muted', use: 'Secondary text: descriptions, meta, labels.' },
  'fg-subtle': { group: 'Text and marks', utility: 'text-fg-subtle', use: 'Tertiary text and placeholders, still 4.5:1.' },
  'on-accent': { group: 'Text and marks', utility: 'text-on-accent', use: 'Text and icons on any solid ink: accent, danger, success, warning, info.' },
  'on-action': { group: 'Text and marks', utility: 'text-on-action', use: 'Text on the primary action’s fill.' },
  accent: { group: 'Actions and states', utility: 'bg-accent', use: 'The one brand ink: on states, links, progress, selection marks.' },
  action: { group: 'Actions and states', utility: 'bg-action', use: 'The primary action’s fill: the accent, or ink when the theme’s actions are ink.' },
  danger: { group: 'Actions and states', utility: 'bg-danger', use: 'Destructive actions, and the danger status.' },
  hover: { group: 'Actions and states', utility: 'bg-hover', use: 'Transient pointer feedback on a neutral item.' },
  selected: { group: 'Actions and states', utility: 'bg-selected', use: 'A persistent neutral selection: the current nav item, a selected row, a pressed toggle.' },
  cursor: { group: 'Actions and states', utility: 'bg-cursor', use: "The row a menu, list or palette has under the pointer or the keyboard: hover, or ink when the theme's overlays are ink." },
  'on-cursor': { group: 'Actions and states', utility: 'text-on-cursor', use: 'Text on a highlighted row; yj-on-cursor sets it and turns the text roles inside to match.' },
  'on-cursor-muted': { group: 'Actions and states', utility: 'text-on-cursor-muted', use: 'Hints and shortcuts on a highlighted row.' },
  band: { group: 'Actions and states', utility: 'bg-band', use: 'A faint band: card footers, table headers, zebra stripes.' },
  focus: { group: 'Actions and states', utility: 'ring-focus', use: 'The focus ring.' },
  success: { group: 'Status', utility: 'bg-success', use: 'The success ink, solid.' },
  warning: { group: 'Status', utility: 'bg-warning', use: 'The warning ink, solid.' },
  info: { group: 'Status', utility: 'bg-info', use: 'The info ink, solid: the accent unless the theme sets `info`.' },
  'accent-text': { group: 'Status', utility: 'text-accent-text', use: 'Text in the accent’s hue, on a surface or on its own tint.' },
  'accent-subtle': { group: 'Status', utility: 'bg-accent-subtle', use: 'A soft accent tint: an accent selection, a “new” pill.' },
  'accent-line': { group: 'Status', utility: 'border-accent-line', use: 'A tint border in the accent.' },
  'success-text': { group: 'Status', utility: 'text-success-text', use: 'Text in the success hue.' },
  'success-subtle': { group: 'Status', utility: 'bg-success-subtle', use: 'A soft success tint.' },
  'success-line': { group: 'Status', utility: 'border-success-line', use: 'A tint border in success.' },
  'warning-text': { group: 'Status', utility: 'text-warning-text', use: 'Text in the warning hue.' },
  'warning-subtle': { group: 'Status', utility: 'bg-warning-subtle', use: 'A soft warning tint.' },
  'warning-line': { group: 'Status', utility: 'border-warning-line', use: 'A tint border in warning.' },
  'danger-text': { group: 'Status', utility: 'text-danger-text', use: 'Text in the danger hue.' },
  'danger-subtle': { group: 'Status', utility: 'bg-danger-subtle', use: 'A soft danger tint.' },
  'danger-line': { group: 'Status', utility: 'border-danger-line', use: 'A tint border in danger.' },
  'info-text': { group: 'Status', utility: 'text-info-text', use: 'Text in the info hue.' },
  'info-subtle': { group: 'Status', utility: 'bg-info-subtle', use: 'A soft info tint.' },
  'info-line': { group: 'Status', utility: 'border-info-line', use: 'A tint border in info.' },
  'chart-1': { group: 'Data and shadow', utility: 'bg-chart-1', use: 'Series 1, the lead series; 3:1 on every surface.' },
  'chart-2': { group: 'Data and shadow', utility: 'bg-chart-2', use: 'Series 2, warm.' },
  'chart-3': { group: 'Data and shadow', utility: 'bg-chart-3', use: 'Series 3.' },
  'chart-4': { group: 'Data and shadow', utility: 'bg-chart-4', use: 'Series 4.' },
  'chart-5': { group: 'Data and shadow', utility: 'bg-chart-5', use: 'Series 5, cool.' },
  'chart-quiet': { group: 'Data and shadow', utility: 'bg-chart-quiet', use: 'The mark that isn’t in focus.' },
  shadow: { group: 'Data and shadow', utility: '(shadow-*)', use: 'The ink of a shadow: the neutral hue in light, black in dark.' },
}

/** The groups, in ROLES order. */
export const ROLE_GROUPS = [...new Set(ROLES.map((role) => ROLE_DOCS[role].group))]

/** The table as Markdown, for the page's text export. */
export function rolesMarkdown(): string {
  return ROLE_GROUPS.map((group) =>
    [`**${group}**`, '', '| Role | Class | For |', '| --- | --- | --- |', ...ROLES.filter((role) => ROLE_DOCS[role].group === group).map((role) => `| \`${role}\` | \`${ROLE_DOCS[role].utility}\` | ${ROLE_DOCS[role].use} |`)].join('\n'),
  ).join('\n\n')
}
