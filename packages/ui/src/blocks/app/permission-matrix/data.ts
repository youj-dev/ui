import type { ComponentType } from 'react'
import { CreditCardIcon, FolderIcon, HistoryIcon, KeyIcon, RocketIcon, UsersIcon } from '@youj/icons'
import type { PermissionLevel, PermissionResource, PermissionRole, PermissionValue } from '../../../components/ui/level-matrix'

/* Fixtures for the permissions card: a workspace's roles and resources, the
 * levels as saved, and a draft with a few changes pending. */

/** A role: the grid's row, with a plain sentence the roles view shows under its name. */
export interface PermissionMatrixRole extends PermissionRole {
  /** What the role is for: "Builds and ships the product". */
  description?: string
}

/** An area of the workspace: the grid's column, with what it holds and an icon for the roles view. */
export interface PermissionMatrixResource extends PermissionResource {
  /** What's in it: "Code, environments and settings". */
  description?: string
  icon?: ComponentType<{ size?: number }>
}

export const ROLES: PermissionMatrixRole[] = [
  { id: 'owner', name: 'Owner', detail: '1 member', locked: true, description: 'Runs the workspace and can do everything.' },
  { id: 'admin', name: 'Admin', detail: '2 members', description: 'Looks after people, billing and settings.' },
  { id: 'engineer', name: 'Engineer', detail: '14 members', description: 'Builds and ships the product.' },
  { id: 'analyst', name: 'Analyst', detail: '6 members', description: 'Reads the numbers and reports on them.' },
  { id: 'support', name: 'Support', detail: '9 members', description: 'Helps customers with their accounts.' },
  { id: 'guest', name: 'Guest', detail: '4 members', description: 'Collaborators from outside the company.' },
]

export const RESOURCES: PermissionMatrixResource[] = [
  { id: 'projects', name: 'Projects', description: 'Code, environments and settings', icon: FolderIcon },
  { id: 'deploys', name: 'Deploys', description: 'Releasing changes to customers', icon: RocketIcon },
  { id: 'billing', name: 'Billing', description: 'Plan, invoices and payment details', icon: CreditCardIcon },
  { id: 'members', name: 'Members', description: 'Inviting people and changing their roles', icon: UsersIcon },
  { id: 'secrets', name: 'Secrets', description: 'API keys and passwords', icon: KeyIcon },
  { id: 'audit', name: 'Audit log', description: 'A record of who did what', icon: HistoryIcon },
]

export const SAVED: PermissionValue = {
  owner: { projects: 'admin', deploys: 'admin', billing: 'admin', members: 'admin', secrets: 'admin', audit: 'admin' },
  admin: { projects: 'admin', deploys: 'admin', billing: 'write', members: 'admin', secrets: 'write', audit: 'read' },
  engineer: { projects: 'write', deploys: 'write', billing: 'none', members: 'read', secrets: 'read', audit: 'read' },
  analyst: { projects: 'read', deploys: 'read', billing: 'read', members: 'none', secrets: 'none', audit: 'read' },
  support: { projects: 'read', deploys: 'none', billing: 'read', members: 'read', secrets: 'none', audit: 'none' },
  guest: { projects: 'read', deploys: 'none', billing: 'none', members: 'none', secrets: 'none', audit: 'none' },
}

/** The draft the card opens on: two grants and two revocations waiting to be applied. */
export const DRAFT: PermissionValue = {
  ...SAVED,
  engineer: { ...SAVED.engineer, secrets: 'write' },
  support: { ...SAVED.support, members: 'write', billing: 'none' },
  guest: { ...SAVED.guest, projects: 'none' },
}

export const DEFAULT_COPY = {
  title: 'Permissions',
  scope: 'acme-cloud',
  roles: (count: number) => `${count} ${count === 1 ? 'role' : 'roles'}`,
  more: 'More permission actions',
  exportCsv: 'Export CSV',
  copyJson: 'Copy as JSON',
  access: 'Access',
  levels: { none: 'None', read: 'Read', write: 'Write', admin: 'Admin' } as Record<PermissionLevel, string>,
  shape: (roles: number, resources: number) => `${roles} roles × ${resources} resources`,
  /** The view switch in the header: by role, or the whole grid. */
  view: 'View',
  views: { roles: 'Roles', grid: 'Grid' },
  /** The roles view's names for each level, and what each lets someone do. */
  abilities: { none: 'No access', read: 'Can view', write: 'Can edit', admin: 'Full access' } as Record<PermissionLevel, string>,
  abilityHints: {
    none: 'Hidden from this role',
    read: 'See it, but not change it',
    write: 'Create and change things',
    admin: 'Change its settings and access too',
  } as Record<PermissionLevel, string>,
  roleList: 'Roles',
  areaAccess: (area: string, role: string) => `${area} access for ${role}`,
  was: (level: string) => `Was: ${level}`,
  locked: 'Owners always have full access.',
  grid: 'Permissions by role and resource',
  pending: (count: number) => `${count} unsaved ${count === 1 ? 'change' : 'changes'}`,
  upToDate: 'All changes saved',
  added: (count: number) => `${count} added`,
  removed: (count: number) => `${count} removed`,
  review: 'Review',
  reviewTitle: 'Review changes',
  reviewDescription: (count: number, scope: string) => `${count} ${count === 1 ? 'change' : 'changes'} to ${scope}, applied together.`,
  change: (role: string, resource: string) => `${role} · ${resource}`,
  discard: 'Discard all',
  apply: 'Save changes',
  applying: 'Saving…',
  applied: 'Saved',
}

export type PermissionMatrixCopy = typeof DEFAULT_COPY & {
  /** The BCP 47 locale its numbers and dates are written in. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

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
