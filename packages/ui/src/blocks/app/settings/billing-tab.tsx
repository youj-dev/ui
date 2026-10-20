'use client'

import { useState } from 'react'
import { SpotlightGroup } from '@youj/motion'
import { CheckIcon, CreditCardIcon, DownloadIcon } from '@youj/icons'
import { Badge } from '../../../components/ui/badge'
import { Button } from '../../../components/ui/button'
import { AsyncButton } from '../../../components/ui/async-button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table'
import { Skeleton } from '../../../components/ui/skeleton'
import { demo, type SettingsCopy, type SettingsInvoice, type SettingsPaymentMethod, type SettingsPlan } from './data'
import { Section } from './section'

export interface BillingTabProps {
  copy: SettingsCopy
  plans: SettingsPlan[]
  plan?: string
  defaultPlan: string
  onChangePlan?: (plan: SettingsPlan) => Promise<unknown> | unknown
  onContactSales?: (plan: SettingsPlan) => void
  paymentMethod?: SettingsPaymentMethod | null
  onUpdatePayment?: () => void
  invoices: SettingsInvoice[]
  onDownloadInvoice?: (invoice: SettingsInvoice) => void
  loading?: boolean
}

const STATUS_TONE = { paid: 'success', failed: 'danger', open: 'secondary', refunded: 'secondary' } as const

export function BillingTab({ copy, plans, plan: planProp, defaultPlan, onChangePlan, onContactSales, paymentMethod, onUpdatePayment, invoices, onDownloadInvoice, loading }: BillingTabProps) {
  const [inner, setPlan] = useState(defaultPlan)
  const plan = planProp ?? inner
  const currentIndex = plans.findIndex((p) => p.id === plan)
  return (
    // A container, so the plans sit three across only when the panel (not the window) has room for them.
    <div className="@container flex flex-col gap-4">
      <SpotlightGroup className="grid gap-3 @2xl:grid-cols-3">
        {plans.map((p, index) => {
          const current = p.id === plan
          return (
            <Card key={p.id} spotlight size="sm" className={current ? 'border-accent-line' : undefined} aria-current={current || undefined}>
              <CardHeader>
                <CardTitle>{p.name}</CardTitle>
                <CardDescription>{p.blurb}</CardDescription>
                {current && (
                  <CardAction>
                    <Badge>{copy.currentPlan}</Badge>
                  </CardAction>
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <p className="text-ui-sm text-fg-muted">
                  <span className="text-2xl font-semibold tracking-tight text-fg">{p.price}</span>
                  {p.perMember && copy.perMember}
                </p>
                <ul className="flex flex-col gap-1.5 text-ui">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <CheckIcon size={14} strokeWidth={2.25} className="shrink-0 text-success" />
                      {f}
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  {current ? (
                    <Button variant="outline" className="w-full" disabled>
                      {copy.yourPlan}
                    </Button>
                  ) : p.contactSales ? (
                    <Button variant="outline" className="w-full" onClick={() => onContactSales?.(p)}>
                      {copy.talkToSales}
                    </Button>
                  ) : (
                    <AsyncButton
                      className="w-full"
                      variant={index < currentIndex ? 'outline' : 'default'}
                      pendingLabel={copy.switching}
                      successLabel={copy.switched}
                      onAction={async () => {
                        await (onChangePlan ? onChangePlan(p) : demo('Settings: onChangePlan', 900))
                        setPlan(p.id)
                      }}
                    >
                      {index < currentIndex ? copy.downgrade : copy.upgrade}
                    </AsyncButton>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </SpotlightGroup>
      <Section title={copy.paymentTitle} description={copy.paymentDescription}>
        <div className="flex flex-wrap items-center gap-3">
          <span aria-hidden className="grid size-10 place-items-center rounded-md border border-line bg-band">
            <CreditCardIcon size={18} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col">
            {paymentMethod ? (
              <>
                <span className="font-medium text-fg">{copy.cardEnding(paymentMethod.brand, paymentMethod.last4)}</span>
                <span className="text-ui-sm text-fg-muted">{copy.cardExpires(paymentMethod.expires)}</span>
              </>
            ) : (
              <span className="text-fg-muted">{copy.noPaymentMethod}</span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onUpdatePayment}>
            {copy.updatePayment}
          </Button>
        </div>
      </Section>
      <Card>
        <CardHeader>
          <CardTitle>{copy.invoicesTitle}</CardTitle>
          <CardDescription>{copy.invoicesDescription}</CardDescription>
        </CardHeader>
        <CardContent className="px-0" aria-busy={loading || undefined}>
          {!loading && invoices.length === 0 ? (
            <p className="px-5 py-6 text-center text-ui text-fg-muted">{copy.emptyInvoices}</p>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="ps-5">{copy.invoiceColumn}</TableHead>
                <TableHead>{copy.dateColumn}</TableHead>
                <TableHead className="text-end">{copy.amountColumn}</TableHead>
                <TableHead>{copy.statusColumn}</TableHead>
                <TableHead className="pe-5">
                  <span className="sr-only">{copy.downloadColumn}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? [0, 1, 2].map((i) => (
                    <TableRow key={i}>
                      <TableCell className="ps-5" colSpan={5}>
                        <Skeleton className="h-4 w-full" />
                      </TableCell>
                    </TableRow>
                  ))
                : invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="ps-5 font-medium">{inv.id}</TableCell>
                  <TableCell className="text-fg-muted">{inv.date}</TableCell>
                  <TableCell className="text-end tabular-nums">{inv.amount}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_TONE[inv.status]}>{copy.invoiceStatus[inv.status]}</Badge>
                  </TableCell>
                  <TableCell className="pe-5 text-end">
                    <Button variant="ghost" size="icon-sm" aria-label={copy.downloadInvoice(inv.id)} data-yj-trigger="" onClick={() => onDownloadInvoice?.(inv)}>
                      <DownloadIcon size={16} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
