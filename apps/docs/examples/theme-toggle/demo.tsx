'use client'

import { useState } from 'react'
import { ThemeToggle, type ThemeToggleMode } from '@youj/react'

/* In an app the toggles switch the whole page. Here they're controlled and
 * the mode is applied to this card alone, so the docs keep their theme. */
export default function ThemeToggleDemo() {
  const [mode, setMode] = useState<ThemeToggleMode>('light')
  const scheme = mode === 'system' ? (typeof window !== 'undefined' && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark') : mode

  return (
    <div data-theme={scheme} className="flex w-full max-w-md flex-col gap-3 rounded-2xl bg-canvas p-3 text-fg">
      <header className="flex h-12 items-center gap-3 rounded-xl border border-line bg-surface ps-4 pe-2 shadow-xs">
        <span className="text-ui font-semibold tracking-tight">Northstar</span>
        <nav className="flex gap-3 text-ui text-fg-muted">
          <span className="text-fg">Services</span>
          <span>Incidents</span>
        </nav>
        <ThemeToggle value={mode} onValueChange={setMode} className="ms-auto" />
      </header>
      <div className="flex items-center justify-between gap-4 rounded-xl border border-line bg-surface px-4 py-3 shadow-xs">
        <div className="flex min-w-0 flex-col">
          <span className="text-ui font-medium">Appearance</span>
          <span className="text-ui-sm text-fg-muted">System follows your device.</span>
        </div>
        <ThemeToggle variant="segmented" size="sm" value={mode} onValueChange={setMode} />
      </div>
    </div>
  )
}
