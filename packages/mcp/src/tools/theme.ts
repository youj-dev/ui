import { checkTheme, type ThemeIssue } from '@youj/core/lib/youj/theme/check'
import { contrast, linearToOklch, oklchToLinear, parseColor, toHex, type Oklch } from '@youj/core/lib/youj/theme/color'
import {
  CONTROL_SIZE,
  RADIUS,
  resolveTheme,
  themeCss,
  type ActionFill,
  type ControlShape,
  type FieldStyle,
  type ControlSize,
  type HeadingsInput,
  type LabelsInput,
  type RadiusScale,
  type ShadowStyle,
  type StrokeInput,
  type ThemeInput,
  type ToneInput,
} from '@youj/core/lib/youj/theme/contract'
import { derivePalette, deriveRoles, type Mode, type PaletteToken, type Role, type RolePaint } from '@youj/core/lib/youj/theme/derive'
import { DEFAULT_PRESET, presetById, shippedThemes } from '@youj/core/lib/youj/theme/themes/index'
import { motionPersonalities, type MotionPersonality } from '@youj/core/lib/youj/tokens'
import { DEFAULT_LOOK, lookById, type YoujLook } from '@youj/core/lib/youj/look'
import type { Catalog } from '../catalog'
import { code, NotFound } from '../format'

/* Tokens and themes, computed with the library's own theme code (bundled), so
 * the colours, contrast and derivation are exactly what an app would get. */

export const PRESETS = shippedThemes.map((t) => t.id) as readonly string[]
export type TokenGroup = 'color' | 'type' | 'radius' | 'spacing' | 'motion' | 'character'

const COLOR_ROLES: Record<string, string> = {
  canvas: 'page background (bg-canvas)',
  surface: 'cards, panels (bg-surface)',
  overlay: 'popovers, menus, dialogs (bg-overlay)',
  well: 'sunken: tracks, rails, empty boxes (bg-well)',
  field: 'text field fill (bg-field)',
  key: 'the raised part in a well: selected tab, switch thumb (bg-key)',
  control: 'neutral button fill (bg-control)',
  chrome: 'a bar attached to the frame (bg-chrome; the top bar in data-yj-tone="header")',
  'chrome-float': 'a bar that floats: toolbar, island (bg-chrome-float, in data-yj-tone="float")',
  inverse: 'the page\'s opposite, in data-yj-tone="inverse" (bg-inverse)',
  scrim: 'dims the page under a modal (bg-scrim)',
  'line-subtle': 'faint dividers (border-line-subtle)',
  line: 'borders (border-line)',
  'line-strong': 'stronger borders (border-line-strong)',
  'line-control': 'control boundaries; ≥ 3:1 (border-line-control)',
  fg: 'text (text-fg)',
  'fg-muted': 'secondary text (text-fg-muted)',
  'fg-subtle': 'tertiary text, placeholders; ≥ 4.5:1 (text-fg-subtle)',
  'on-accent': 'text on accent (text-on-accent)',
  'on-action': 'text on action (text-on-action)',
  accent: 'the one accent (bg-accent, text-accent)',
  action: 'the primary button fill: the accent, or ink (bg-action)',
  danger: 'text-danger, destructive',
  hover: 'transient pointer feedback (bg-hover)',
  selected: 'a persistent neutral selection (bg-selected)',
  cursor: "a menu or list row under the pointer or the keyboard (bg-cursor); ink when the theme's overlays are ink",
  'on-cursor': 'text on a highlighted row (text-on-cursor)',
  'on-cursor-muted': 'hints and shortcuts on a highlighted row (text-on-cursor-muted)',
  band: 'a faint section band (bg-band)',
  focus: 'focus ring (ring-focus)',
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info; the accent unless the theme sets one',
  'chart-1': 'data series 1 (bg-chart-1)',
  'chart-2': 'data series 2',
  'chart-3': 'data series 3',
  'chart-4': 'data series 4',
  'chart-5': 'data series 5',
  'chart-quiet': 'the mark that is not in focus',
  shadow: 'the ink of a shadow',
}

