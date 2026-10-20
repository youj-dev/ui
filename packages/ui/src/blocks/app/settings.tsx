'use client'

import { useState, type ComponentProps, type ReactNode } from 'react'
import { BellIcon, CreditCardIcon, UserIcon, UsersIcon, ShieldIcon } from '@youj/icons'
import { Alert, AlertAction, AlertDescription, AlertTitle } from '../../components/ui/alert'
import { AppPage } from '../../components/ui/app-page'
import { Button } from '../../components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { useIsMobile } from '../../hooks/use-mobile'
import { cn } from '../../lib/utils'
import { AccountTab, type AccountTabProps } from './settings/account-tab'
import { BillingTab, type BillingTabProps } from './settings/billing-tab'
import {
  DEFAULT_COPY,
  INVOICES,
  MEMBERS,
  NOTIFY,
  PAYMENT_METHOD,
  PLANS,
  ROLES,
  USER,
  type SettingsCopy,
  type SettingsInvoice,
  type SettingsInvoiceStatus,
  type SettingsMember,
  type SettingsNotification,
  type SettingsNotificationGroup,
  type SettingsPaymentMethod,
  type SettingsPlan,
  type SettingsProfile,
  type SettingsRole,
  type SettingsSection,
  type SettingsSectionId,
  type SettingsUser,
} from './settings/data'
import { NotificationsTab, type NotificationsTabProps } from './settings/notifications-tab'
import { ProfileTab, type ProfileTabProps } from './settings/profile-tab'
import { TeamTab, type TeamTabProps } from './settings/team-tab'

/* An account's settings in five tabs: profile, account, team, billing and
 * notifications. Tabs stand in a column beside the page on wide screens and
 * run across the top (scrolling, with fading edges) on phones. Every save runs
 * through Button's onAction; the team table takes invited members in with
 * PresenceList (the row fades down into place while the rows below make
 * room) and lets them go the same way; deleting the account asks through
 * ConfirmDialog with a typed challenge. Swap the demo `wait`s for your API.
 * Pass your own `brand`, `user`, `members`, `plans`, `invoices` and
 * `notifications`, pick or add tabs with `sections`, and wire each action's
 * `on…` callback; every string is in `copy`. It is built for the compact layout
 * density (ui.css), taken from the page: one-line card heads, 12px bands, 16px
 * between fields. */

const ICONS: Record<SettingsSectionId, ReactNode> = {
  profile: <UserIcon size={16} />,
  account: <ShieldIcon size={16} />,
  team: <UsersIcon size={16} />,
  billing: <CreditCardIcon size={16} />,
  notifications: <BellIcon size={16} />,
}

const BRAND = { name: 'Northwind Labs' }

const ALL_SECTIONS: SettingsSectionId[] = ['profile', 'account', 'team', 'billing', 'notifications']

