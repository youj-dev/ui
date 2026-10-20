/** A choice in one of the card's lists. */
interface NotificationOption {
  id: string
  label: string
  description?: string
}

/** What the card edits. */
interface NotificationPreferencesValue {
  /** The master switch: false mutes everything below it. */
  enabled: boolean
  /** The id of the chosen "what" option. */
  what: string
  /** The ids of the ticked reminders. */
  reminders: string[]
  /** The ids of the ticked channels. */
  channels: string[]
}

const PREFERENCES_WHAT: NotificationOption[] = [
  { id: 'all', label: 'Everything', description: 'Every comment, status change and mention in projects you follow.' },
  { id: 'mentions', label: 'Mentions and replies', description: 'Only when someone writes to you or answers you.' },
  { id: 'assigned', label: 'Assigned to me', description: 'Work that lands on you, and nothing else.' },
]

const PREFERENCES_REMINDERS: NotificationOption[] = [
  { id: 'due', label: 'Due tomorrow', description: 'A nudge the day before something is due.' },
  { id: 'overdue', label: 'Overdue', description: 'A weekly list of what slipped.' },
  { id: 'digest', label: 'Monday plan', description: 'What your week looks like, sent first thing.' },
]

const PREFERENCES_CHANNELS: NotificationOption[] = [
  { id: 'email', label: 'Email', description: 'Sent to your inbox.' },
  { id: 'push', label: 'Push', description: 'On your phone.' },
  { id: 'inapp', label: 'In app', description: 'In the bell menu.' },
]

const PREFERENCES_VALUE: NotificationPreferencesValue = { enabled: true, what: 'mentions', reminders: ['due'], channels: ['email', 'inapp'] }

const PREFERENCES_COPY = {
  title: 'Notifications',
  description: 'Choose what reaches you, and how.',
  master: 'Notifications',
  off: 'Off',
  on: 'On',
  what: 'What to notify me about',
  reminders: 'Reminders',
  how: 'How to reach me',
  note: 'Security alerts and billing receipts always reach you.',
  mutedNote: 'Everything is muted. Security alerts and billing receipts still reach you.',
  save: 'Save changes',
  saving: 'Saving…',
  saved: 'Saved',
  failed: 'Something went wrong. Try again.',
}

type NotificationPreferencesCopy = typeof PREFERENCES_COPY

export {
  PREFERENCES_CHANNELS,
  PREFERENCES_COPY,
  PREFERENCES_REMINDERS,
  PREFERENCES_VALUE,
  PREFERENCES_WHAT,
  type NotificationOption,
  type NotificationPreferencesCopy,
  type NotificationPreferencesValue,
}
