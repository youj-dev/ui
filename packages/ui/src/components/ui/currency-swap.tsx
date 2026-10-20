'use client'

import { useEffect, useId, useLayoutEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react'
import { animate, m } from 'motion/react'
import { NumberField as NumberFieldPrimitive } from '@base-ui/react/number-field'
import { MotionFeatures, useSoundCue } from '@youj/core'
import { useLocale, useYouj } from '@youj/core/lib/youj/provider'
import { Counter } from '@youj/motion'
import { useComponentLabels } from '@youj/core/labels'
import { currencySwapLabels } from '@youj/core/labels'
import { ArrowUpDownIcon } from '@youj/icons/components/youj/icons/arrow-up-down'
import { cn, numberFormat } from '../../lib/utils'
import { useControllableState } from '../../hooks/use-controllable-state'
import { useLiveRegion } from '../../hooks/use-announcer'
import { AsyncButton, type AsyncButtonProps } from './async-button'
import { Button } from './button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'

/* A converter card: what you pay (an amount field and its currency) over what
 * you receive (the converted amount and its currency), each with its value in
 * `currency` below, a round button between them that flips the two sides, the
 * rate, and the primary action. Crypto or plain money alike: an asset is a
 * symbol with a `price` (in `currency`), or the app passes `rate` or `convert`.
 *
 * Motion: the received amount rolls digit by digit (motion's Counter). A flip
 * sends each side's amount and currency gliding into the other's place while
 * the button's arrows turn half a circle, so the values visibly travel; the
 * amount you received becomes the amount you pay. Reduced motion: they swap at
 * once. The card never changes size: the pickers have a fixed width and long
 * figures truncate. */

interface CurrencySwapAsset {
  /** Stable id, used as the picker's value. */
  id: string
  /** Short code shown in the picker and after amounts: "BTC", "EUR". */
  symbol: string
  /** Full name, shown in the list: "Bitcoin", "Euro". */
  name: string
  /** A mark drawn before the symbol: a logo or a flag. Default: the symbol's first letter in a disc. */
  icon?: ReactNode
  /** One unit's price in `currency`. Drives the rate (from.price / to.price) and the value lines. */
  price?: number
  /** The most fraction digits its amounts show. Default: 4 for amounts of 1 or more, 4 significant digits below. */
  decimals?: number
}

interface CurrencySwapSubmit {
  from: CurrencySwapAsset
  to: CurrencySwapAsset
  /** The amount paid, in `from`. */
  amount: number
  /** The amount received, in `to`. */
  received: number
}

interface CurrencySwapProps extends Omit<ComponentProps<'div'>, 'onSubmit' | 'children'> {
  /** The currencies both pickers offer. At least two. */
  assets: CurrencySwapAsset[]
  /** The id of the currency paid with (controlled). */
  from?: string
  /** The starting currency paid with. Default: the first asset. */
  defaultFrom?: string
  onFromChange?: (id: string) => void
  /** The id of the currency received (controlled). */
  to?: string
  /** The starting currency received. Default: the second asset. */
  defaultTo?: string
  onToChange?: (id: string) => void
  /** The amount paid, in `from` (controlled). `null` is empty. */
  amount?: number | null
  defaultAmount?: number | null
  onAmountChange?: (amount: number | null) => void
  /**
   * How many `to` one `from` buys. A number is the quote for the current pair
   * (the app refreshes it when the pair changes); a function is asked per pair.
   * Default: from the assets' prices.
   */
  rate?: number | ((from: CurrencySwapAsset, to: CurrencySwapAsset) => number | undefined)
  /** The received amount, for conversions a rate can't express (fees, slippage). Wins over `rate` for the amount; the rate line still reads `rate`. */
  convert?: (amount: number, from: CurrencySwapAsset, to: CurrencySwapAsset) => number | undefined
  /** The currency the value lines are in (ISO 4217). Default `USD`. */
  currency?: string
  /** Fires on a flip, with the new pair. */
  onSwap?: (pair: { from: string; to: string }) => void
  /**
   * The primary action, awaited as an AsyncButton's `onAction`: resolve for
   * success, reject or throw for an error. Without it there is no action button.
   */
  onSubmit?: (swap: CurrencySwapSubmit) => unknown
  /** The action's label. Default "Swap". */
  submitLabel?: ReactNode
  /** Shown while `onSubmit` runs, and announced. */
  pendingLabel?: AsyncButtonProps['pendingLabel']
  /** Shown once `onSubmit` resolves, and announced. */
  successLabel?: AsyncButtonProps['successLabel']
  /** Shown when `onSubmit` rejects, and announced assertively. */
  errorLabel?: AsyncButtonProps['errorLabel']
  /** Default: the YoujProvider locale. */
  locale?: string
  disabled?: boolean
  /** With sound on (`YoujProvider`’s `sound`), a flip sounds `tap` and a new currency `select`; the action sounds as an AsyncButton does. `false` keeps it silent. Default true. */
  sound?: boolean
}

/** Format options for an amount: its asset's `decimals`, else 4 fraction digits (4 significant below 1). */
function amountOptions(value: number, decimals?: number): Intl.NumberFormatOptions {
  if (decimals !== undefined) return { maximumFractionDigits: decimals }
  return Math.abs(value) >= 1 || value === 0 ? { maximumFractionDigits: 4 } : { maximumSignificantDigits: 4 }
}

/** The rate's format: 2 fraction digits from 1 up, 4 significant below. */
function rateOptions(value: number): Intl.NumberFormatOptions {
  return Math.abs(value) >= 1 ? { maximumFractionDigits: 2 } : { maximumSignificantDigits: 4 }
}

/** Rounds to what the amount shows, so a flipped amount is the figure that was on screen. */
function shown(value: number, decimals?: number) {
  const options = amountOptions(value, decimals)
  if (options.maximumSignificantDigits) return Number(value.toPrecision(options.maximumSignificantDigits))
  return Number(value.toFixed(options.maximumFractionDigits))
}

function AssetMark({ asset }: { asset: CurrencySwapAsset }) {
  return (
    <span
      aria-hidden
      data-slot="currency-swap-mark"
      className="own:flex size-5 shrink-0 items-center justify-center overflow-hidden own:rounded-full own:bg-band own:text-ui-xs own:font-semibold own:text-fg-muted [&>img]:size-full [&>svg]:size-full"
    >
      {asset.icon ?? asset.symbol.slice(0, 1)}
    </span>
  )
}

function AssetPicker({
  assets,
  value,
  onValueChange,
  label,
  disabled,
}: {
  assets: CurrencySwapAsset[]
  value: string
  onValueChange: (id: string) => void
  label: string
  disabled?: boolean
}) {
  const items = Object.fromEntries(assets.map((asset) => [asset.id, asset.symbol]))
  return (
    <Select items={items} value={value} onValueChange={(next) => next !== null && onValueChange(next as string)} disabled={disabled}>
      <SelectTrigger variant="ghost" aria-label={label} data-slot="currency-swap-picker" className="w-28 shrink-0 own:shadow-none">
        <SelectValue>
          {(id: string) => {
            const asset = assets.find((a) => a.id === id)
            return asset ? (
              <>
                <AssetMark asset={asset} />
                <span className="truncate own:font-medium">{asset.symbol}</span>
              </>
            ) : null
          }}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="w-auto min-w-(--anchor-width)">
        {assets.map((asset) => (
          <SelectItem key={asset.id} value={asset.id}>
            <AssetMark asset={asset} />
            <span className="own:font-medium">{asset.symbol}</span>
            <span className="truncate own:text-fg-muted">{asset.name}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function CurrencySwap({
  assets,
  from: fromProp,
  defaultFrom,
  onFromChange,
  to: toProp,
  defaultTo,
  onToChange,
  amount: amountProp,
  defaultAmount = null,
  onAmountChange,
  rate,
  convert,
  currency = 'USD',
  onSwap,
  onSubmit,
  submitLabel,
  pendingLabel,
  successLabel,
  errorLabel,
  locale,
  disabled = false,
  sound = true,
  className,
  ...props
}: CurrencySwapProps) {
  const k = useYouj()
  const lang = useLocale(locale)
  const labels = useComponentLabels(currencySwapLabels)
  const cue = useSoundCue()
  const id = useId()
  const [fromId, setFromId] = useControllableState(fromProp, defaultFrom ?? assets[0]?.id ?? '')
  const [toId, setToId] = useControllableState(toProp, defaultTo ?? assets[1]?.id ?? assets[0]?.id ?? '')
  const [amount, setAmount] = useControllableState<number | null>(amountProp, defaultAmount)
  const [flips, setFlips] = useState(0)
  const payContent = useRef<HTMLDivElement>(null)
  const receiveContent = useRef<HTMLDivElement>(null)
  const { politeRef, announce } = useLiveRegion()

  const from = assets.find((a) => a.id === fromId) ?? assets[0]
  const to = assets.find((a) => a.id === toId) ?? assets[1] ?? assets[0]
  const pairRate = !from || !to ? undefined : typeof rate === 'number' ? rate : typeof rate === 'function' ? rate(from, to) : from.price && to.price ? from.price / to.price : undefined
  const received = amount === null || !from || !to ? null : convert ? (convert(amount, from, to) ?? null) : pairRate === undefined ? null : amount * pairRate
  const fiat = (value: number | null, asset?: CurrencySwapAsset) =>
    value === null || asset?.price === undefined ? undefined : numberFormat(lang, { style: 'currency', currency }).format(value * asset.price)
  const withSymbol = (value: number, asset: CurrencySwapAsset, options: Intl.NumberFormatOptions) => `${numberFormat(lang, options).format(value)} ${asset.symbol}`
  const receivedText = received === null || !to ? '' : withSymbol(received, to, amountOptions(received, to.decimals))

  const setPair = (nextFrom: string, nextTo: string) => {
    if (nextFrom !== fromId) {
      setFromId(nextFrom)
      onFromChange?.(nextFrom)
    }
    if (nextTo !== toId) {
      setToId(nextTo)
      onToChange?.(nextTo)
    }
  }
  const changeAmount = (next: number | null) => {
    setAmount(next)
    onAmountChange?.(next)
  }

  // A flip: the pair trades places and the amount received becomes the amount paid.
  const flip = () => {
    setPair(toId, fromId)
    if (received !== null) changeAmount(shown(received, to?.decimals))
    setFlips((n) => n + 1)
    onSwap?.({ from: toId, to: fromId })
    if (sound) cue('tap')
  }
  // Picking the currency the other side holds flips the pair instead of matching them.
  const pick = (side: 'from' | 'to', next: string) => {
    if ((side === 'from' ? toId : fromId) === next) return flip()
    if (side === 'from') setPair(next, toId)
    else setPair(fromId, next)
    if (sound) cue('select')
  }

  // Each side's content glides from the other side's place, crossing over the button.
  // biome-ignore lint/correctness/useExhaustiveDependencies: runs once per flip
  useLayoutEffect(() => {
    const pay = payContent.current
    const receive = receiveContent.current
    if (flips === 0 || k.reduced || !pay || !receive) return
    const distance = receive.getBoundingClientRect().top - pay.getBoundingClientRect().top
    const transition = k.spring('snappy')
    const runs = [
      animate(pay, { y: [distance, 0], scale: [0.96, 1] }, transition),
      animate(receive, { y: [-distance, 0], scale: [0.96, 1] }, transition),
    ]
    return () => runs.forEach((run) => run.stop())
    // eslint-disable-next-line react-hooks/exhaustive-deps -- runs once per flip
  }, [flips])

  // The result is announced once the figure rests, not on every keystroke.
  const announced = useRef(receivedText)
  // biome-ignore lint/correctness/useExhaustiveDependencies: announces only when the result's text changes
  useEffect(() => {
    if (announced.current === receivedText) return
    announced.current = receivedText
    if (receivedText) announce(labels.currencySwapResult(receivedText), { delay: k.ms('deliberate') })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- announces only when the result's text changes
  }, [receivedText])

  if (!from || !to) return null
  const payFiat = fiat(amount, from)
  const receiveFiat = fiat(received, to)
  const rateText = pairRate === undefined ? '' : labels.currencySwapRate(withSymbol(1, from, { maximumFractionDigits: 0 }), withSymbol(pairRate, to, rateOptions(pairRate)))
  const panel = 'own:flex flex-col gap-1.5 own:rounded-lg own:border own:border-transparent own:bg-well own:px-4 own:py-3.5'
  const caption = 'own:text-ui-sm own:text-fg-muted'
  const figure = 'min-w-0 flex-1 truncate own:text-2xl own:font-medium own:tabular-nums own:text-fg'
  const valueLine = 'h-4 truncate own:text-ui-sm own:tabular-nums own:text-fg-muted'

  return (
    <MotionFeatures>
      <div
        {...props}
        data-slot="currency-swap"
        data-disabled={disabled ? '' : undefined}
        className={cn('own:flex w-full max-w-sm flex-col gap-3 own:rounded-xl own:border own:border-line own:bg-surface own:p-2 own:text-fg', className)}
      >
        <div className="relative own:flex flex-col gap-1">
          <div
            data-slot="currency-swap-pay"
            className={cn(panel, 'own:has-[[data-slot=currency-swap-amount]:focus-visible]:border-focus')}
          >
            <label htmlFor={`${id}-amount`} className={caption}>
              {labels.currencySwapPay}
            </label>
            <div ref={payContent} className="own:flex flex-col gap-1.5">
              <div className="own:flex items-center gap-3">
                <NumberFieldPrimitive.Root
                  id={`${id}-amount`}
                  value={amount}
                  onValueChange={(next) => changeAmount(next)}
                  min={0}
                  format={{ maximumFractionDigits: from.decimals ?? 8 }}
                  locale={lang}
                  disabled={disabled}
                  className="min-w-0 flex-1"
                >
                  <NumberFieldPrimitive.Input
                    data-slot="currency-swap-amount"
                    placeholder={numberFormat(lang).format(0)}
                    className={cn(figure, 'w-full own:bg-transparent outline-none own:placeholder:text-fg-subtle disabled:cursor-not-allowed')}
                  />
                </NumberFieldPrimitive.Root>
                <AssetPicker assets={assets} value={from.id} onValueChange={(next) => pick('from', next)} label={labels.currencySwapFromAsset} disabled={disabled} />
              </div>
              <p data-slot="currency-swap-value" className={valueLine}>
                {payFiat ? `≈ ${payFiat}` : ' '}
              </p>
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-0 top-1/2 z-10 own:flex -translate-y-1/2 justify-center">
            <Button
              variant="outline"
              size="icon-sm"
              aria-label={labels.currencySwapFlip}
              data-slot="currency-swap-flip"
              disabled={disabled}
              sound={false}
              onClick={flip}
              className="pointer-events-auto own:bg-surface own:ring-4 ring-surface"
            >
              <m.span className="flex" animate={{ rotate: flips * 180 }} transition={k.spring('snappy')}>
                <ArrowUpDownIcon trigger="none" />
              </m.span>
            </Button>
          </div>

          <div data-slot="currency-swap-receive" className={panel}>
            <span id={`${id}-receive`} className={caption}>
              {labels.currencySwapReceive}
            </span>
            <div ref={receiveContent} className="own:flex flex-col gap-1.5">
              <div className="own:flex items-center gap-3">
                <output aria-labelledby={`${id}-receive`} data-slot="currency-swap-received" className={cn(figure, 'own:flex items-center')}>
                  {received === null ? (
                    <span className="own:text-fg-subtle">{numberFormat(lang).format(0)}</span>
                  ) : (
                    <Counter key={flips} mode="roll" value={received} from={received} format={amountOptions(received, to.decimals)} locale={lang} inView={false} className="own:[font-family:inherit] own:[letter-spacing:inherit]" />
                  )}
                </output>
                <AssetPicker assets={assets} value={to.id} onValueChange={(next) => pick('to', next)} label={labels.currencySwapToAsset} disabled={disabled} />
              </div>
              <p data-slot="currency-swap-value" className={valueLine}>
                {receiveFiat ? `≈ ${receiveFiat}` : ' '}
              </p>
            </div>
          </div>
        </div>

        <p data-slot="currency-swap-rate" className="h-4 truncate own:px-2 own:text-ui-sm own:tabular-nums own:text-fg-muted">
          {rateText || ' '}
        </p>

        {onSubmit && (
          <AsyncButton
            size="lg"
            data-slot="currency-swap-submit"
            className="w-full"
            disabled={disabled || !amount || received === null}
            sound={sound}
            pendingLabel={pendingLabel}
            successLabel={successLabel}
            errorLabel={errorLabel}
            onAction={() => onSubmit({ from, to, amount: amount ?? 0, received: received ?? 0 })}
          >
            {submitLabel ?? labels.currencySwapSubmit}
          </AsyncButton>
        )}

        <div ref={politeRef} role="status" data-slot="currency-swap-announcer" className="sr-only" />
      </div>
    </MotionFeatures>
  )
}

export { CurrencySwap, type CurrencySwapProps, type CurrencySwapAsset, type CurrencySwapSubmit }