const hex = (lch: Oklch) => toHex(oklchToLinear(lch))
/** A role's value: a hex, with its alpha where the role is a tint. */
const roleCell = ({ color, alpha }: RolePaint) => (alpha === 1 ? hex(color) : `${hex(color)} at ${Math.round(alpha * 100)}%`)
const fmt = (lch: Oklch) => `oklch(${lch[0].toFixed(3)} ${lch[1].toFixed(3)} ${lch[2].toFixed(1)})`

function presetOrThrow(id: string): ThemeInput {
  const preset = shippedThemes.find((t) => t.id === id)
  if (!preset) throw new NotFound(`No preset "${id}". Presets: ${PRESETS.join(', ')}.`)
  return preset
}

export function getTokens(catalog: Catalog, options: { preset?: string; groups?: TokenGroup[]; mode?: Mode | 'both' } = {}): string {
  const theme = options.preset ? presetOrThrow(options.preset) : presetById(DEFAULT_PRESET)
  const t = resolveTheme(theme)
  const want = (g: TokenGroup) => !options.groups?.length || options.groups.includes(g)
  const modes: Mode[] = !options.mode || options.mode === 'both' ? ['light', 'dark'] : [options.mode]
  const out = [`# Tokens: ${theme.name ?? theme.id}`, '', `${theme.description ?? ''} Presets: ${PRESETS.join(', ')}.`.trim()]

  if (want('color')) {
    const roles = Object.fromEntries(modes.map((m) => [m, deriveRoles(theme, m)])) as Record<Mode, Record<Role, RolePaint>>
    out.push('', '## Colour', '', `Use the role classes (\`bg-<role>\`, \`text-<role>\`, \`border-<role>\`), never raw colours or an opacity on a role. The palette follows \`data-theme="dark"|"light"\` on <html>. Each ink (accent, success, warning, danger, info) also has \`-text\` (its text on a surface), \`-subtle\` (a soft fill) and \`-line\` forms. shadcn's names are not Youj's; an app that uses them adds \`@youj/react/shadcn.css\`, and shadcn's hover surface \`accent\` is \`hover\` here.`, '')
    out.push(`| Token | ${modes.join(' | ')} | Role |`, `| --- | ${modes.map(() => '---').join(' | ')} | --- |`)
    for (const role of Object.keys(COLOR_ROLES) as Role[]) {
      out.push(`| ${role} | ${modes.map((m) => roleCell(roles[m][role])).join(' | ')} | ${COLOR_ROLES[role]} |`)
    }
  }
  if (want('type')) {
    out.push('', '## Type', '', `- sans: ${t.fonts.sans}`, `- mono: ${t.fonts.mono}`)
    for (const [name, v] of Object.entries(catalog.index.uiTokens.text)) out.push(`- \`${name}\`: ${v.size}${v.lineHeight ? ` / ${v.lineHeight}` : ''}`)
    out.push('Use `text-ui` (13px, the working size), `text-ui-sm` for dense labels, `text-ui-xs` for keycaps.')
  }
  if (want('radius')) {
    out.push('', '## Radius', '', `Scale \`${t.radius}\`: the control radius is ${RADIUS[t.radius]} (on the 32px control). Scales: ${Object.entries(RADIUS).map(([k, v]) => `${k} ${v}`).join(', ')}.`, `Utilities: ${Object.keys(catalog.index.uiTokens.radius).map((k) => `rounded-${k.replace('radius-', '')}`).join(', ')}, derived from the control radius (Graphite values: ${Object.entries(catalog.index.uiTokens.radius).map(([k, v]) => `${k.replace('radius-', '')} ${v}`).join(', ')}).`)
  }
  if (want('spacing')) {
    const step = CONTROL_SIZE[t.controlSize] * 0.25
    out.push('', '## Control size and control heights', '', `Control size \`${t.controlSize}\` (${Object.keys(CONTROL_SIZE).join(', ')}): every control height moves by ${step >= 0 ? '+' : ''}${step}rem. Coarse pointers add 0.5rem.`)
    for (const [k, v] of Object.entries(catalog.index.uiTokens.control)) out.push(`- \`h-${k.replace('spacing-', '')}\`: ${v} at the default control size`)
    out.push('Size controls with `h-control*`, never fixed heights.')
  }
  if (want('motion')) {
    const m = motionPersonalities[t.motionPersonality]
    out.push(
      '',
      `## Motion (${t.motionPersonality})`,
      '',
      `- durations (ms): ${Object.entries(m.durations).map(([k, v]) => `${k} ${v}`).join(', ')}`,
      `- easings: ${Object.entries(m.easings).map(([k, v]) => `${k} cubic-bezier(${v.join(', ')})`).join('; ')}`,
      `- springs: ${Object.entries(m.springs).map(([k, v]) => `${k} ${v.visualDuration}s bounce ${v.bounce}`).join(', ')}`,
      `- staggers (ms): ${Object.entries(m.staggers).map(([k, v]) => `${k} ${v}`).join(', ')}`,
      '',
      'In JS: `const k = useYouj()` then `k.tween(\'base\', \'enter\')`, `k.spring(\'snappy\')`, `k.stagger(\'base\')`. In CSS: `var(--yj-duration-base)` with `ease-standard|enter|exit|emphasized`. Never hard-code ms or curves: the provider\'s speed and reduced motion reach only tokens. `settle` is the one spring allowed to overshoot, for success and arrival.',
    )
  }
  if (want('character')) {
    const { stroke, shadow, actions, controls, fields, headings, labels } = t
    const labelVoice = labels.case === 'upper' ? `capitals in ${labels.font}` : labels.font === 'mono' ? 'mono, as written' : 'as written'
    out.push(
      '',
      '## Character',
      '',
      `- stroke: ${stroke.width}px borders and dividers (every \`border\`, \`divide-*\` and Separator), lines ${stroke.ink ? `${Math.round(stroke.ink * 100)}% of the way to the text colour` : 'in the neutral line colour'}, icons at ${stroke.icons}× their stroke; the focus ring is 1px heavier than the stroke (2px at least)`,
      `- shadow: ${shadow}${shadow === 'hard' ? ' (solid offset blocks in ink; buttons that cast one press into it)' : shadow === 'none' ? ' (flat: borders carry the layers)' : ' (blurred, tinted with the neutral hue)'}`,
      `- actions: ${actions === 'ink' ? 'primary buttons in ink (the text colour, lettered in the page colour); the accent marks "on" states, selection and data' : 'primary buttons in the accent'}`,
      `- controls: ${controls === 'rounded' ? 'rounded, not pills: every control takes the control radius in proportion to its height, keys and rows the concentric radius' : 'pills: every control has round ends'}, in both looks. Each family has one token: \`rounded-button\`, \`rounded-field\` (\`rounded-field-area\` for a multi-line field), \`rounded-choice\` and \`rounded-choice-key\`, \`rounded-chip\` (each with \`-xs\`, \`-sm\`, \`-lg\`), \`rounded-surface\` and \`rounded-overlay\`. Never set a corner, height, edge or field fill on a kit control: use its props (\`size\`, SelectTrigger \`variant="ghost"\`, Badge \`size\`)`,
      `- fields: ${fields === 'soft' ? 'soft: every field is a filled band with no edge' : 'outlined: every field is its fill on a 3:1 edge'}; never make one field soft or outlined by hand`,
      `- titles: weight ${headings.weight}, tracking ${headings.tracking}em${t.fonts.display ? `, in ${t.fonts.display}` : ''}`,
      `- labels (badges, column heads, field labels, group headings, tabs, keys): ${labelVoice}`,
      '',
      'Components read these through tokens: use `border` (not `border-2`), `shadow-xs|sm|md|lg`, `font-semibold` titles and the kit\'s labels, and a theme restyles them. `shadow-xs-soft`/`shadow-sm-soft` are the soft layers alone, for a thumb or key inside a track.',
    )
  }
  return out.join('\n')
}

