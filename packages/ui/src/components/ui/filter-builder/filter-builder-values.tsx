'use client'

import type { KeyboardEvent, Ref } from 'react'
import { useLocale } from '@youj/core'
import { cn, dateTimeFormat, numberFormat } from '../../../lib/utils'
import { Input } from '../input'
import { useFilterBuilder } from './filter-builder-context'
import { optionLabel, optionValue, takesNoValue, type FilterField, type FilterRule } from './filter-builder-model'
import { OptionList, Token } from './filter-builder-token'

/* A rule's value token and what it opens, matched to the field's type and the
 * operator: a menu of options for one choice, a checklist for several, a text,
 * number or date field (the browser's date input, so it follows the reader's
 * locale and keyboard) and two of them for `between`. Enter in a field closes
 * it. An operator without a value ("is empty") has no value token. */

interface ValueTokenProps {
  rule: FilterRule
  field: FilterField
  invalid: boolean
  describedBy?: string
  /** Files the token, so a refused Apply can focus it. */
  tokenRef: Ref<HTMLButtonElement>
}

const blank = (v: unknown) => v === null || v === undefined || v === ''

function ValueToken({ rule, field, invalid, describedBy, tokenRef }: ValueTokenProps) {
  const { labels, setOpen, changeValue } = useFilterBuilder()
  const locale = useLocale()
  const id = rule.id!
  const popup = `value:${id}`
  if (takesNoValue(rule.operator)) return null

  const options = (field.options ?? []).map((o) => ({ value: optionValue(o), label: optionLabel(o) }))
  const labelOf = (v: unknown) => options.find((o) => o.value === v)?.label ?? String(v)
  const date = (v: unknown) =>
    typeof v === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(v)
      ? dateTimeFormat(locale, { dateStyle: 'medium', timeZone: 'UTC' }).format(Date.parse(`${v}T00:00:00Z`))
      : String(v)
  const shown = (v: unknown) => (field.type === 'date' ? date(v) : typeof v === 'number' ? numberFormat(locale).format(v) : labelOf(v))
  const value = rule.value
  const list = rule.operator === 'isAnyOf' || rule.operator === 'hasAny' || rule.operator === 'hasAll'

  let text = ''
  if (Array.isArray(value)) {
    if (rule.operator === 'between')
      text = value.every(blank) ? '' : `${blank(value[0]) ? '…' : shown(value[0])} – ${blank(value[1]) ? '…' : shown(value[1])}`
    else text = value.map(shown).join(', ')
  } else if (!blank(value)) {
    text = rule.operator === 'inLast' ? `${value} ${labels.filterDays}` : shown(value)
  }

  const token = (content: React.ReactNode) => (
    <Token
      ref={tokenRef}
      popup={popup}
      name={labels.filterValue}
      spoken={text || undefined}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      content={content}
    >
      <span className={cn('max-w-56 truncate', !text && !invalid && 'own:text-fg-muted')}>{text || labels.filterValue}</span>
    </Token>
  )

  if (list || field.type === 'select') {
    const chosen = Array.isArray(value) ? value.map(String) : typeof value === 'string' && value ? [value] : []
    return token(
      <OptionList
        label={labels.filterValue}
        options={options}
        selected={chosen}
        multiple={list}
        onPick={(picked) => {
          if (!list) {
            changeValue(id, picked)
            return setOpen(null)
          }
          changeValue(id, chosen.includes(picked) ? chosen.filter((v) => v !== picked) : [...chosen, picked])
        }}
      />,
    )
  }

  const numeric = field.type === 'number' || rule.operator === 'inLast'
  const close = (event: KeyboardEvent) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    setOpen(null)
  }
  const input = (current: unknown, label: string, set: (next: string | number | null) => void) => (
    <Input
      type={numeric ? 'number' : field.type === 'date' ? 'date' : 'text'}
      inputMode={numeric ? 'decimal' : undefined}
      min={rule.operator === 'inLast' ? 0 : undefined}
      aria-label={label}
      autoComplete="off"
      value={blank(current) || Array.isArray(current) ? '' : String(current)}
      onChange={(event) => {
        const raw = event.target.value
        set(numeric ? (raw === '' ? null : Number(raw)) : raw)
      }}
      onKeyDown={close}
      className="h-control-sm w-40"
    />
  )

  if (rule.operator === 'between') {
    const pair = Array.isArray(value) ? value : [null, null]
    const setAt = (index: 0 | 1) => (next: string | number | null) => {
      const both = [...pair]
      both[index] = next === '' ? null : next
      changeValue(id, both)
    }
    return token(
      <div className="own:flex items-center own:gap-2">
        {input(pair[0], labels.filterValueFrom, setAt(0))}
        <span aria-hidden className="own:text-ui own:text-fg-muted">
          {labels.filterAnd.toLocaleLowerCase()}
        </span>
        {input(pair[1], labels.filterValueTo, setAt(1))}
      </div>,
    )
  }

  return token(
    <div className="own:flex items-center own:gap-2">
      {input(value, labels.filterValue, (next) => changeValue(id, next))}
      {rule.operator === 'inLast' && <span className="own:text-ui own:text-fg-muted">{labels.filterDays}</span>}
    </div>,
  )
}

export { ValueToken }
