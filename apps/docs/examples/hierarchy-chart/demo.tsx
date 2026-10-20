'use client'

import { useState } from 'react'
import { HierarchyChart, type HierarchyNode } from '@youj/react'

// A small company, three levels deep.
const ORG: HierarchyNode = {
  id: 'maya',
  name: 'Maya Lindqvist',
  role: 'Chief Executive Officer',
  children: [
    {
      id: 'jonas',
      name: 'Jonas Okafor',
      role: 'VP Engineering',
      badge: 'Hiring',
      children: [
        { id: 'priya', name: 'Priya Raman', role: 'Platform Lead' },
        { id: 'ken', name: 'Ken Watanabe', role: 'Product Engineering' },
        { id: 'amara', name: 'Amara Nwosu', role: 'Frontend Engineer' },
      ],
    },
    {
      id: 'elena',
      name: 'Elena Petrova',
      role: 'VP Product',
      children: [
        { id: 'noah', name: 'Noah Kim', role: 'Product Manager' },
        { id: 'hana', name: 'Hana Sato', role: 'Design Lead' },
      ],
    },
    {
      id: 'david',
      name: 'David Mensah',
      role: 'Chief Financial Officer',
      children: [{ id: 'olivia', name: 'Olivia Hart', role: 'Controller' }],
    },
  ],
}

export default function HierarchyChartDemo() {
  const [selected, setSelected] = useState<string | null>('ken')
  return (
    <div className="w-full max-w-5xl">
      <HierarchyChart nodes={ORG} label="Company org chart" selected={selected} onSelectedChange={setSelected} height={440} />
    </div>
  )
}