/* ── create_theme ── */

export interface ThemeRequest {
  accent: string
  name?: string
  base?: string
  neutral?: { hue?: number; chroma?: number; wash?: number; lift?: number }
  success?: string
  warning?: string
  danger?: string
  info?: string
  radius?: RadiusScale
  controlSize?: ControlSize
  motionPersonality?: MotionPersonality
  fonts?: { sans?: string; mono?: string; display?: string }
  stroke?: StrokeInput
  shadow?: ShadowStyle
  actions?: ActionFill
  controls?: ControlShape
  fields?: FieldStyle
  headings?: HeadingsInput
  labels?: LabelsInput
  tone?: ToneInput
  /** Accept WCAG AA contrast failures: without it, a theme that misses AA isn't returned. */
  allowLowContrast?: boolean
  /** The look to pair it with (how components are built): classic, the default, or bezel. Not part of the theme. */
  look?: YoujLook
}

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'brand'

const identifier = (id: string) => id.replace(/-(.)/g, (_, c: string) => c.toUpperCase()).replace(/^[^a-z]+/, '') || 'brand'

/** The worst ratio of a text or border token over the three surfaces. */
function worst(mode: Mode, theme: ThemeInput, token: PaletteToken): number {
  const p = derivePalette(theme, mode)
  return Math.min(...(['canvas', 'surface', 'raised'] as const).map((s) => contrast(oklchToLinear(p[token]), oklchToLinear(p[s]))))
}

