import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { ThemeToggle, type ThemeToggleMode } from './theme-toggle'

const meta: Meta<typeof ThemeToggle> = {
  title: 'UI/Primitives/Theme Toggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Light or dark for the whole page, through `data-theme` on <html>. `button` flips light and dark: the sun’s rays draw back into the core and a bite carves the moon. It’s a toggle button named "Dark", pressed while the page is dark. `segmented` offers Light, Dark and System, its key gliding to the choice. Uncontrolled it stores the choice (localStorage "theme") and follows the system in System mode; controlled (`value`/`onValueChange`, e.g. next-themes) it only reports it. Until the mode is known it shows no choice, so server and client agree. Reduced motion: the icon swaps at once and the key jumps. These stories switch the whole canvas, as they would an app.',
      },
    },
  },
  args: { storageKey: 'youj-storybook-theme' },
}
export default meta
type Story = StoryObj<typeof ThemeToggle>

/** Where they live: the header's icon button, and the Appearance row in settings. Both drive the same page. */
export const Hero: Story = {
  render: (args) => (
    <div className="flex w-full max-w-[440px] flex-col gap-4">
      <header className="flex h-12 items-center gap-3 rounded-xl border border-line bg-surface ps-4 pe-2 shadow-xs">
        <span className="text-ui font-semibold tracking-tight text-fg">Northstar</span>
        <nav className="flex gap-3 text-ui text-fg-muted">
          <span className="text-fg">Services</span>
          <span>Incidents</span>
        </nav>
        <ThemeToggle {...args} className="ms-auto" />
      </header>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 shadow-xs">
        <div className="flex min-w-0 flex-col">
          <span className="text-ui font-medium text-fg">Appearance</span>
          <span className="text-ui-sm text-fg-muted">System follows your device.</span>
        </div>
        <ThemeToggle {...args} variant="segmented" size="sm" />
      </div>
    </div>
  ),
}

/** Controlled, as with next-themes: `value={theme}` and `onValueChange={setTheme}`; the owner writes data-theme. */
export const Controlled: Story = {
  render: () => {
    const [mode, setMode] = useState<ThemeToggleMode>('system')
    return (
      <div className="flex items-center gap-3">
        <ThemeToggle
          variant="segmented"
          value={mode}
          onValueChange={(next) => {
            setMode(next)
            const scheme = next === 'system' ? (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : next
            document.documentElement.setAttribute('data-theme', scheme)
          }}
        />
        <span className="font-mono text-ui-sm text-fg-muted">theme: {mode}</span>
      </div>
    )
  },
}