interface SettingsProps extends Omit<ComponentProps<'div'>, 'children'> {
  /** The tab open at first, when uncontrolled. Default 'profile'. */
  defaultTab?: string
  /** The open tab, to control it. Pair with `onTabChange`. */
  tab?: string
  /** Called with the tab's id when the person switches tabs. */
  onTabChange?: (tab: string) => void
  /** The tabs, in order: a built-in id (`'profile' | 'account' | 'team' | 'billing' | 'notifications'`) or your own `{ id, label, icon, panel }`. Default: the five built-in tabs. */
  sections?: Array<SettingsSectionId | SettingsSection>
  /** The workspace, named in the page's description, the team count and the invite, and its `logo` over the standalone title. Default: Northwind Labs. */
  brand?: { name: string; logo?: ReactNode }
  /** The page title's level. Default 1. */
  headingLevel?: 1 | 2 | 3
  /** A page in your app's frame: the shared page header (AppPage) and the frame's gutter, in a readable column centered in the content area, with no logo of its own. Default true; `false` draws its own page (`brand.logo` over the title, on a centered canvas). */
  embedded?: boolean
  /** Embedded, take the frame's whole width instead of stopping at a readable 1024px (at 100% scale). Default false. */
  fill?: boolean
  /** The signed-in person: profile fields and account email. Default: Ada Lovelace. */
  user?: SettingsUser
  /** The team, in order. Default: the demo's four. */
  members?: SettingsMember[]
  /** The roles a member can hold; `owner` rows are locked. Default: Owner, Admin, Member, Viewer. */
  roles?: SettingsRole[]
  /** The plans, cheapest first. Default: Hobby, Pro, Enterprise. */
  plans?: SettingsPlan[]
  /** The current plan's id, to control it. */
  plan?: string
  /** The current plan's id at first, when uncontrolled. Default 'pro'. */
  defaultPlan?: string
  /** The card on file, or `null` for none. Default: a Visa ending 4242. */
  paymentMethod?: SettingsPaymentMethod | null
  /** Past invoices, newest first. Default: the demo's three. */
  invoices?: SettingsInvoice[]
  /** Notification switches, by channel. Default: Email and Push. */
  notifications?: SettingsNotificationGroup[]
  /** Shows skeleton rows in the team and invoice tables while data loads. Default false. */
  loading?: boolean
  /** Any of the page's strings, to rewrite or translate. */
  copy?: Partial<SettingsCopy>
  /** A load failure, shown above the tabs with a Retry button when `onRetry` is set. */
  error?: ReactNode
  /** Called from the error's Retry button. */
  onRetry?: () => void
  /** Classes for key parts: the page header, the tab list and each tab's panel. */
  classNames?: Partial<Record<'header' | 'tabs' | 'content', string>>
  /** Saves the profile form; resolve when saved, throw to show the error. Default: a demo wait. */
  onSaveProfile?: ProfileTabProps['onSaveProfile']
  /** Uploads a new photo. Default: a demo wait. */
  onSaveAvatar?: ProfileTabProps['onSaveAvatar']
  /** Removes the photo. Default: a demo wait. */
  onRemoveAvatar?: ProfileTabProps['onRemoveAvatar']
  /** Changes the password once both new fields match. Default: a demo wait. */
  onUpdatePassword?: AccountTabProps['onUpdatePassword']
  /** Deletes the account after the typed confirmation. Default: a demo wait. */
  onDeleteAccount?: AccountTabProps['onDeleteAccount']
  /** Sends an invite; the row joins the table once it resolves. Default: a demo wait. */
  onInvite?: TeamTabProps['onInvite']
  /** Called when a member's role changes. */
  onRoleChange?: TeamTabProps['onRoleChange']
  /** Removes a member or revokes an invite; the row leaves once it resolves. */
  onRemoveMember?: TeamTabProps['onRemoveMember']
  /** Sends a pending invite again. */
  onResendInvite?: TeamTabProps['onResendInvite']
  /** Switches plan; the badge moves once it resolves. Default: a demo wait. */
  onChangePlan?: BillingTabProps['onChangePlan']
  /** Called from a plan marked `contactSales`. */
  onContactSales?: BillingTabProps['onContactSales']
  /** Called from the payment method's Update button. */
  onUpdatePayment?: BillingTabProps['onUpdatePayment']
  /** Called from an invoice's download button. */
  onDownloadInvoice?: BillingTabProps['onDownloadInvoice']
  /** Called when a notification switch flips. */
  onNotificationChange?: NotificationsTabProps['onNotificationChange']
}

