'use client'

import { useContext, type ReactNode } from 'react'
import type { Row, RowData } from '@tanstack/react-table'
import { safeLink } from '../../../lib/safe-href'
import { GridEnvContext, IdentityCell, StatusCell, TagsCell } from './cells'
import { asPeople, compare, text, toOptions, type Accessor, type DataGridStatusOptions, type MakeColumn, type Options, type ValueOf } from './column-kit'
import { useCopy } from './copy'
import { toTime } from './format'
import type { DataGridFeatures, DataGridOption } from './model'
import { BooleanCell, DateCell, IdCell, LinkCell, PeopleCell } from './values'

/** The column types for what a record is: who or what it names, its status, tags, dates, people, flags, ids, links and text. */
export function recordColumns<TData extends RowData>(make: MakeColumn<TData>) {
  return {
    /** An avatar or logo, a name and a second line. The first identity column is pinned and titles the cards. */
    identity<A extends Accessor<TData>>(
      accessor: A,
      options: Options<
        TData,
        ValueOf<TData, A>,
        {
          /** The line under the name: a domain, an email, a role. */
          secondary?: (row: TData) => ReactNode
          /** An image URL for the avatar. Without one, initials. */
          src?: (row: TData) => string | undefined
          /** `square` for companies and products (a logo), `circle` for people. Default circle. */
          shape?: 'circle' | 'square'
          /** Replaces the avatar: an icon, a flag. */
          leading?: (row: TData) => ReactNode
        }
      > = {},
    ) {
      const { secondary, src, shape, leading, ...rest } = options
      return make(accessor, rest, {
        size: 260,
        minSize: 180,
        meta: { kind: 'identity', skeleton: 'identity', card: 'title', searchText: text },
        sortFn: (a, b, id) => text(a.getValue(id)).localeCompare(text(b.getValue(id))),
        cell: (value, row) => (
          <IdentityCell
            name={text(value)}
            secondary={secondary?.(row.original)}
            src={src?.(row.original)}
            shape={shape}
            leading={leading?.(row.original)}
          />
        ),
      })
    },

    /** A status as a badge with a dot. Filters, groups and sorts in the options' order. */
    status<A extends Accessor<TData>>(accessor: A, options: Options<TData, ValueOf<TData, A>, { options: DataGridStatusOptions }>) {
      const { options: statusOptions, ...rest } = options
      const list = toOptions(statusOptions)
      const byValue = new Map(list.map((option) => [option.value, option]))
      const order = (value: unknown) => {
        const index = list.findIndex((option) => option.value === text(value))
        return index === -1 ? list.length : index
      }
      return make(accessor, rest, {
        size: 140,
        minSize: 110,
        meta: {
          kind: 'status',
          skeleton: 'badge',
          card: 'badge',
          groupable: true,
          groupLabel: (key) => <StatusCell option={byValue.get(key)} />,
          groupOrder: (a, b) => order(a) - order(b),
          facet: { options: list, keys: (value) => [text(value)] },
          searchText: (value) => byValue.get(text(value))?.label ?? text(value),
        },
        sortFn: (a, b, id) => order(a.getValue(id)) - order(b.getValue(id)),
        cell: (value) => <StatusCell option={byValue.get(text(value)) ?? (text(value) ? { value: text(value), label: text(value) } : undefined)} />,
      })
    },

    /** A list of tags: as many as fit (at most `max`, default 3), then "+N" with the rest on hover. Filters by any tag. */
    tags<A extends Accessor<TData>>(
      accessor: A,
      options: Options<TData, ValueOf<TData, A>, { options?: DataGridStatusOptions; max?: number }> = {},
    ) {
      const { options: tagOptions, max = 3, ...rest } = options
      const list = toOptions(tagOptions)
      const byValue = new Map(list.map((option) => [option.value, option]))
      const resolve = (value: unknown): DataGridOption[] =>
        (Array.isArray(value) ? value : []).map((tag) => byValue.get(text(tag)) ?? { value: text(tag), label: text(tag) })
      return make(accessor, rest, {
        size: 200,
        // Room for one whole tag and its "+N", even in a wide mono face, so a tag is never cut to a stub.
        minSize: 170,
        enableSorting: false,
        meta: {
          kind: 'tags',
          skeleton: 'tags',
          card: 'field',
          facet: { options: list.length ? list : undefined, keys: (value) => resolve(value).map((tag) => tag.value) },
          searchText: (value) => resolve(value).map((tag) => tag.label).join(' '),
        },
        cell: (value) => <TagsCell tags={resolve(value)} max={max} />,
      })
    },

    /** A moment, relative to now ("3 days ago", "in 2 weeks"), with the exact date and time on hover. */
    date<A extends Accessor<TData>>(accessor: A, options: Options<TData, ValueOf<TData, A>> = {}) {
      return make(accessor, options, {
        size: 130,
        minSize: 100,
        meta: { kind: 'date', skeleton: 'text', card: 'field' },
        sortFn: (a, b, id) => compare(toTime(a.getValue(id)) ?? 0, toTime(b.getValue(id)) ?? 0),
        cell: (value) => <DateCell time={toTime(value)} />,
      })
    },

    /** People as overlapping avatars, the first `max` (default 3) and "+N", names on hover. Filters by person. */
    people<A extends Accessor<TData>>(accessor: A, options: Options<TData, ValueOf<TData, A>, { max?: number }> = {}) {
      const { max = 3, ...rest } = options
      return make(accessor, rest, {
        size: 130,
        minSize: 96,
        meta: {
          kind: 'people',
          skeleton: 'people',
          card: 'field',
          facet: {
            keys: (value) => asPeople(value).map((person) => person.id),
            describe: (key, value) => {
              const person = asPeople(value).find((p) => p.id === key)
              return person && { value: person.id, label: person.name, src: person.src }
            },
          },
          searchText: (value) => asPeople(value).map((person) => person.name).join(' '),
        },
        sortFn: (a, b, id) => (asPeople(a.getValue(id))[0]?.name ?? '').localeCompare(asPeople(b.getValue(id))[0]?.name ?? ''),
        cell: (value) => <PeopleCell people={asPeople(value)} max={max} />,
      })
    },

    /** Yes or no: a switch when `onToggle` is given (you update the row), else a quiet check or dash. */
    boolean<A extends Accessor<TData>>(
      accessor: A,
      options: Options<TData, ValueOf<TData, A>, { onToggle?: (row: TData, value: boolean) => void }> = {},
    ) {
      const { onToggle, ...rest } = options
      return make(accessor, rest, {
        size: 100,
        minSize: 72,
        meta: { kind: 'boolean', skeleton: 'toggle', card: 'field', align: 'center' },
        sortFn: (a, b, id) => Number(Boolean(a.getValue(id))) - Number(Boolean(b.getValue(id))),
        cell: (value, row, column) => <BooleanValue row={row} column={column} value={Boolean(value)} onToggle={onToggle} />,
      })
    },

    /** An id in mono, with a copy button that answers. */
    id<A extends Accessor<TData>>(accessor: A, options: Options<TData, ValueOf<TData, A>, { copy?: boolean }> = {}) {
      const { copy = true, ...rest } = options
      return make(accessor, rest, {
        size: 150,
        minSize: 110,
        meta: { kind: 'id', skeleton: 'text', card: 'field', searchText: text },
        sortFn: (a, b, id) => text(a.getValue(id)).localeCompare(text(b.getValue(id)), undefined, { numeric: true }),
        cell: (value) => <IdCell value={text(value)} copy={copy} />,
      })
    },

    /** A link; `href` builds it from the row. External links open in a new tab and say so with an arrow. */
    link<A extends Accessor<TData>>(
      accessor: A,
      options: Options<TData, ValueOf<TData, A>, { href: (row: TData) => string; external?: boolean }>,
    ) {
      const { href, external, ...rest } = options
      return make(accessor, rest, {
        size: 180,
        minSize: 120,
        meta: { kind: 'link', skeleton: 'text', card: 'field', searchText: text },
        sortFn: (a, b, id) => text(a.getValue(id)).localeCompare(text(b.getValue(id))),
        cell: (value, row) => {
          const url = safeLink(href(row.original)) ?? ''
          return <LinkCell href={url} label={text(value)} external={external ?? /^https?:/.test(url)} />
        },
      })
    },

    /** Plain text, truncated. `groupable` lets rows be grouped by it, `facet` filters by its values. */
    text<A extends Accessor<TData>>(
      accessor: A,
      options: Options<TData, ValueOf<TData, A>, { groupable?: boolean; facet?: boolean; muted?: boolean }> = {},
    ) {
      const { groupable, facet, muted, ...rest } = options
      return make(accessor, rest, {
        size: 160,
        minSize: 80,
        meta: {
          kind: 'text',
          skeleton: 'text',
          card: 'field',
          groupable,
          searchText: text,
          ...(facet && { facet: { keys: (value: unknown) => (text(value) ? [text(value)] : []) } }),
        },
        sortFn: (a, b, id) => text(a.getValue(id)).localeCompare(text(b.getValue(id))),
        cell: (value) => <span className={muted ? 'truncate own:text-fg-muted' : 'truncate'}>{text(value) || '—'}</span>,
      })
    },
  }
}

function BooleanValue<TData extends RowData>({
  row,
  column,
  value,
  onToggle,
}: {
  row: Row<DataGridFeatures, TData>
  column: string
  value: boolean
  onToggle?: (row: TData, value: boolean) => void
}) {
  const { rowLabel } = useContext(GridEnvContext)
  const labels = useCopy()
  const label = labels.cellOf(column, rowLabel(row.id))
  return <BooleanCell value={value} label={label} onChange={onToggle && ((next) => onToggle(row.original, next))} />
}
