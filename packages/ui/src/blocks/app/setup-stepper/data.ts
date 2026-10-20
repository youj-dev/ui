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

/** A choice in the select: a theme, a model, a course level. */
export interface SetupStepperChoice {
  value: string
  label: string
  /** What it's good for, muted beside its name. */
  hint: string
  /** A size or limit shown after the hint through `copy.measure` ("200K context"). Default: none. */
  measure?: number
}

/** A pill you switch on: a payment method, a tool, a module. */
export interface SetupStepperOption {
  value: string
  label: string
  /** Its name in the saved config: `web.search`. */
  id: string
}

/** A radio in the last step: who can use it, where it ships. */
export interface SetupStepperAudience {
  value: string
  label: string
}

/** The slider in the second step: its range, and the zones that name the stretches of it. */
export interface SetupStepperScale {
  min: number
  max: number
  step: number
  /** How many tick marks the track draws. */
  ticks: number
  /** Decimals shown on the slider and written in the config. Default 2. */
  decimals?: number
  /** Each zone runs up to its `to`; the last has none. */
  zones: { label: string; to?: number }[]
}

export interface SetupStepperConfig {
  /** The first step's text. */
  description: string
  name: string
  /** A `SetupStepperChoice` value. */
  choice: string
  /** Where the slider sits, on the scale. */
  level: number
  /** `SetupStepperOption` values that are on. */
  options: string[]
  /** A `SetupStepperAudience` value. */
  audience: string
}

export const CHOICES: SetupStepperChoice[] = [
  { value: 'orbit-2-pro', label: 'Orbit 2 Pro', hint: 'Deep reasoning', measure: 200_000 },
  { value: 'orbit-2', label: 'Orbit 2', hint: 'Balanced', measure: 128_000 },
  { value: 'orbit-mini', label: 'Orbit Mini', hint: 'Fast, low cost', measure: 32_000 },
]

export const OPTIONS: SetupStepperOption[] = [
  { value: 'search', label: 'Web search', id: 'web.search' },
  { value: 'repo', label: 'Read repository', id: 'repo.read' },
  { value: 'tickets', label: 'Tickets', id: 'tickets.write' },
  { value: 'calendar', label: 'Calendar', id: 'calendar.read' },
  { value: 'sandbox', label: 'Code sandbox', id: 'sandbox.run' },
]

export const AUDIENCES: SetupStepperAudience[] = [
  { value: 'me', label: 'Only me' },
  { value: 'team', label: 'My team' },
  { value: 'org', label: 'Everyone at Lumen' },
]

export const SCALE: SetupStepperScale = {
  min: 0,
  max: 1.5,
  step: 0.05,
  ticks: 15,
  zones: [{ label: 'Literal', to: 0.4 }, { label: 'Balanced', to: 0.95 }, { label: 'Exploratory' }],
}

/** Every string the flow shows. Pass any of them through `copy` to rewrite or translate it. */
export const DEFAULT_COPY = {
  brand: 'Lumen',
  title: 'New assistant',
  subtitle: 'Shape how it thinks and what it may touch. The config on the right is exactly what gets saved.',
  stepDetails: 'Purpose',
  stepDetailsDescription: 'One or two sentences it will read before every conversation.',
  stepSettings: 'Behavior',
  stepSettingsDescription: 'Its name, the model under it, how freely it writes and the tools it can call.',
  stepAccess: 'Access',
  stepAccessDescription: 'Who can open it. You can widen this after a trial run.',
  description: 'Instructions',
  descriptionRequired: 'Say what the assistant is for.',
  name: 'Name',
  namePlaceholder: 'release-scribe',
  nameHint: (handle: string) => (handle ? `Mention it as @${handle}` : 'Lowercase letters, numbers and dashes.'),
  nameRequired: 'Give it a name of 3 to 32 characters.',
  choice: 'Model',
  measure: (amount: string) => `${amount} context`,
  scale: 'Creativity',
  options: 'Tools',
  optionsCount: (count: number) => (count ? `${count} on` : 'None on'),
  audience: 'Who can use it',
  back: 'Back',
  next: 'Continue',
  create: 'Create assistant',
  created: 'Created',
  preview: 'Config',
  previewFile: 'assistant.toml',
  /** The saved file's section headings and keys. */
  previewSections: { main: '[assistant]', scale: '[sampling]', options: '[tools]', access: '[access]' },
  previewKeys: { name: 'name', choice: 'model', description: 'purpose', level: 'temperature', options: 'enabled', audience: 'audience' },
  changed: (count: number) => (count ? `${count} ${count === 1 ? 'change' : 'changes'} from the template` : 'Template defaults'),
  copy: 'Copy',
  copied: 'Copied',
  doneTitle: (name: string) => `@${name} is ready`,
  doneDescription: 'Open it from any conversation, or run it against yesterday’s threads first.',
  open: 'Start a conversation',
}
export type SetupStepperCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** Where every new setup starts; the preview marks what you change from it. */
export const TEMPLATE: SetupStepperConfig = {
  description: 'Draft release notes from merged pull requests. Group them by area, lead with what users will notice, and link every item.',
  name: 'release-scribe',
  choice: 'orbit-2',
  level: 0.5,
  options: ['repo'],
  audience: 'team',
}

