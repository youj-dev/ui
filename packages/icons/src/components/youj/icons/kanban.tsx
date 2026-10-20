import { m } from 'motion/react'
import { createIcon, after } from './icon-base'

/** A card moves on: the first column gives one up and the next column grows to take it, held while hovered. */
export const KanbanIcon = createIcon({
  name: 'kanban',
  category: 'data',
  keywords: ['board', 'columns', 'tasks', 'project', 'workflow', 'sprint', 'backlog'],
  variants: (k) => ({
    todo: {
      rest: { d: 'M7.5 7 V14', transition: after(k, k.stagger('loose'), 'base') },
      active: { d: 'M7.5 7 V10.5', transition: k.tween('base', 'standard') },
    },
    doing: {
      rest: { d: 'M12 7 V11', transition: k.tween('base') },
      active: { d: 'M12 7 V14.5', transition: after(k, k.stagger('loose'), 'base', 'standard') },
    },
  }),
  render: (v) => (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <m.path d="M7.5 7 V14" variants={v.todo} />
      <m.path d="M12 7 V11" variants={v.doing} />
      <path d="M16.5 7 V16" />
    </>
  ),
})
