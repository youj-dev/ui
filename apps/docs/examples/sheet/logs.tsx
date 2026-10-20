'use client'

import { Badge, Button, Sheet, SheetBody, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@youj/react'
import { TerminalIcon } from '@youj/icons'
import { IllustrationDeploy } from '@youj/illustrations'

const LOG = [
  ['0.0s', 'Cloning github.com/acme/orion (branch: main, commit: 4f2a91c)'],
  ['0.4s', 'Restored build cache from the previous deployment'],
  ['0.6s', 'Running "pnpm install --frozen-lockfile"'],
  ['6.1s', 'Packages: +312, done in 5.4s'],
  ['6.2s', 'Running "pnpm build"'],
  ['6.9s', '▲ Next.js 16.3.6'],
  ['7.0s', 'Creating an optimized production build…'],
  ['14.8s', '✓ Compiled successfully'],
  ['15.1s', 'Linting and checking validity of types…'],
  ['19.6s', 'Collecting page data…'],
  ['21.2s', 'Generating static pages (0/48)'],
  ['23.9s', 'Generating static pages (48/48)'],
  ['24.3s', 'Finalizing page optimization…'],
  ['24.9s', 'Route (app): 48 routes, 31 static, 17 dynamic'],
  ['25.2s', 'First Load JS shared by all: 102 kB'],
  ['25.6s', 'Build completed in 19.4s'],
  ['26.0s', 'Uploading 1.4 MB of static assets'],
  ['27.3s', 'Deploying 17 functions to fra1'],
  ['31.8s', 'Assigning orion.acme.dev'],
  ['32.0s', 'Deployment ready'],
]

export default function SheetLogs() {
  return (
    <Sheet>
      <SheetTrigger render={<Button variant="outline" />}>
        <TerminalIcon />
        Build logs
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[45dvh]">
        <SheetHeader className="flex-row items-center gap-4">
          {/* Decorative: with no title the scene is hidden from assistive tech. */}
          <IllustrationDeploy unit={7} className="-my-4 -mx-2 shrink-0" />
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-2">
              <SheetTitle>Build logs</SheetTitle>
              <Badge variant="success">Ready</Badge>
            </div>
            <SheetDescription>orion · main · 4f2a91c, built in 32s</SheetDescription>
          </div>
        </SheetHeader>
        {/* Nothing in the body is focusable, so once it overflows it becomes a tab stop and scrolls with the keyboard. */}
        <SheetBody role="region" aria-label="Log output" className="gap-0 font-mono text-ui-sm">
          {LOG.map(([time, line]) => (
            <p key={time} className="flex gap-4 py-0.5">
              <span className="w-10 shrink-0 text-end text-fg-muted tabular-nums">{time}</span>
              <span className="text-fg">{line}</span>
            </p>
          ))}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}
