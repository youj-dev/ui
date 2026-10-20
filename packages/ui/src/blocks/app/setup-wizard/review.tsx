'use client'

import type { ReactNode } from 'react'
import { Reveal } from '@youj/motion'
import { Illustration, type IllustrationSlot } from '@youj/illustrations'
import { ArrowRightIcon, PencilIcon, UserPlusIcon } from '@youj/icons'
import { Button } from '../../../components/ui/button'
import { formatDay, formatPhone, typesFor, type NewHire, type NewHireAccount, type WizardCopy } from './data'

function Section({ title, onEdit, children, copy }: { title: string; onEdit: () => void; children: ReactNode; copy: WizardCopy }) {
  return (
    <section aria-label={title} className="flex flex-col gap-2 border-t border-line pt-4 first:border-t-0 first:pt-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-ui font-medium text-fg">{title}</h3>
        <Button variant="ghost" size="xs" aria-label={copy.editSection(title)} onClick={onEdit}>
          <PencilIcon size={13} />
          {copy.edit}
        </Button>
      </div>
      <dl className="grid grid-cols-[minmax(0,--spacing(36))_minmax(0,1fr)] gap-x-4 gap-y-1.5 text-ui">{children}</dl>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 text-pretty break-words text-fg">{children}</dd>
    </>
  )
}

/** Everything entered, by step, each with a way back to change it. */
export function Review({
  hire,
  onEdit,
  copy,
  teams,
  laptops,
  accounts: options,
  locale,
}: {
  hire: NewHire
  onEdit: (step: number) => void
  copy: WizardCopy
  teams: Record<string, string>
  laptops: Record<string, string>
  accounts: NewHireAccount[]
  locale: string
}) {
  const accounts = [copy.baseAccount, ...options.filter((a) => hire[a.id]).map((a) => a.label)]
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-line p-4">
      <Section title={copy.personalTitle} copy={copy} onEdit={() => onEdit(0)}>
        <Row label={copy.name}>
          {hire.firstName} {hire.lastName}
        </Row>
        <Row label={copy.email}>{hire.email}</Row>
        <Row label={copy.phone}>
          <span dir="ltr" className="tabular-nums">
            {formatPhone(hire.phone)}
          </span>
        </Row>
      </Section>
      <Section title={copy.roleTitle} copy={copy} onEdit={() => onEdit(1)}>
        <Row label={copy.jobTitleShort}>{hire.title}</Row>
        <Row label={copy.team}>
          {teams[hire.team]} · {typesFor(copy)[hire.type]}
        </Row>
        <Row label={copy.starts}>{formatDay(hire.startDate, locale)}</Row>
      </Section>
      <Section title={copy.setupTitle} copy={copy} onEdit={() => onEdit(2)}>
        <Row label={copy.laptop}>{laptops[hire.laptop]}</Row>
        <Row label={copy.accounts}>{accounts.join(', ')}</Row>
        {hire.note.trim() && <Row label={copy.note}>“{hire.note.trim()}”</Row>}
      </Section>
    </div>
  )
}

/** The invite is out: a scene, what happens next, and where to go from here. */
export function Done({
  hire,
  illustration,
  onAnother,
  onView,
  copy,
  locale,
  level,
}: {
  hire: NewHire
  illustration?: IllustrationSlot
  onAnother: () => void
  onView?: () => void
  copy: WizardCopy
  locale: string
  level: 2 | 3 | 4
}) {
  const Heading = `h${level}` as const
  return (
    <Reveal inView={false} variant="rise" className="flex flex-col items-center gap-5 py-6 text-center">
      {illustration !== null && (
        <div data-slot="wizard-illustration" className="-my-2">
          <Illustration scene={illustration} fallback="success" unit={16} />
        </div>
      )}
      <div className="flex max-w-md flex-col gap-1.5">
        <Heading tabIndex={-1} data-done-title className="text-xl font-semibold tracking-tight text-balance outline-none">
          {copy.doneTitle(hire.firstName)}
        </Heading>
        <p className="text-ui text-pretty text-fg-muted">{copy.doneDescription(hire.email, formatDay(hire.startDate, locale), hire.laptop === 'byod')}</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" onClick={onAnother}>
          <UserPlusIcon size={15} />
          {copy.another}
        </Button>
        <Button onClick={onView}>
          {copy.viewProfile} <ArrowRightIcon size={15} className="rtl:-scale-x-100" />
        </Button>
      </div>
    </Reveal>
  )
}
