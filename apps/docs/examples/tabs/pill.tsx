'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@youj/react'
import { TerminalIcon } from '@youj/icons'

const COMMANDS = {
  pnpm: 'pnpm add @youj/react',
  npm: 'npm install @youj/react',
  yarn: 'yarn add @youj/react',
  bun: 'bun add @youj/react',
}

export default function TabsPill() {
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      <Tabs defaultValue="pnpm" className="gap-0">
        <div className="flex items-center justify-between gap-3 border-b border-line py-2 ps-3 pe-2">
          <span className="flex items-center gap-2 text-ui text-fg-muted">
            <TerminalIcon size={16} />
            Install
          </span>
          {/* A raised key in a recessed track: the segmented look, for short labels. */}
          <TabsList variant="pill" aria-label="Package manager">
            {Object.keys(COMMANDS).map((manager) => (
              <TabsTrigger key={manager} value={manager} className="font-mono text-ui-sm">
                {manager}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {Object.entries(COMMANDS).map(([manager, command]) => (
          <TabsContent key={manager} value={manager} className="px-4 py-4">
            <code className="font-mono text-ui text-fg">
              <span className="text-fg-muted select-none">$ </span>
              {command}
            </code>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
