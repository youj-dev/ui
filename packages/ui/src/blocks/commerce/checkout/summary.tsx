'use client'

import { useEffect, useRef, type ElementType } from 'react'
import { Stagger } from '@youj/motion'
import { CheckCircleIcon, PackageIcon } from '@youj/icons'
import { buttonVariants } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Separator } from '../../../components/ui/separator'
import { Eyebrow } from '../../../components/ui/typography'
import { colorName, Money, ProductMedia, useFormatPrice } from '../product-card'
import type { CheckoutCopy, CheckoutLine, CheckoutShippingOption } from './data'

interface Figures {
  subtotal: number
  tax: number
  total: number
}

/** The lines and the figures, beside the form. */
function Summary({ copy, lines, option, figures }: { copy: CheckoutCopy; lines: CheckoutLine[]; option: CheckoutShippingOption; figures: Figures }) {
  const price = useFormatPrice()
  return (
    <Card className="lg:sticky lg:top-6">
      <CardHeader>
        <CardTitle>
          <h2>{copy.summary}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-col gap-3">
          {lines.map((line) => (
            <li key={`${line.product.id}-${line.color}-${line.size ?? ''}`} className="flex items-center gap-3">
              <div className="relative size-14 shrink-0 overflow-hidden rounded-lg border border-line">
                <ProductMedia product={line.product} color={line.color} />
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-ui font-medium text-fg">{line.product.name}</span>
                <span className="truncate text-ui-sm text-fg-muted">
                  {[colorName(line.product, line.color), line.size, copy.quantity(line.quantity)].filter(Boolean).join(' · ')}
                </span>
              </div>
              <span className="font-mono text-ui text-fg tabular-nums">
                <Money value={line.product.price * line.quantity} />
              </span>
            </li>
          ))}
        </ul>
        <Separator />
        <dl className="grid grid-cols-[1fr_auto] gap-y-2 text-ui">
          <Eyebrow render={<dt />} className="self-center text-ui text-fg-muted">
            {copy.subtotal}
          </Eyebrow>
          <dd className="text-end tabular-nums">{price(figures.subtotal)}</dd>
          <Eyebrow render={<dt />} className="self-center text-ui text-fg-muted">
            {copy.shipping}
          </Eyebrow>
          {option.price ? <dd className="text-end tabular-nums">{price(option.price)}</dd> : <dd className="text-end text-success-text">{copy.free}</dd>}
          <Eyebrow render={<dt />} className="self-center text-ui text-fg-muted">
            {copy.tax}
          </Eyebrow>
          <dd className="text-end tabular-nums">{price(figures.tax)}</dd>
          <Eyebrow render={<dt />} className="self-center pt-2 text-ui font-medium text-fg">
            {copy.total}
          </Eyebrow>
          <dd className="pt-2 text-end text-ui-lg font-semibold tabular-nums">{price(figures.total)}</dd>
        </dl>
      </CardContent>
    </Card>
  )
}

interface ConfirmedProps {
  copy: CheckoutCopy
  email: string
  orderNumber: string
  total: number
  shopHref: string
  linkComponent: ElementType
}

/** The order went through: a check that draws itself, then the receipt rising in beneath it. Focus lands on the heading. */
function Confirmed({ copy, email, orderNumber, total, shopHref, linkComponent: Link }: ConfirmedProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const price = useFormatPrice()
  useEffect(() => heading.current?.focus(), [])
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-6 py-10 text-center">
      <span className="grid size-20 place-items-center rounded-full bg-success-subtle text-success">
        <CheckCircleIcon size={44} strokeWidth={1.75} trigger="mount" />
      </span>
      <Stagger inView={false} delay={4} variant="rise" className="flex w-full flex-col gap-4" itemClassName="w-full">
        <h2 ref={heading} tabIndex={-1} className="text-3xl font-semibold tracking-tight text-fg outline-none">
          {copy.confirmedTitle}
        </h2>
        <p className="text-ui-lg text-fg-muted">
          {copy.receiptBefore}
          <span className="font-medium text-fg">{email}</span>
          {copy.receiptAfter}
        </p>
        <dl className="grid w-full grid-cols-2 gap-3 rounded-xl border border-line bg-surface p-4 text-start">
          <div>
            <Eyebrow render={<dt />} className="text-ui-sm text-fg-muted">
              {copy.order}
            </Eyebrow>
            <dd className="font-mono text-ui font-medium text-fg">{orderNumber}</dd>
          </div>
          <div>
            <Eyebrow render={<dt />} className="text-ui-sm text-fg-muted">
              {copy.totalPaid}
            </Eyebrow>
            <dd className="text-ui font-medium text-fg tabular-nums">{price(total)}</dd>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-ui-sm text-fg-muted">
            <PackageIcon size={16} /> {copy.arrives}
          </div>
        </dl>
        <Link href={shopHref} className={buttonVariants({ size: 'lg', variant: 'outline' })}>
          {copy.continueShopping}
        </Link>
      </Stagger>
    </div>
  )
}

export { Confirmed, Summary }
