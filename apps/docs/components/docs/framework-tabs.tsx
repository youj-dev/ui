'use client'

import { Children, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react'
import { TabList } from '@/components/ui/controls'

/* The same steps for each framework, one tab each (Installation's manual
 * setup): <FrameworkTabs><FrameworkTab label="Next.js">…</FrameworkTab>…</FrameworkTabs>.
 * Every panel stays in the page, hidden, so find-in-page and the Markdown
 * version (lib/markdown.ts) have them all. */

interface TabProps {
  label: string
  children: ReactNode
}

export function FrameworkTab({ children }: TabProps) {
  return <>{children}</>
}

export function FrameworkTabs({ children }: { children: ReactNode }) {
  const id = useId()
  const tabs = Children.toArray(children).filter((child): child is ReactElement<TabProps> => isValidElement(child))
  const [value, setValue] = useState('0')
  return (
    <div className="my-6">
      <div className="border-b border-line">
        <TabList idBase={id} label="Framework" value={value} onChange={setValue} tabs={tabs.map((tab, i) => ({ value: String(i), label: tab.props.label }))} />
      </div>
      {tabs.map((tab, i) => (
        <div key={tab.props.label} role="tabpanel" id={`${id}-panel-${i}`} aria-labelledby={`${id}-tab-${i}`} hidden={String(i) !== value}>
          {tab.props.children}
        </div>
      ))}
    </div>
  )
}