function literal(value: unknown, indent = '  '): string {
  if (typeof value === 'string') return `'${value.replace(/'/g, "\\'")}'`
  if (typeof value === 'number') return String(value)
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).filter(([, v]) => v !== undefined)
    return `{ ${entries.map(([k, v]) => `${/^[a-z]\w*$/i.test(k) ? k : `'${k}'`}: ${literal(v, indent)}`).join(', ')} }`
  }
  return String(value)
}

export function createTheme(request: ThemeRequest): string {
  const color = parseColor(request.accent)
  if (!color) throw new NotFound(`"${request.accent}" isn't a colour Youj can read: use hex, rgb(), hsl(), oklch(), oklab() or color().`)
  // Basalt, the default preset, unless another is named.
  const base = presetOrThrow(request.base ?? DEFAULT_PRESET)
  const name = request.name ?? 'Brand'
  const id = slug(name)
  // Neutrals lean toward the brand hue by default: a quiet tint that makes the accent feel native.
  const accentHue = linearToOklch(color)[2]
  const neutral = request.neutral
    ? {
        hue: request.neutral.hue ?? base?.neutral?.hue ?? Math.round(accentHue),
        chroma: request.neutral.chroma ?? base?.neutral?.chroma ?? 0.01,
        wash: request.neutral.wash ?? base?.neutral?.wash ?? 0,
        ...((request.neutral.lift ?? base?.neutral?.lift) ? { lift: request.neutral.lift ?? base?.neutral?.lift } : {}),
      }
    : base?.neutral ?? { hue: Math.round(accentHue), chroma: 0.01, wash: 0 }

  const input: ThemeInput = {
    ...(base ?? {}),
    id,
    name,
    description: undefined,
    neutral,
    accent: request.accent,
    ...(request.success ? { success: request.success } : {}),
    ...(request.warning ? { warning: request.warning } : {}),
    ...(request.danger ? { danger: request.danger } : {}),
    ...(request.info ? { info: request.info } : {}),
    ...(request.radius ? { radius: request.radius } : {}),
    ...(request.controlSize ? { controlSize: request.controlSize } : {}),
    ...(request.motionPersonality ? { motionPersonality: request.motionPersonality } : {}),
    ...(request.fonts ? { fonts: { ...base?.fonts, ...request.fonts } } : {}),
    ...(request.stroke ? { stroke: { ...base?.stroke, ...request.stroke } } : {}),
    ...(request.shadow ? { shadow: request.shadow } : {}),
    ...(request.actions ? { actions: request.actions } : {}),
    ...(request.controls ? { controls: request.controls } : {}),
    ...(request.fields ? { fields: request.fields } : {}),
    ...(request.headings ? { headings: { ...base?.headings, ...request.headings } } : {}),
    ...(request.labels ? { labels: { ...base?.labels, ...request.labels } } : {}),
    ...(request.tone ? { tone: { ...base?.tone, ...request.tone } } : {}),
    ...(request.allowLowContrast ? { allowLowContrast: true } : {}),
  }
  const issues: ThemeIssue[] = checkTheme(input)
  const errors = issues.filter((i) => i.level === 'error')
  const v = identifier(id)
  const fields = Object.entries(input).filter(([k, val]) => val !== undefined && k !== 'description')
  const body = fields.map(([k, val]) => `  ${k}: ${literal(val)},`).join('\n')
  const source = `import { defineTheme } from '@youj/core'\n\nexport const ${v} = defineTheme({\n${body}\n})`

  const out = [`# Theme: ${name}`, '']
  if (errors.length) {
    out.push('It can\'t be applied as written:', '', ...errors.map((e) => `- ${e.message}`))
    if (errors.some((e) => e.token.startsWith('fonts.')))
      out.push('', 'A font is a CSS font-family list, for example "Inter, system-ui, sans-serif": no ; { } < >, and quotes and brackets must close.')
    if (errors.some((e) => e.code === 'contrast'))
      out.push('', 'These pairs miss WCAG AA (text 4.5:1, control boundaries 3:1). Change the colours, or pass allowLowContrast: true to accept them; the theme then carries allowLowContrast and the provider warns in development.')
    return out.join('\n')
  }
  const light = derivePalette(input, 'light')
  const dark = derivePalette(input, 'dark')
  const style = request.look ?? DEFAULT_LOOK
  // Classic, the default style, is written by a root provider itself; bezel is a prop.
  const lookProp = style === DEFAULT_LOOK ? '' : ` look="${style}"`
  out.push(
    code('ts', source),
    '',
    `Apply it app-wide (no flash on server render), dark by default and in the ${lookById(style).name} style:`,
    code(
      'tsx',
      `import { YoujProvider, themeProps } from '@youj/core'\nimport { ${v} } from './theme'\n\n<html lang="en" {...themeProps(${v})} data-theme="dark" data-yj-look="${style}">\n  <body>\n    <YoujProvider theme={${v}}${lookProp}>{children}</YoujProvider>\n  </body>\n</html>`,
    ),
    '',
    style === DEFAULT_LOOK
      ? `${lookById(style).name} is the default component style, not part of the theme: any theme pairs with any style. ${lookById(style).description} A root YoujProvider writes data-yj-look="${style}" itself, and it needs no stylesheet of its own. For instrument panels (mono capital labels, pill actions), pass look: 'bezel'.`
      : `The ${style} style is not part of the theme: any theme pairs with any style. ${lookById(style).description} On the package, @youj/react/styles.css has it already; on the registry, \`npx youj add youj-look-${style}\` copies styles/${style}.css in and imports it right after ui.css.`,
    '',
    `Leave data-theme off for light. Or for one section: \`<ThemeScope theme={${v}}${lookProp}>…</ThemeScope>\`. Plain CSS instead of JS (and data-yj-look="${style}" on the same element):`,
    code('css', themeCss(input).trim()),
    '',
    '## Derived',
    '',
    `- accent: light ${hex(light.accent)} (${fmt(light.accent)}), dark ${hex(dark.accent)} (${fmt(dark.accent)}); lifted or darkened so text in it passes AA on every surface`,
    `- canvas: light ${hex(light.canvas)}, dark ${hex(dark.canvas)}; neutrals lean to hue ${neutral.hue} at chroma ${neutral.chroma}${neutral.wash ? `, wash ${neutral.wash}` : ''}`,
    '',
    '## Contrast (WCAG 2)',
    '',
  )
  for (const mode of ['light', 'dark'] as const) {
    const subtle = worst(mode, input, 'fg-subtle')
    const field = worst(mode, input, 'input')
    out.push(`- ${mode}: fg-subtle ${subtle.toFixed(2)}:1 (needs 4.5) ${subtle >= 4.5 ? 'pass' : 'FAIL'}; field border ${field.toFixed(2)}:1 (needs 3) ${field >= 3 ? 'pass' : 'FAIL'}`)
  }
  const warnings = issues.filter((i) => i.level === 'warning')
  const accepted = warnings.filter((w) => w.code === 'contrast').length
  if (accepted) out.push('', `WARNING: allowLowContrast accepts ${accepted} pair${accepted === 1 ? '' : 's'} that miss WCAG AA. Text or controls drawn in them fail WCAG 2 AA (1.4.3, 1.4.11) for your users.`)
  out.push('', warnings.length ? `checkTheme found ${warnings.length} issue${warnings.length === 1 ? '' : 's'}:\n${warnings.slice(0, 12).map((w) => `- ${w.message}`).join('\n')}${warnings.length > 12 ? `\n- …and ${warnings.length - 12} more` : ''}` : 'checkTheme: every pair the library draws passes AA in both modes.')
  return out.join('\n')
}
