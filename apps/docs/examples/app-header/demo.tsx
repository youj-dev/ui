'use client'

import { useRef, useState } from 'react'
import { BarChartIcon, HomeIcon, KeyboardIcon, RocketIcon, SettingsIcon, UserIcon } from '@youj/icons'
import {
  AccountMenu,
  AppHeader,
  AppHeaderActions,
  AppHeaderBrand,
  AppHeaderMenu,
  AppHeaderMenuLink,
  AppHeaderNav,
  AppHeaderSearch,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuShortcut,
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from '@youj/react'
import {
  CommandGroup,
  CommandItem,
  CommandPalette,
  CommandShortcut,
} from '@youj/react/command'

const PAGES = [
  { id: 'overview', label: 'Overview', icon: <HomeIcon size={16} /> },
  { id: 'deployments', label: 'Deployments', icon: <RocketIcon size={16} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChartIcon size={16} /> },
] as const

type Page = (typeof PAGES)[number]['id']

const DEPLOYS = [
  { branch: 'main', message: 'Tighten the pricing grid on mobile', age: '4m' },
  { branch: 'feat/onboarding', message: 'Copy pass on the welcome step', age: '38m' },
  { branch: 'fix/og-image', message: 'Regenerate the OG image at 2x', age: '2h' },
  { branch: 'main', message: 'Bump the edge cache to 10 minutes', age: '5h' },
  { branch: 'chore/deps', message: 'Update the lockfile', age: '1d' },
  { branch: 'main', message: 'Ship the new billing page', age: '2d' },
]

function Logo() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="text-accent">
      <path d="M4 5h4l4 7-4 7H4l4-7z" fill="currentColor" />
      <path d="M12 5h4l4 7-4 7h-4l4-7z" fill="currentColor" opacity={0.45} />
    </svg>
  )
}

export default function AppHeaderDemo() {
  // The header condenses as this frame scrolls under it; in an app, leave scrollContainer out and it follows the page.
  const scroller = useRef<HTMLDivElement>(null)
  const [page, setPage] = useState<Page>('deployments')
  const [palette, setPalette] = useState(false)
  const [theme, setTheme] = useState('basalt')
  const [mode, setMode] = useState<'light' | 'dark' | 'system'>('dark')
  const go = (id: Page) => (event: { preventDefault: () => void }) => {
    event.preventDefault()
    setPage(id)
  }

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-canvas shadow-xs">
      <div ref={scroller} className="h-[26rem] overflow-y-auto">
        <AppHeader scrollContainer={scroller}>
          <AppHeaderBrand href="#" onClick={go('overview')}>
            <Logo />
            Northwind
          </AppHeaderBrand>
          <AppHeaderNav>
            <NavigationMenu aria-label="Main">
              <NavigationMenuList>
                {PAGES.map((p) => (
                  <NavigationMenuItem key={p.id}>
                    <NavigationMenuLink
                      href={`#${p.id}`}
                      active={page === p.id}
                      aria-current={page === p.id ? 'page' : undefined}
                      onClick={go(p.id)}
                      className={navigationMenuTriggerStyle()}
                    >
                      {p.label}
                    </NavigationMenuLink>
                  </NavigationMenuItem>
                ))}
              </NavigationMenuList>
            </NavigationMenu>
          </AppHeaderNav>
          <AppHeaderActions>
            {/* The docs' own search owns ⌘K, so this demo's palette listens for ⌘J. */}
            <AppHeaderSearch shortcut="j" className="md:w-36 lg:w-36" onClick={() => setPalette(true)} />
            <AccountMenu
              user={{ name: 'Ada Lovelace', email: 'ada@northwind.dev' }}
              theme={theme}
              onThemeChange={setTheme}
              colorMode={mode}
              onColorModeChange={setMode}
              onSignOut={() => {}}
            >
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  <UserIcon size={16} strokeWidth={1.75} />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon size={16} strokeWidth={1.75} />
                  Settings
                  <DropdownMenuShortcut>⌘,</DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <KeyboardIcon size={16} strokeWidth={1.75} />
                  Keyboard shortcuts
                  <DropdownMenuShortcut>?</DropdownMenuShortcut>
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </AccountMenu>
            <AppHeaderMenu header="Northwind">
              {PAGES.map((p) => (
                <AppHeaderMenuLink key={p.id} href={`#${p.id}`} active={page === p.id} onClick={go(p.id)}>
                  {p.icon} {p.label}
                </AppHeaderMenuLink>
              ))}
            </AppHeaderMenu>
          </AppHeaderActions>
          <CommandPalette open={palette} onOpenChange={setPalette} shortcut="j">
            <CommandGroup heading="Go to">
              {PAGES.map((p) => (
                <CommandItem
                  key={p.id}
                  onSelect={() => {
                    setPage(p.id)
                    setPalette(false)
                  }}
                >
                  {p.icon} {p.label} <CommandShortcut>G {p.label[0]}</CommandShortcut>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandPalette>
        </AppHeader>

        <div className="flex flex-col gap-3 px-5 pt-5 pb-8">
          <p className="text-ui-lg font-semibold tracking-tight text-fg capitalize">{page}</p>
          <p className="text-ui text-fg-muted">Scroll this frame: the bar condenses as the list passes under it.</p>
          <ul className="flex flex-col gap-2">
            {[...DEPLOYS, ...DEPLOYS].map((d, i) => (
              <li key={i} className="flex items-center gap-3 rounded-lg border border-line bg-surface px-3.5 py-3 text-ui">
                <span aria-hidden className="size-2 shrink-0 rounded-full bg-success" />
                <span className="min-w-0 flex-1 truncate text-fg">{d.message}</span>
                <span className="font-mono text-ui-sm text-fg-muted max-sm:hidden">{d.branch}</span>
                <span className="w-8 text-end text-ui-sm text-fg-muted tabular-nums">{d.age}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