function Settings({
  defaultTab = 'profile',
  tab: tabProp,
  onTabChange,
  sections = ALL_SECTIONS,
  brand = BRAND,
  headingLevel = 1,
  embedded = true,
  fill = false,
  user = USER,
  members = MEMBERS,
  roles = ROLES,
  plans = PLANS,
  plan,
  defaultPlan = 'pro',
  paymentMethod = PAYMENT_METHOD,
  invoices = INVOICES,
  notifications = NOTIFY,
  loading = false,
  copy: copyProp,
  error,
  onRetry,
  className,
  classNames,
  onSaveProfile,
  onSaveAvatar,
  onRemoveAvatar,
  onUpdatePassword,
  onDeleteAccount,
  onInvite,
  onRoleChange,
  onRemoveMember,
  onResendInvite,
  onChangePlan,
  onContactSales,
  onUpdatePayment,
  onDownloadInvoice,
  onNotificationChange,
  ...rest
}: SettingsProps) {
  const on = { onSaveProfile, onSaveAvatar, onRemoveAvatar, onUpdatePassword, onDeleteAccount, onInvite, onRoleChange, onRemoveMember, onResendInvite, onChangePlan, onContactSales, onUpdatePayment, onDownloadInvoice, onNotificationChange }
  const workspace = brand.name
  const Heading = `h${headingLevel}` as const
  const copy = { ...DEFAULT_COPY, ...copyProp }
  const mobile = useIsMobile()
  const [innerTab, setInnerTab] = useState(defaultTab)
  const tab = tabProp ?? innerTab

  const builtIn = (id: SettingsSectionId): ReactNode => {
    switch (id) {
      case 'profile':
        return <ProfileTab copy={copy} user={user} onSaveProfile={on.onSaveProfile} onSaveAvatar={on.onSaveAvatar} onRemoveAvatar={on.onRemoveAvatar} />
      case 'account':
        return <AccountTab copy={copy} user={user} onUpdatePassword={on.onUpdatePassword} onDeleteAccount={on.onDeleteAccount} />
      case 'team':
        return (
          // Remounts when loading ends, so the table starts from the members that arrived.
          <TeamTab
            key={loading ? 'loading' : 'ready'}
            copy={copy}
            members={members}
            roles={roles}
            workspace={workspace}
            loading={loading}
            onInvite={on.onInvite}
            onRoleChange={on.onRoleChange}
            onRemoveMember={on.onRemoveMember}
            onResendInvite={on.onResendInvite}
          />
        )
      case 'billing':
        return (
          <BillingTab
            copy={copy}
            plans={plans}
            plan={plan}
            defaultPlan={defaultPlan}
            onChangePlan={on.onChangePlan}
            onContactSales={on.onContactSales}
            paymentMethod={paymentMethod}
            onUpdatePayment={on.onUpdatePayment}
            invoices={invoices}
            onDownloadInvoice={on.onDownloadInvoice}
            loading={loading}
          />
        )
      case 'notifications':
        return <NotificationsTab copy={copy} notifications={notifications} onNotificationChange={on.onNotificationChange} />
    }
  }

  const tabs = sections.map((s) =>
    typeof s === 'string' ? { id: s, label: copy[`${s}Tab`], icon: ICONS[s], panel: builtIn(s) } : s,
  )

  const body = (
    <>
      {error && (
        <Alert variant="danger">
          <AlertTitle>{copy.errorTitle}</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
          {onRetry && (
            <AlertAction>
              <Button size="sm" variant="outline" onClick={onRetry}>
                {copy.retry}
              </Button>
            </AlertAction>
          )}
        </Alert>
      )}
      <Tabs
        value={tab}
        onValueChange={(value) => {
          setInnerTab(value as string)
          onTabChange?.(value as string)
        }}
        orientation={mobile ? 'horizontal' : 'vertical'}
        className="gap-6 md:gap-8"
      >
        <TabsList aria-label={copy.tabsLabel} className={cn(!mobile && 'w-44', classNames?.tabs)}>
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} data-yj-trigger="">
              {t.icon}
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((t) => (
          <TabsContent key={t.id} value={t.id} className={classNames?.content}>
            {t.panel}
          </TabsContent>
        ))}
      </Tabs>
    </>
  )

  if (embedded) {
    return (
      <AppPage
        {...rest}
        title={copy.title}
        description={copy.description(workspace)}
        headingLevel={headingLevel}
        width={fill ? 'fill' : 'readable'}
        className={className}
        classNames={{ header: classNames?.header }}
      >
        {body}
      </AppPage>
    )
  }
  return (
    <div {...rest} className={cn('min-h-dvh bg-canvas', className)}>
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 md:px-8 md:py-10">
        <div className={cn('flex flex-col gap-1', classNames?.header)}>
          {brand.logo}
          <Heading className="text-2xl font-semibold tracking-tight text-fg">{copy.title}</Heading>
          <p className="text-ui text-fg-muted">{copy.description(workspace)}</p>
        </div>
        {body}
      </div>
    </div>
  )
}

export { NotificationPreferences, type NotificationPreferencesProps } from './settings/notification-preferences'
export type { NotificationOption, NotificationPreferencesCopy, NotificationPreferencesValue } from './settings/notification-preferences-data'
export {
  Settings,
  type SettingsProps,
  type SettingsCopy,
  type SettingsSection,
  type SettingsSectionId,
  type SettingsUser,
  type SettingsProfile,
  type SettingsMember,
  type SettingsRole,
  type SettingsPlan,
  type SettingsPaymentMethod,
  type SettingsInvoice,
  type SettingsInvoiceStatus,
  type SettingsNotification,
  type SettingsNotificationGroup,
}
