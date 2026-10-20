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

/** One saved setting: text, a choice, a switch or a list of tags. */
export type SettingsValue = string | boolean | string[]
/** Every setting by its field's `name`. */
export type SettingsValues = Record<string, SettingsValue>

export interface SettingsOption {
  value: string
  label: string
  /** A second line (choice cards), or text the search also matches (a searchable select). */
  description?: string
}

interface FieldBase {
  /** The key in the values. */
  name: string
  label: string
  description?: string
  /** Your own rule, after the built-in ones: return a message to reject the value. */
  validate?: (value: SettingsValue, values: SettingsValues) => string | undefined | void
}

/** One setting. `type` picks the control; the rest is that control's. */
export type SettingsField =
  | (FieldBase & {
      type: 'text'
      required?: boolean
      /** A counter shows under the field; more is refused with `copy.tooLong`. */
      maxLength?: number
      placeholder?: string
      /** Fixed text before the value, inside the field (a URL's domain). */
      prefix?: string
      autoComplete?: string
      /** Asked about a changed value while it's typed (a URL that must be free): resolve `true` to accept it, or a message to refuse it. */
      check?: (value: string) => Promise<true | string> | true | string
    })
  | (FieldBase & { type: 'textarea'; required?: boolean; maxLength?: number; placeholder?: string })
  | (FieldBase & {
      type: 'select'
      options: SettingsOption[]
      /** A searchable list (Combobox) instead of a plain menu, for long lists. */
      search?: boolean
    })
  | (FieldBase & { type: 'segmented'; options: SettingsOption[] })
  | (FieldBase & { type: 'choice'; options: SettingsOption[] })
  | (FieldBase & { type: 'switch' })
  | (FieldBase & {
      type: 'tags'
      placeholder?: string
      /** The most tags. */
      max?: number
      /** Checks one tag before it's added: return a message to refuse it. */
      validateTag?: (tag: string) => string | undefined | void
    })

/** A group of settings: its title and description on the inline start, its fields beside them. */
export interface SettingsGroup {
  id: string
  title: string
  description?: string
  fields: SettingsField[]
}

/** What `onSave` rejects with to put messages under fields (and, optionally, one for the form). An `Error` works too, for the form only. */
export interface SettingsSaveError {
  fields?: Record<string, string>
  message?: string
}

const TAKEN = ['acme', 'admin', 'settings', 'tern']

/** The demo's URL check: a few names are taken. */
async function checkUrl(slug: string): Promise<true | string> {
  await demo('SettingsForm: url check', 700)
  return TAKEN.includes(slug) ? 'That URL is taken. Try another.' : true
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'workspace',
    title: 'Workspace',
    description: 'How the workspace appears to the people in it.',
    fields: [
      { type: 'text', name: 'name', label: 'Name', required: true, maxLength: 32, autoComplete: 'organization' },
      {
        type: 'text',
        name: 'url',
        label: 'URL',
        prefix: 'tern.app/',
        required: true,
        maxLength: 32,
        description: 'Lowercase letters, numbers and hyphens.',
        validate: (value) =>
          /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/.test(String(value)) && !String(value).includes('--') && String(value).length >= 3
            ? undefined
            : 'Use at least 3 lowercase letters, numbers or single hyphens.',
        check: checkUrl,
      },
      { type: 'textarea', name: 'about', label: 'Description', maxLength: 160, placeholder: 'What the workspace is for' },
    ],
  },
  {
    id: 'defaults',
    title: 'Defaults',
    description: 'What new projects start with. Each project can change them.',
    fields: [
      {
        type: 'choice',
        name: 'visibility',
        label: 'Project visibility',
        options: [
          { value: 'private', label: 'Private', description: 'Only people you invite' },
          { value: 'workspace', label: 'Workspace', description: 'Everyone in Northwind' },
          { value: 'public', label: 'Public', description: 'Anyone with the link' },
        ],
      },
      {
        type: 'select',
        name: 'timezone',
        label: 'Time zone',
        search: true,
        description: 'Due dates and reminders follow it.',
        options: [
          { value: 'America/Los_Angeles', label: 'Los Angeles', description: 'Pacific Time' },
          { value: 'America/New_York', label: 'New York', description: 'Eastern Time' },
          { value: 'America/Sao_Paulo', label: 'São Paulo', description: 'Brasília Time' },
          { value: 'Europe/London', label: 'London', description: 'Greenwich Mean Time' },
          { value: 'Europe/Berlin', label: 'Berlin', description: 'Central European Time' },
          { value: 'Africa/Nairobi', label: 'Nairobi', description: 'East Africa Time' },
          { value: 'Asia/Kolkata', label: 'Kolkata', description: 'India Standard Time' },
          { value: 'Asia/Tokyo', label: 'Tokyo', description: 'Japan Standard Time' },
          { value: 'Australia/Sydney', label: 'Sydney', description: 'Australian Eastern Time' },
        ],
      },
      {
        type: 'segmented',
        name: 'weekStart',
        label: 'Week starts on',
        options: [
          { value: 'monday', label: 'Monday' },
          { value: 'sunday', label: 'Sunday' },
          { value: 'saturday', label: 'Saturday' },
        ],
      },
    ],
  },
  {
    id: 'security',
    title: 'Security',
    description: 'Who can get in, and for how long.',
    fields: [
      {
        type: 'switch',
        name: 'twoFactor',
        label: 'Require two-factor authentication',
        description: 'Members without it set it up at their next sign-in.',
      },
      {
        type: 'tags',
        name: 'domains',
        label: 'Allowed email domains',
        description: 'People with an address at these domains can join without an invite.',
        placeholder: 'example.com',
        max: 5,
        validateTag: (tag) => (/^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(tag) ? undefined : 'Enter a domain like example.com.'),
      },
      {
        type: 'select',
        name: 'session',
        label: 'Sign members out after',
        options: [
          { value: '1d', label: '1 day' },
          { value: '7d', label: '7 days' },
          { value: '30d', label: '30 days' },
          { value: '90d', label: '90 days' },
        ],
      },
    ],
  },
]