export const handleOf = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)

export const validName = (name: string) => /^[a-z0-9][a-z0-9-]{1,30}[a-z0-9]$/.test(handleOf(name))

export interface ConfigLine {
  /** Stable across edits, so a changed line can flash in place. */
  key: string
  kind: 'comment' | 'section' | 'pair' | 'blank'
  /** For a pair: the key and its value as written. */
  name?: string
  value?: string
  valueKind?: 'string' | 'number' | 'list'
  note?: string
  /** Differs from where it started. */
  changed?: boolean
}

const str = (s: string) => JSON.stringify(s)

/** The config as TOML lines, marking the ones that differ from `base`. Without a `scale` the slider's section is left out. */
export function toLines(config: SetupStepperConfig, base: SetupStepperConfig, copy: SetupStepperCopy, options: SetupStepperOption[], zone?: string, decimals = 2): ConfigLine[] {
  const { previewSections: sec, previewKeys: key } = copy
  const ids = options.filter((o) => config.options.includes(o.value)).map((o) => str(o.id))
  const description = config.description.trim().replace(/\s+/g, ' ')
  const short = description.length > 26 ? `${description.slice(0, 25).trimEnd()}…` : description
  const same = (a: string[], b: string[]) => a.length === b.length && a.every((v) => b.includes(v))
  return [
    { key: 'c', kind: 'comment', value: `# ${copy.previewFile}` },
    { key: 's1', kind: 'section', value: sec.main },
    { key: 'name', kind: 'pair', name: key.name, value: str(handleOf(config.name) || '…'), valueKind: 'string', changed: handleOf(config.name) !== handleOf(base.name) },
    { key: 'choice', kind: 'pair', name: key.choice, value: str(config.choice), valueKind: 'string', changed: config.choice !== base.choice },
    { key: 'description', kind: 'pair', name: key.description, value: str(short), valueKind: 'string', changed: description !== base.description.trim().replace(/\s+/g, ' ') },
    ...(zone === undefined
      ? []
      : [
          { key: 'b1', kind: 'blank' as const },
          { key: 's2', kind: 'section' as const, value: sec.scale },
          { key: 'level', kind: 'pair' as const, name: key.level, value: config.level.toFixed(decimals), valueKind: 'number' as const, note: `# ${zone.toLowerCase()}`, changed: config.level !== base.level },
        ]),
    { key: 'b2', kind: 'blank' },
    { key: 's3', kind: 'section', value: sec.options },
    { key: 'options', kind: 'pair', name: key.options, value: `[${ids.join(', ')}]`, valueKind: 'list', changed: !same(config.options, base.options) },
    { key: 'b3', kind: 'blank' },
    { key: 's4', kind: 'section', value: sec.access },
    { key: 'audience', kind: 'pair', name: key.audience, value: str(config.audience), valueKind: 'string', changed: config.audience !== base.audience },
  ]
}

export const toToml = (lines: ConfigLine[]) =>
  lines.map((l) => (l.kind === 'pair' ? `${l.name} = ${l.value}${l.note ? `  ${l.note}` : ''}` : (l.value ?? ''))).join('\n')
