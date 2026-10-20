import type { ReactNode } from 'react'

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

/** A role a member can hold. `owner` is locked: its row can't change role or be removed. */
export interface SettingsRole {
  value: string
  label: string
}

export const ROLES: SettingsRole[] = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'member', label: 'Member' },
  { value: 'viewer', label: 'Viewer' },
]

export interface SettingsMember {
  id: string
  name: string
  email: string
  /** One of the `roles` values. */
  role: string
  /** Invited and not joined yet: shows a badge and offers resend or revoke. */
  invited?: boolean
}

export const MEMBERS: SettingsMember[] = [
  { id: '1', name: 'Ada Lovelace', email: 'ada@northwind.dev', role: 'owner' },
  { id: '2', name: 'Grace Hopper', email: 'grace@northwind.dev', role: 'admin' },
  { id: '3', name: 'Alan Turing', email: 'alan@northwind.dev', role: 'member' },
  { id: '4', name: 'Katherine Johnson', email: 'katherine@northwind.dev', role: 'viewer' },
]

/** The signed-in person, as the profile and account tabs show them. */
export interface SettingsUser {
  name: string
  username: string
  bio: string
  email: string
  /** Their photo. Default: initials. */
  avatarUrl?: string
  /** Shows the Verified badge beside the email. */
  verified?: boolean
}

export const USER: SettingsUser = {
  name: 'Ada Lovelace',
  username: 'ada',
  bio: 'Analyst, metaphysician and founder of scientific computing.',
  email: 'ada@northwind.dev',
  verified: true,
}

/** What the profile form saves. */
export interface SettingsProfile {
  name: string
  username: string
  bio: string
}

