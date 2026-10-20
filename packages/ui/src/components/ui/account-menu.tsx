'use client'

import type { ReactElement, ReactNode } from 'react'
import { isPerMode, themes, type ColorMode } from '@youj/core'
import { useComponentLabels } from '@youj/core/labels'
import { accountMenuLabels } from '@youj/core/labels'
import { LogOutIcon, ThemeIcon } from '@youj/icons'
import { cn, initials } from '../../lib/utils'
import { Avatar, AvatarFallback, AvatarImage } from './avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  type DropdownMenuContentProps,
} from './dropdown-menu'

/* The signed-in user's menu: an avatar that opens a DropdownMenu with who you
 * are, the workspaces you can switch to, your own items (profile, settings,
 * keyboard shortcuts…), a Theme submenu and Sign out. Everything is the
 * DropdownMenu's: roving focus, typeahead, submenus on → (← back, mirrored in
 * RTL), the gliding highlight, checks that draw in, Escape back to the avatar.
 *
 * Theme lists the built-in presets from @youj/motion (`themes`), each
 * with its accent, and an appearance choice. The menu only reports the choice;
 * apply it where the app keeps its theme, e.g.
 * `<YoujProvider theme={presetById(themeId)}>` and a data-theme attribute. */

interface AccountMenuUser {
  name: string
  email: string
  /** Image URL. The initials show until it loads, and if it fails. */
  avatar?: string
}

interface AccountMenuWorkspace {
  id: string
  name: string
  /** Image URL for the workspace logo. */
  logo?: string
}

interface AccountMenuProps {
  user: AccountMenuUser
  /** Workspaces to switch between, shown as a radio group. */
  workspaces?: AccountMenuWorkspace[]
  workspace?: string
  onWorkspaceChange?: (id: string) => void
  /** The active preset's id (`graphite`, `terminal`…). The Theme submenu shows when this or `colorMode` is set. */
  theme?: string
  onThemeChange?: (id: string) => void
  colorMode?: ColorMode
  onColorModeChange?: (mode: ColorMode) => void
  /** Adds Sign out at the end. */
  onSignOut?: () => void
  /** Your own rows, between the profile and the theme: DropdownMenuItem, DropdownMenuShortcut, groups. */
  children?: ReactNode
  align?: DropdownMenuContentProps['align']
  side?: DropdownMenuContentProps['side']
  /**
   * Your own trigger in place of the avatar, e.g. a sidebar's account card or a
   * status pill: an element the trigger renders as, with its content inside.
   * It keeps the menu's accessible name unless it brings its own.
   */
  trigger?: ReactElement<Record<string, unknown>>
  /** The trigger's class. */
  className?: string
}

const MODES = ['light', 'dark', 'system'] as const satisfies readonly ColorMode[]

function AccountMenu({
  user,
  workspaces,
  workspace,
  onWorkspaceChange,
  theme,
  onThemeChange,
  colorMode,
  onColorModeChange,
  onSignOut,
  children,
  align = 'end',
  side,
  trigger,
  className,
}: AccountMenuProps) {
  const labels = useComponentLabels(accountMenuLabels)
  const modeLabel: Record<ColorMode, string> = { light: labels.colorModeLight, dark: labels.colorModeDark, system: labels.colorModeSystem }
  const showTheme = theme !== undefined || colorMode !== undefined
  const preset = themes.find((t) => t.id === theme)
  return (
    <DropdownMenu>
      {trigger ? (
        <DropdownMenuTrigger data-slot="account-menu-trigger" aria-label={labels.accountMenu(user.name)} className={className} render={trigger} />
      ) : (
        <DropdownMenuTrigger
          data-slot="account-menu-trigger"
          aria-label={labels.accountMenu(user.name)}
          className={cn(
            'relative inline-grid shrink-0 place-items-center own:rounded-full focus-ring',
            'transition-[box-shadow,opacity] yj-duration-fast ease-standard hover:opacity-90 data-popup-open:ring-2 data-popup-open:ring-accent-line',
            className,
          )}
        >
          <Avatar>
            {user.avatar && <AvatarImage src={user.avatar} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
      )}
      <DropdownMenuContent align={align} side={side} data-slot="account-menu" className="w-64">
        <div data-slot="account-menu-profile" className="own:flex items-center gap-2.5 own:px-2 own:pt-1.5 own:pb-2">
          <Avatar size="lg">
            {user.avatar && <AvatarImage src={user.avatar} alt="" />}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
          <div className="own:flex min-w-0 flex-col">
            <span className="truncate own:text-ui own:font-medium own:text-fg">{user.name}</span>
            <span className="truncate own:text-ui-sm own:text-fg-muted">{user.email}</span>
          </div>
        </div>

        {workspaces && workspaces.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup value={workspace} onValueChange={(value) => onWorkspaceChange?.(value as string)}>
              <DropdownMenuLabel>{labels.workspaces}</DropdownMenuLabel>
              {workspaces.map((w) => (
                <DropdownMenuRadioItem key={w.id} value={w.id}>
                  <Avatar size="sm" className="rounded-sm after:rounded-sm">
                    {w.logo && <AvatarImage src={w.logo} alt="" className="rounded-sm" />}
                    <AvatarFallback className="rounded-sm">{initials(w.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{w.name}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </>
        )}

        {children && (
          <>
            <DropdownMenuSeparator />
            {children}
          </>
        )}

        {showTheme && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger data-yj-trigger="">
                <ThemeIcon size={16} strokeWidth={1.75} />
                {labels.accountTheme}
                <span className="own:ms-auto ps-3 own:text-ui-sm own:text-fg-muted">{preset?.name}</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-52">
                {theme !== undefined && (
                  <DropdownMenuRadioGroup value={theme} onValueChange={(value) => onThemeChange?.(value as string)}>
                    <DropdownMenuLabel>{labels.accountPreset}</DropdownMenuLabel>
                    {themes.map((t) => (
                      <DropdownMenuRadioItem key={t.id} value={t.id}>
                        <span
                          aria-hidden
                          className="size-3.5 shrink-0 rounded-full border border-line-subtle"
                          // A preset that tunes its accent per mode shows the side for the mode it's seen in.
                          style={{ background: isPerMode(t.accent) ? `light-dark(${t.accent.light}, ${t.accent.dark})` : t.accent }}
                        />
                        {t.name}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                )}
                {theme !== undefined && colorMode !== undefined && <DropdownMenuSeparator />}
                {colorMode !== undefined && (
                  <DropdownMenuRadioGroup value={colorMode} onValueChange={(value) => onColorModeChange?.(value as ColorMode)}>
                    <DropdownMenuLabel>{labels.accountAppearance}</DropdownMenuLabel>
                    {MODES.map((m) => (
                      <DropdownMenuRadioItem key={m} value={m}>
                        {modeLabel[m]}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                )}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </>
        )}

        {onSignOut && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={onSignOut} data-yj-trigger="">
                <LogOutIcon size={16} strokeWidth={1.75} className="rtl:-scale-x-100" />
                {labels.signOut}
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { AccountMenu }
export type { AccountMenuProps, AccountMenuUser, AccountMenuWorkspace }
