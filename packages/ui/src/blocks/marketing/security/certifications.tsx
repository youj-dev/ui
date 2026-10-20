'use client'

import { useMemo, useState } from 'react'
import { CheckCircleIcon, ClockIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { AsyncButton } from '../../../components/ui/async-button'
import { dateTimeFormat, initials } from '../../../lib/utils'
import type { SecurityCertification, MarketingSecurityCopy } from './data'

/* Each certification as a card: its mark, name and scope, whether it is held
 * or in progress, who audited it or when it renews, and a button to request
 * the report (it runs through Button's own pending, done and failure states,
 * and the card remembers it was asked for). */

interface CertificationsProps {
  certifications: SecurityCertification[]
  locale: string
  copy: MarketingSecurityCopy
  onRequest: (certification: SecurityCertification) => Promise<unknown> | unknown
  /** The level of each card's name. */
  headingLevel: number
}

export function Certifications({ certifications, locale, copy, onRequest, headingLevel }: CertificationsProps) {
  const Name = `h${headingLevel}` as 'h4'
  const [asked, setAsked] = useState<string[]>([])
  const month = useMemo(() => dateTimeFormat(locale, { month: 'short', year: 'numeric', timeZone: 'UTC' }), [locale])
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {certifications.map((cert) => {
        const held = cert.status === 'certified'
        const requestable = cert.requestable ?? held
        return (
          <li key={cert.id} className="flex flex-col gap-4 rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-start justify-between gap-3">
              <span aria-hidden className="grid size-11 shrink-0 place-items-center rounded-xl border border-line bg-band text-fg">
                {cert.mark ? (
                  <svg viewBox="0 0 24 24" className="size-6 fill-current">
                    {cert.mark}
                  </svg>
                ) : (
                  <span className="text-ui font-semibold">{initials(cert.name)}</span>
                )}
              </span>
              <Badge variant={held ? 'success' : 'secondary'}>
                {held ? <CheckCircleIcon size={12} /> : <ClockIcon size={12} />}
                {held ? copy.certified : copy.inProgress}
              </Badge>
            </div>
            <div className="flex flex-1 flex-col gap-1.5">
              <Name className="text-ui-lg font-semibold text-fg">{cert.name}</Name>
              <p className="text-pretty text-ui text-fg-muted">{cert.scope}</p>
              <p className="mt-1 text-ui-sm text-fg-muted">
                {held && cert.issuer && <span>{copy.auditedBy(cert.issuer)}</span>}
                {held && cert.issuer && cert.validThrough !== undefined && ' · '}
                {held && cert.validThrough !== undefined && <span>{copy.validThrough(month.format(cert.validThrough))}</span>}
                {!held && cert.issuer && <span>{cert.issuer}</span>}
              </p>
            </div>
            {requestable &&
              (asked.includes(cert.id) ? (
                // As tall as the button it replaces, so the row keeps its height.
                <Badge variant="outline" className="h-control-sm self-start">
                  <CheckCircleIcon size={12} />
                  {copy.requested}
                </Badge>
              ) : (
                <AsyncButton
                  variant="outline"
                  size="sm"
                  className="self-start"
                  aria-label={copy.requestLabel(cert.name)}
                  pendingLabel={copy.requesting}
                  errorLabel={(error) => (error instanceof Error ? error.message : copy.failed)}
                  onAction={async () => {
                    await onRequest(cert)
                    setAsked((all) => [...all, cert.id])
                  }}
                >
                  {copy.requestReport}
                </AsyncButton>
              ))}
          </li>
        )
      })}
    </ul>
  )
}
