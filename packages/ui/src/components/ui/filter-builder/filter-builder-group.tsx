'use client'

import { useId, type KeyboardEvent } from 'react'
import { EllipsisIcon } from '@youj/icons/components/youj/icons/ellipsis'
import { PlusIcon } from '@youj/icons/components/youj/icons/plus'
import { XIcon } from '@youj/icons/components/youj/icons/x'
import { PresenceItem, PresenceList } from '@youj/motion'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../dropdown-menu'
import { useFilterBuilder } from './filter-builder-context'
import { operatorLabel, operatorsFor, type FilterGroup, type FilterRule } from './filter-builder-model'
import { OptionList, Token } from './filter-builder-token'
import { ValueToken } from './filter-builder-values'

/* The rows of a builder. Every row starts in one fixed column, the
 * connector: "Where" on a group's first row, then the group's and/or. The
 * first and/or is a token that switches the group between the two; the rest
 * repeat its word. A rule is its tokens as one unit ("Stage" "is not"
 * "Lost") with a remove button after it that shows on hover or focus;
 * Delete or Backspace on any of its tokens removes it too. A nested group
 * hangs off a thin guide line, with the same rows and its own connector
 * column, and ends with its Add filter row and a menu (duplicate, ungroup,
 * remove). Groups nest as many levels as `maxDepth` allows. */

/** The connector column, its word (inset like a token's, so a static word and the and/or token line up), and the indent that lines Add filter up with the rules. */
const connectorClass = 'own:flex w-16 shrink-0'
const wordClass = 'own:inline-flex h-control-sm items-center own:px-2 own:text-ui own:text-fg-muted'
const ruleColumnClass = 'own:ps-18'

function Connector({ group, index }: { group: FilterGroup; index: number }) {
  const { labels, disabled, setCombinator } = useFilterBuilder()
  const word = (group.combinator === 'or' ? labels.filterOr : labels.filterAnd).toLocaleLowerCase()
  if (index === 0)
    return (
      <span className={connectorClass}>
        <span className={wordClass}>{labels.filterWhere}</span>
      </span>
    )
  if (index > 1)
    return (
      <span className={connectorClass}>
        <span className={wordClass}>{word}</span>
      </span>
    )
  return (
    <span className={connectorClass}>
      <button
        type="button"
        disabled={disabled}
        data-slot="filter-combinator"
        aria-label={`${labels.filterCombinator}: ${word}`}
        onClick={() => setCombinator(group.id!, group.combinator === 'or' ? 'and' : 'or')}
        className={cn(
          wordClass,
          'own:rounded-control-sm own:bg-band own:text-fg transition-[background-color] yj-duration-fast ease-standard own:hover:bg-selected focus-ring disabled:pointer-events-none disabled:opacity-50',
        )}
      >
        {word}
      </button>
    </span>
  )
}