export const SETTINGS_VALUES: SettingsValues = {
  name: 'Northwind',
  url: 'northwind',
  about: 'Product, design and engineering for the Northwind apps.',
  visibility: 'workspace',
  timezone: 'Europe/Berlin',
  weekStart: 'monday',
  twoFactor: false,
  domains: ['northwind.com'],
  session: '30d',
}

export const DEFAULT_COPY = {
  title: 'General',
  description: 'Settings for the whole workspace.',
  footer: 'Changes apply to everyone in the workspace.',
  saved: 'Your changes are saved.',
  /** The save bar's count, with the count's plural category (Intl.PluralRules): "2 unsaved changes". */
  changes: (count: number, plural: Intl.LDMLPluralRule) => `${count} unsaved ${plural === 'one' ? 'change' : 'changes'}`,
  discard: 'Discard',
  save: 'Save changes',
  saving: 'Saving…',
  savedLabel: 'Saved',
  saveFailed: 'Couldn’t save',
  invalid: 'Check the form',
  discarded: (count: number, plural: Intl.LDMLPluralRule) => `Discarded ${count} ${plural === 'one' ? 'change' : 'changes'}`,
  undo: 'Undo',
  /** Shown when a link would leave with changes unsaved. */
  leave: 'Save or discard your changes first',
  saveAndLeave: 'Save and continue',
  discardAndLeave: 'Discard and continue',
  failed: 'Something went wrong. Your changes are still here.',
  reset: 'Reset',
  resetLabel: (label: string, value: string) => `Reset ${label} to ${value}`,
  empty: 'empty',
  on: 'on',
  off: 'off',
  required: (label: string) => `${label} can’t be empty.`,
  tooLong: (max: number) => `Use ${max} characters or fewer.`,
  /** Characters left before the limit (negative: past it), with the plural category of how many: "3 characters left". */
  left: (count: number, plural: Intl.LDMLPluralRule) =>
    count >= 0 ? `${count} ${plural === 'one' ? 'character' : 'characters'} left` : `${-count} ${plural === 'one' ? 'character' : 'characters'} too many`,
  checking: 'Checking…',
  available: 'Available',
  search: 'Search…',
}

export type SettingsFormCopy = typeof DEFAULT_COPY

/** Two values are the same setting: arrays by their items, in order. */
export function same(a: SettingsValue | undefined, b: SettingsValue | undefined) {
  if (Array.isArray(a) || Array.isArray(b)) return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((item, i) => item === b[i])
  return a === b
}

/** A value as words, for the Reset button's label. */
export function spoken(field: SettingsField, value: SettingsValue | undefined, copy: SettingsFormCopy) {
  if (field.type === 'switch') return value ? copy.on : copy.off
  if (Array.isArray(value)) return value.length ? value.join(', ') : copy.empty
  if ('options' in field) return field.options.find((o) => o.value === value)?.label ?? copy.empty
  return value ? `“${value}”` : copy.empty
}

/** The built-in rules, then the field's own: a message, or nothing when the value is fine. */
export function problem(field: SettingsField, value: SettingsValue | undefined, values: SettingsValues, copy: SettingsFormCopy) {
  if ((field.type === 'text' || field.type === 'textarea') && typeof value === 'string') {
    if (field.required && !value.trim()) return copy.required(field.label)
    if (field.maxLength && value.length > field.maxLength) return copy.tooLong(field.maxLength)
    if (!value.trim()) return undefined
  }
  return field.validate?.(value ?? '', values) || undefined
}
