'use client'

import { createContext, useContext } from 'react'
import { useLocale } from '@youj/core'
import { cn, numberFormat } from '../../../lib/utils'

/** How the commerce blocks write money: the currency and the locale that formats it. */
interface MoneyFormat {
  /** An ISO 4217 code. Default 'USD'. */
  currency: string
  /** A BCP 47 locale. Default: the app's (YoujProvider's `locale`), else en-US. */
  locale: string
}

/** Every price inside reads this; a block sets it from its `currency` and `locale` props. */
const MoneyContext = createContext<{ currency: string; locale?: string }>({ currency: 'USD' })

/** A block's money format: its props over the one around it. */
function useMoneyFormat(currency?: string, locale?: string): MoneyFormat {
  const around = useContext(MoneyContext)
  return { currency: currency ?? around.currency, locale: useLocale(locale ?? around.locale) }
}

const numberFormats = new Map<string, Intl.NumberFormat>()
/** A cached currency formatter (built once per format, not in every render). */
function moneyFormat({ currency, locale }: MoneyFormat, places?: number) {
  const key = `${locale}|${currency}|${places}`
  let format = numberFormats.get(key)
  if (!format) {
    format = numberFormat(locale, { style: 'currency', currency, minimumFractionDigits: places, maximumFractionDigits: places ?? 2 })
    numberFormats.set(key, format)
  }
  return format
}

/** An amount as text, whole when it's whole. */
function formatPrice(value: number, format: MoneyFormat) {
  return moneyFormat(format, value % 1 ? 2 : 0).format(value)
}

/** `formatPrice` in the money format around it. */
function useFormatPrice() {
  const format = useMoneyFormat()
  return (value: number) => formatPrice(value, format)
}

/** An amount with its currency sign muted. */
function Money({ value, digits }: { value: number; digits?: number }) {
  const format = useMoneyFormat()
  const places = digits ?? (value % 1 ? 2 : 0)
  return moneyFormat(format, places)
    .formatToParts(value)
    .map((part, i) => (part.type === 'currency' ? <span key={i} className="text-fg-muted">{part.value}</span> : part.value))
}

interface PriceProps {
  value: number
  compareAt?: number
  /** Read before a sale's old price. Default 'Was'. */
  wasLabel?: string
  /** Read before a sale's new price. Default 'now'. */
  nowLabel?: string
  size?: 'default' | 'lg'
  className?: string
}

/** A price in mono, a sale read as "was / now". */
function Price({ value, compareAt, wasLabel = 'Was', nowLabel = 'now', size = 'default', className }: PriceProps) {
  return (
    <p data-slot="price" className={cn('flex shrink-0 items-baseline gap-1.5 font-mono tabular-nums', size === 'lg' ? 'text-2xl tracking-tight' : 'text-ui', className)}>
      {compareAt && (
        <s className={cn('text-fg-muted decoration-line-strong', size === 'lg' ? 'text-ui-lg' : 'text-ui-sm')}>
          <span className="sr-only">{wasLabel} </span>
          <Money value={compareAt} />
        </s>
      )}
      <span className="font-medium text-fg">
        {compareAt && <span className="sr-only">{nowLabel} </span>}
        <Money value={value} />
      </span>
    </p>
  )
}

export { formatPrice, Money, MoneyContext, Price, useFormatPrice, useMoneyFormat }
export type { MoneyFormat, PriceProps }
