'use client'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge } from '@youj/react'
import { AlertTriangleIcon, CheckCircleIcon, LoaderRingIcon } from '@youj/icons'

const CHECKS = [
  { id: 'build', title: 'Build', status: 'passed', detail: 'Compiled 214 modules in 18.4s. Output: 1.9 MB, 312 KB gzipped.' },
  { id: 'types', title: 'Type check', status: 'passed', detail: 'No errors in 1,208 files.' },
  {
    id: 'bundle',
    title: 'Bundle size',
    status: 'warning',
    detail: 'The pricing route grew by 38 KB (+12%). Most of it is date-fns/locale, imported in pricing-grid.tsx.',
  },
  { id: 'e2e', title: 'End-to-end tests', status: 'running', detail: '41 of 96 specs done on 4 workers.' },
] as const

const STATUS = {
  passed: { Icon: CheckCircleIcon, tone: 'text-success', badge: 'success', label: 'Passed' },
  warning: { Icon: AlertTriangleIcon, tone: 'text-warning', badge: 'warning', label: 'Warning' },
  running: { Icon: LoaderRingIcon, tone: 'text-fg-muted', badge: 'secondary', label: 'Running' },
} as const

export default function AccordionMultiple() {
  return (
    <div className="w-full max-w-xl rounded-xl border border-line bg-surface px-4">
      {/* `multiple` keeps several open. The running check is disabled until it finishes. */}
      <Accordion multiple defaultValue={['bundle']}>
        {CHECKS.map((check) => {
          const { Icon, tone, badge, label } = STATUS[check.status]
          return (
            <AccordionItem key={check.id} value={check.id} disabled={check.status === 'running'}>
              <AccordionTrigger>
                <span className="flex items-center gap-2.5">
                  <Icon size={16} className={tone} />
                  {check.title}
                </span>
                <Badge variant={badge} className="ms-auto">
                  {label}
                </Badge>
              </AccordionTrigger>
              <AccordionContent className="ps-6.5">{check.detail}</AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>
    </div>
  )
}
