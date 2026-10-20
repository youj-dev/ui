'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@youj/react'
import { FileTextIcon } from '@youj/icons'

const FILES = [
  'page.tsx',
  'layout.tsx',
  'pricing-grid.tsx',
  'checkout-button.tsx',
  'use-subscription.ts',
  'stripe.server.ts',
  'plans.json',
  'globals.css',
  'middleware.ts',
  'next.config.ts',
  'README.md',
  'package.json',
]

export default function TabsOverflow() {
  const [file, setFile] = useState('pricing-grid.tsx')

  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-line bg-surface">
      {/* Twelve tabs in a narrow editor: the list scrolls, its edges fade, and the selected tab scrolls into view. */}
      <Tabs value={file} onValueChange={(value) => setFile(value as string)} className="gap-0">
        <TabsList inset aria-label="Open files" className="[--tabs-inset:--spacing(4)]">
          {FILES.map((name) => (
            <TabsTrigger key={name} value={name} className="font-mono text-ui-sm">
              <FileTextIcon size={16} className="text-fg-muted" />
              {name}
            </TabsTrigger>
          ))}
        </TabsList>
        {FILES.map((name) => (
          <TabsContent key={name} value={name} className="px-4 py-4">
            <pre dir="ltr" className="font-mono text-ui-sm leading-6 text-fg-muted">
              {`// app/(marketing)/pricing/${name}\n// Last edited by Priya Raman, 2 hours ago`}
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