export const initials = (name: string) =>
  name
    .split(/[\s@.]+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

export interface SettingsPlan {
  id: string
  name: string
  /** As it reads, e.g. `$20` or `Custom`. */
  price: string
  blurb: string
  features: string[]
  /** Priced per member: adds `copy.perMember` after the price. */
  perMember?: boolean
  /** Sold by a conversation: the button reads `copy.talkToSales` and calls `onContactSales`. */
  contactSales?: boolean
}

/** In order, cheapest first: a plan before the current one offers a downgrade, after it an upgrade. */
export const PLANS: SettingsPlan[] = [
  { id: 'hobby', name: 'Hobby', price: '$0', blurb: 'For side projects.', features: ['3 projects', 'Community support', '1 GB bandwidth'], perMember: true },
  { id: 'pro', name: 'Pro', price: '$20', blurb: 'For growing teams.', features: ['Unlimited projects', 'Email support', '1 TB bandwidth', 'Preview comments'], perMember: true },
  { id: 'enterprise', name: 'Enterprise', price: 'Custom', blurb: 'For scale and compliance.', features: ['SSO and SCIM', '99.99% SLA', 'Dedicated support'], contactSales: true },
]

export type SettingsInvoiceStatus = 'paid' | 'open' | 'refunded' | 'failed'

export interface SettingsInvoice {
  id: string
  /** As it reads, e.g. `Sep 1, 2026`. */
  date: string
  /** As it reads, e.g. `$240.00`. */
  amount: string
  status: SettingsInvoiceStatus
}

export const INVOICES: SettingsInvoice[] = [
  { id: 'INV-0042', date: 'Sep 1, 2026', amount: '$240.00', status: 'paid' },
  { id: 'INV-0041', date: 'Aug 1, 2026', amount: '$240.00', status: 'paid' },
  { id: 'INV-0040', date: 'Jul 1, 2026', amount: '$180.00', status: 'refunded' },
]

export interface SettingsPaymentMethod {
  /** e.g. `Visa`. */
  brand: string
  last4: string
  /** As it reads, e.g. `08 / 2028`. */
  expires: string
}

export const PAYMENT_METHOD: SettingsPaymentMethod = { brand: 'Visa', last4: '4242', expires: '08 / 2028' }

export interface SettingsNotification {
  id: string
  label: string
  description: string
  /** On when the page opens. */
  on: boolean
}

export interface SettingsNotificationGroup {
  /** The channel, e.g. `Email`. */
  group: string
  items: SettingsNotification[]
}

export const NOTIFY: SettingsNotificationGroup[] = [
  { group: 'Email', items: [
    { id: 'deploys', label: 'Deployments', description: 'When a production deploy finishes or fails.', on: true },
    { id: 'comments', label: 'Comments', description: 'When someone mentions you or replies to you.', on: true },
    { id: 'digest', label: 'Weekly digest', description: 'Traffic, errors and spend, every Monday.', on: false },
  ] },
  { group: 'Push', items: [
    { id: 'incidents', label: 'Incidents', description: 'When an alert fires on a project you own.', on: true },
    { id: 'invites', label: 'Invitations', description: 'When you are invited to a workspace.', on: false },
  ] },
]

/** The built-in tabs. */
export type SettingsSectionId = 'profile' | 'account' | 'team' | 'billing' | 'notifications'

/** A tab of your own, beside (or instead of) the built-in ones. */
export interface SettingsSection {
  id: string
  label: string
  icon?: ReactNode
  /** The tab's content. */
  panel: ReactNode
}

export const DEFAULT_COPY = {
  title: 'Settings',
  description: (workspace: string) => `Manage your profile, your team and how ${workspace} is billed.`,
  tabsLabel: 'Settings',
  profileTab: 'Profile',
  accountTab: 'Account',
  teamTab: 'Team',
  billingTab: 'Billing',
  notificationsTab: 'Notifications',
  // Profile
  profileTitle: 'Profile',
  profileDescription: 'How you appear to your team.',
  photo: 'Photo',
  name: 'Name',
  username: 'Username',
  usernamePrefix: 'northwind.dev/',
  bio: 'Bio',
  bioHint: 'Shown on your profile and in mentions. Up to 160 characters.',
  saveProfile: 'Save profile',
  saving: 'Saving…',
  saved: 'Saved',
  // Account
  emailTitle: 'Email',
  emailDescription: 'Where sign-in links and receipts go.',
  emailLabel: 'Email address',
  verified: 'Verified',
  passwordTitle: 'Password',
  passwordDescription: 'Use at least 8 characters, and one you don’t use anywhere else.',
  currentPassword: 'Current password',
  newPassword: 'New password',
  confirmPassword: 'Confirm new password',
  passwordMismatch: 'The new passwords don’t match.',
  updatePassword: 'Update password',
  updating: 'Updating…',
  updated: 'Updated',
  checkFields: 'Check the fields',
  deleteTitle: 'Delete account',
  deleteDescription: 'Removes your profile and your access to every workspace. This can’t be undone.',
  deleteAccount: 'Delete account',
  deleteConfirmTitle: 'Delete your account?',
  deleteConfirmDescription: 'Your profile, API tokens and personal projects go now. Workspaces you own pass to their next admin.',
  deleteConfirm: 'Delete my account',
  // Team
  teamTitle: 'Team',
  teamCount: (count: number, workspace: string) => `${count} people in ${workspace}.`,
  memberColumn: 'Member',
  roleColumn: 'Role',
  actionsColumn: 'Actions',
  invitedBadge: 'Invited',
  roleFor: (name: string) => `Role for ${name}`,
  actionsFor: (name: string) => `Actions for ${name}`,
  resendInvite: 'Resend invite',
  revokeInvite: 'Revoke invite',
  removeMember: 'Remove from team',
  emptyTeam: 'No one here yet. Invite your first teammate.',
  invite: 'Invite',
  inviteTitle: 'Invite a teammate',
  inviteDescription: (workspace: string) => `They’ll get an email with a link to join ${workspace}.`,
  inviteEmail: 'Email',
  inviteEmailPlaceholder: 'name@company.com',
  inviteRole: 'Role',
  cancel: 'Cancel',
  sendInvite: 'Send invite',
  sending: 'Sending…',
  invited: 'Invited',
  checkEmail: 'Check the email',
  invalidEmail: 'Enter an email like name@company.com.',
  // Billing
  currentPlan: 'Current',
  perMember: ' / member / month',
  yourPlan: 'Your plan',
  talkToSales: 'Talk to sales',
  downgrade: 'Downgrade',
  upgrade: 'Upgrade',
  switching: 'Switching…',
  switched: 'Switched',
  paymentTitle: 'Payment method',
  paymentDescription: 'Charged on the 1st of each month.',
  cardEnding: (brand: string, last4: string) => `${brand} ending ${last4}`,
  cardExpires: (expires: string) => `Expires ${expires}`,
  noPaymentMethod: 'No card on file.',
  updatePayment: 'Update',
  invoicesTitle: 'Invoices',
  invoicesDescription: 'Download a PDF for your records.',
  invoiceColumn: 'Invoice',
  dateColumn: 'Date',
  amountColumn: 'Amount',
  statusColumn: 'Status',
  downloadColumn: 'Download',
  downloadInvoice: (id: string) => `Download ${id}`,
  invoiceStatus: { paid: 'Paid', open: 'Open', refunded: 'Refunded', failed: 'Failed' } as Record<SettingsInvoiceStatus, string>,
  emptyInvoices: 'No invoices yet. The first arrives at the end of your billing period.',
  loading: 'Loading…',
  errorTitle: 'Couldn’t load your settings',
  retry: 'Retry',
  // Notifications
  notificationsTitle: 'Notifications',
  notificationsDescription: 'Choose what reaches you, and where.',
}

export type SettingsCopy = typeof DEFAULT_COPY
