'use client'

import { HierarchyChart, type HierarchyNode } from '@youj/react'
import { Demo } from './demo'

const TEAM: HierarchyNode = {
  id: 'maya',
  name: 'Maya Lindqvist',
  role: 'Head of Product',
  children: [
    {
      id: 'jonas',
      name: 'Jonas Okafor',
      role: 'Engineering',
      badge: 'Hiring',
      children: [
        { id: 'priya', name: 'Priya Raman', role: 'Platform' },
        { id: 'ken', name: 'Ken Watanabe', role: 'Web' },
      ],
    },
    { id: 'hana', name: 'Hana Sato', role: 'Design', children: [{ id: 'noah', name: 'Noah Kim', role: 'Research' }] },
  ],
}

/** A small team as a tidy tree: fold a branch, select a person, pan and zoom. */
export default function HierarchyTile() {
  return (
    <Demo>
      <div className="explore-box w-full">
        <HierarchyChart nodes={TEAM} label="Product team" defaultSelected="ken" height={300} sound={false} />
      </div>
    </Demo>
  )
}