function RuleRow({ rule, position }: { rule: FilterRule; position: number }) {
  const { fields, labels, disabled, flagged, touch, register, setOpen, remove, changeField, changeOperator } = useFilterBuilder()
  const field = fields.find((f) => f.id === rule.field)
  const invalid = flagged(rule)
  const messageId = useId()
  const name = labels.filterRuleN(position)
  const id = rule.id!
  const fieldOptions = fields.map((f) => ({ value: f.id, label: f.label }))
  const operator = field ? operatorLabel(rule.operator, labels) : ''

  // Delete or Backspace on a token (not in its popup, which is portalled out) removes the rule.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Delete' && event.key !== 'Backspace') return
    if (!event.currentTarget.contains(event.target as Node) || (event.target as HTMLElement).tagName !== 'BUTTON') return
    event.preventDefault()
    remove(id, name)
  }

  return (
    <div
      role="group"
      aria-label={name}
      data-slot="filter-rule"
      data-invalid={invalid || undefined}
      onKeyDown={disabled ? undefined : onKeyDown}
      onBlur={(event) => {
        const next = event.relatedTarget as Element | null
        if (!event.currentTarget.contains(next) && !next?.closest('[data-slot=filter-builder-menu]')) touch(id)
      }}
      className="group/rule own:flex min-w-0 flex-col own:gap-1"
    >
      <div className="own:flex min-w-0 items-center own:gap-1">
        <div data-slot="filter-rule-tokens" className="own:flex min-w-0 flex-wrap items-center gap-px">
          <Token
            ref={register(`field:${id}`)}
            popup={`field:${id}`}
            name={labels.filterField}
            spoken={field?.label}
            aria-invalid={!field || undefined}
            className="own:font-medium"
            content={
              <OptionList
                label={labels.filterField}
                options={fieldOptions}
                selected={field ? [field.id] : []}
                onPick={(picked) => changeField(id, picked)}
              />
            }
          >
            <span className="max-w-40 truncate">{field?.label ?? labels.selectPlaceholder}</span>
          </Token>
          {field && (
            <Token
              popup={`operator:${id}`}
              name={labels.filterOperator}
              spoken={operator}
              className="own:text-fg-muted"
              content={
                <OptionList
                  label={labels.filterOperator}
                  options={operatorsFor(field.type).map((op) => ({ value: op, label: operatorLabel(op, labels) }))}
                  selected={[rule.operator]}
                  onPick={(picked) => changeOperator(id, picked as FilterRule['operator'])}
                />
              }
            >
              {operator}
            </Token>
          )}
          {field && (
            <ValueToken
              rule={rule}
              field={field}
              invalid={invalid}
              describedBy={invalid ? messageId : undefined}
              tokenRef={register(`value:${id}`)}
            />
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disabled}
          aria-label={labels.remove(name)}
          onClick={() => {
            setOpen(null)
            remove(id, name)
          }}
          className="opacity-0 transition-opacity yj-duration-fast ease-standard group-hover/rule:opacity-100 group-focus-within/rule:opacity-100 touch:opacity-100"
        >
          <XIcon />
        </Button>
      </div>
      {invalid && (
        <p id={messageId} data-slot="filter-rule-message" className="own:text-ui-sm own:text-danger-text">
          {labels.filterIncomplete}
        </p>
      )}
    </div>
  )
}

function GroupMenu({ id, name }: { id: string; name: string }) {
  const { labels, disabled, duplicate, ungroup, remove } = useFilterBuilder()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        render={<Button type="button" variant="ghost" size="icon-sm" aria-label={labels.filterGroupActions(name)} />}
      >
        <EllipsisIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => duplicate(id)}>{labels.filterDuplicate(name)}</DropdownMenuItem>
        <DropdownMenuItem onClick={() => ungroup(id)}>{labels.filterUngroup}</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onClick={() => remove(id, name)}>
          {labels.remove(name)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

function GroupBox({ group, depth, name }: { group: FilterGroup; depth: number; name: string }) {
  const { labels, maxDepth, disabled, register, addRule, addGroup } = useFilterBuilder()
  const id = group.id!
  const nested = depth > 1
  return (
    <div
      role="group"
      aria-label={name}
      data-slot="filter-group"
      data-yj-depth={depth}
      data-yj-combinator={group.combinator}
      className={cn('own:flex min-w-0 flex-col own:gap-2', nested && 'own:border-s own:border-line own:ps-3')}
    >
      {group.children.length > 0 && (
        <PresenceList as="ul" className="own:flex list-none flex-col own:gap-2">
          {group.children.map((child, index) => (
            <PresenceItem key={child.id} as="li" className="own:flex min-w-0 items-start own:gap-2">
              <Connector group={group} index={index} />
              <div className="min-w-0 flex-1">
                {child.type === 'rule' ? (
                  <RuleRow rule={child} position={index + 1} />
                ) : (
                  <GroupBox group={child} depth={depth + 1} name={labels.filterGroupN(index + 1)} />
                )}
              </div>
            </PresenceItem>
          ))}
        </PresenceList>
      )}
      {group.children.length === 0 && (
        <p className={cn('own:flex h-control-sm items-center own:text-ui own:text-fg-muted', ruleColumnClass)}>{labels.filterEmpty}</p>
      )}
      <div className={cn('own:flex flex-wrap items-center own:gap-1', ruleColumnClass)}>
        <Button ref={register(`add:${id}`)} type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => addRule(id)} className="-ms-2">
          <PlusIcon />
          {labels.filterAddRule}
        </Button>
        {depth < maxDepth && (
          <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => addGroup(id)}>
            <PlusIcon />
            {labels.filterAddGroup}
          </Button>
        )}
        {nested && <GroupMenu id={id} name={name} />}
      </div>
    </div>
  )
}

export { GroupBox }
