'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { useComponentLabels, filterBuilderLabels } from '@youj/core/labels'
import { useAnnouncer } from '../../../hooks/use-announcer'
import { useControllableState } from '../../../hooks/use-controllable-state'
import { cn } from '../../../lib/utils'
import { Button } from '../button'
import { toast } from '../toast'
import { FilterBuilderProvider, type FilterBuilderContext } from './filter-builder-context'
import { GroupBox } from './filter-builder-group'
import {
  EMPTY_FILTER,
  describeFilter,
  describeParts,
  isRuleComplete,
  takesNoValue,
  type FilterField,
  type FilterGroup,
  type FilterRule,
} from './filter-builder-model'
import {
  changeField,
  changeOperator,
  duplicateNode,
  editGroup,
  editRule,
  findGroup,
  firstNode,
  insertNode,
  locate,
  newGroup,
  newRule,
  removeNode,
  sameFilter,
  ungroupNode,
  withIds,
  type FilterNode,
} from './filter-builder-tree'

/* Builds a query of AND/OR groups of typed rules ("Stage is not Lost and
 * (Owner is Ada or Amount > 100000)"). The fields come from a schema; a rule
 * reads as a sentence of tokens (field, an operator that suits its type, a
 * value), each opening a small menu or editor. Edits go to a draft: nothing
 * reaches `onValueChange` until Apply, Reset throws the draft away, and the
 * footer says while the two differ. A rule that isn't complete is flagged
 * once it's been left (or Apply refused it), and Apply won't pass it on.
 *
 * One surface: the applied filter's summary on top (a sentence, or chips),
 * the rows, then the footer with Reset and Apply. Every row starts in the
 * same connector column ("Where", then and/or), every control is the small
 * control height, and nested groups hang off a guide line, not a box.
 *
 * Motion: rows and nested groups enter and leave through PresenceList (they
 * fade in from a few px above while the rest make room); token popups grow
 * out of their token on yj-pop. Reduced motion: at once.
 *
 * Keyboard: Tab goes through each row's and/or and tokens in reading order,
 * then Add filter, Add group, Reset and Apply. Enter, Space or ArrowDown
 * opens a token's menu (arrows, Home/End and a letter move in it; Enter
 * picks); Delete or Backspace on a token removes its rule, and a toast offers
 * Undo when the app renders a Toaster. Adding a rule opens its field menu;
 * picking a field or operator that needs a value goes on to the value.
 * Removing focuses the next row, else the previous, else Add filter. Every
 * group and rule is a named group ("Group 2", "Rule 1"), every token says
 * what it is and holds ("Field: Stage"), and additions, removals, Apply and
 * Reset are announced. */

interface FilterBuilderProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'onChange' | 'children'> {
  /** The columns a rule can filter on. */
  fields: FilterField[]
  /** The applied filter (controlled). The builder's draft starts from it and returns to it on Reset. */
  value?: FilterGroup
  /** The filter applied at first (uncontrolled). Default: no rules. */
  defaultValue?: FilterGroup
  /** Called with the draft when Apply succeeds. */
  onValueChange?: (value: FilterGroup) => void
  /** How many levels of groups nest, the outer one counting as 1. Default 2: one group inside the outer one. */
  maxDepth?: number
  /** Shows the applied filter as a sentence, or as chips. Default true. */
  summary?: boolean
  /** Names the outer group. Default "Filter". */
  'aria-label'?: string
  disabled?: boolean
}

function FilterBuilder({
  fields,
  value,
  defaultValue = EMPTY_FILTER,
  onValueChange,
  maxDepth = 2,
  summary = true,
  disabled = false,
  'aria-label': ariaLabel,
  className,
  ...props
}: FilterBuilderProps) {
  const labels = useComponentLabels(filterBuilderLabels)
  const [applied, setApplied] = useControllableState(value, defaultValue)
  const [draft, setDraft] = useState(() => withIds(applied))
  const [seen, setSeen] = useState(applied)
  const [touched, setTouched] = useState<ReadonlySet<string>>(new Set())
  const [attempted, setAttempted] = useState(false)
  const [view, setView] = useState<'sentence' | 'chips'>('sentence')
  const [open, setOpenState] = useState<string | null>(null)
  const openRef = useRef<string | null>(null)
  const setOpen = useCallback((key: string | null) => {
    openRef.current = key
    setOpenState(key)
  }, [])
  const { announce, announcer } = useAnnouncer()
  const registry = useRef(new Map<string, HTMLElement>())
  const pendingFocus = useRef<string[] | null>(null)

  // The owner changed the applied filter: the draft starts again from it.
  if (!sameFilter(seen, applied)) {
    setSeen(applied)
    setDraft(withIds(applied))
    setAttempted(false)
    setTouched(new Set())
  }

  const dirty = !sameFilter(draft, applied)
  const fieldById = useMemo(() => new Map(fields.map((f) => [f.id, f])), [fields])
  const problem = useCallback((rule: FilterRule) => !fieldById.has(rule.field) || !isRuleComplete(rule), [fieldById])

  // Focus moves once the row it names has rendered.
  useEffect(() => {
    const keys = pendingFocus.current
    if (!keys) return
    const target = keys.map((key) => registry.current.get(key)).find(Boolean)
    if (!target) return
    pendingFocus.current = null
    target.focus()
  })

  const focusKey = (node: FilterNode): string => (node.type === 'rule' ? `field:${node.id}` : focusKey(node.children[0] ?? node))
  // A rule that still wants a value goes on to its value token; one that is done closes.
  const goOn = (rule: FilterRule) => setOpen(!takesNoValue(rule.operator) && !isRuleComplete(rule) ? `value:${rule.id}` : null)

  const context: FilterBuilderContext = {
    fields,
    labels,
    maxDepth,
    disabled,
    flagged: (rule) => (attempted || touched.has(rule.id!)) && problem(rule),
    touch: (id) => setTouched((prev) => (prev.has(id) ? prev : new Set(prev).add(id))),
    register: (key) => (node) => {
      if (node) registry.current.set(key, node)
      else registry.current.delete(key)
    },
    open,
    setOpen,
    openNow: () => openRef.current,
    setCombinator: (groupId, combinator) => setDraft((root) => editGroup(root, groupId, (group) => ({ ...group, combinator }))),
    addRule: (groupId) => {
      const rule = newRule(fields[0])
      const group = findGroup(draft, groupId)
      setOpen(`field:${rule.id}`)
      setDraft((root) => editGroup(root, groupId, (g) => ({ ...g, children: [...g.children, rule] })))
      announce(labels.added(labels.filterRuleN((group?.children.length ?? 0) + 1)))
    },
    addGroup: (groupId) => {
      const added = newGroup(fields[0])
      const group = findGroup(draft, groupId)
      setOpen(`field:${added.children[0]!.id}`)
      setDraft((root) => editGroup(root, groupId, (g) => ({ ...g, children: [...g.children, added] })))
      announce(labels.added(labels.filterGroupN((group?.children.length ?? 0) + 1)))
    },
    duplicate: (id) => {
      const result = duplicateNode(draft, id)
      if (!result) return
      const where = locate(result.root, result.copy.id!)
      pendingFocus.current = [focusKey(result.copy)]
      setDraft(result.root)
      const kind = result.copy.type === 'group' ? labels.filterGroupN : labels.filterRuleN
      announce(labels.added(kind((where?.index ?? 0) + 1)))
    },
    remove: (id, name) => {
      const where = locate(draft, id)
      if (!where) return
      const siblings = where.parent.children
      const node = siblings[where.index]!
      const neighbor = siblings[where.index + 1] ?? siblings[where.index - 1]
      const parentId = where.parent.id!
      pendingFocus.current = neighbor ? [focusKey(neighbor)] : [`add:${parentId}`]
      setDraft((root) => removeNode(root, id))
      announce(labels.removed(name))
      toast(labels.removed(name), {
        action: {
          label: labels.undo,
          onClick: () => {
            pendingFocus.current = [focusKey(node)]
            setDraft((root) => (findGroup(root, parentId) ? insertNode(root, parentId, where.index, node) : root))
          },
        },
      })
    },
    ungroup: (id) => {
      const where = locate(draft, id)
      const group = where?.parent.children[where.index]
      if (group?.type !== 'group') return
      pendingFocus.current = group.children[0] ? [focusKey(group.children[0])] : [`add:${where!.parent.id}`]
      setDraft((root) => ungroupNode(root, id))
    },
    changeField: (ruleId, fieldId) => {
      const to = fieldById.get(fieldId)
      const rule = firstNode(draft, (r) => r.id === ruleId)
      if (!to || !rule) return
      const changed = changeField(rule, fieldById.get(rule.field), to)
      setDraft((root) => editRule(root, ruleId, () => changed))
      goOn(changed)
    },
    changeOperator: (ruleId, operator) => {
      const rule = firstNode(draft, (r) => r.id === ruleId)
      if (!rule) return
      const changed = changeOperator(rule, operator, fieldById.get(rule.field)?.type ?? 'text')
      setDraft((root) => editRule(root, ruleId, () => changed))
      goOn(changed)
    },
    changeValue: (ruleId, next) => setDraft((root) => editRule(root, ruleId, (rule) => ({ ...rule, value: next }))),
  }

  const apply = () => {
    const bad = firstNode(draft, problem)
    if (bad) {
      setAttempted(true)
      setOpen(null)
      pendingFocus.current = [fieldById.has(bad.field) ? `value:${bad.id}` : `field:${bad.id}`, `field:${bad.id}`]
      announce(labels.filterIncomplete)
      return
    }
    setAttempted(false)
    setApplied(draft)
    onValueChange?.(draft)
    announce(labels.filterApplied)
  }

  const reset = () => {
    setDraft(withIds(applied))
    setAttempted(false)
    setTouched(new Set())
    announce(labels.filterDiscarded)
  }

  const sentence = describeFilter(applied, fields, labels)
  const joiner = (applied.combinator === 'or' ? labels.filterOr : labels.filterAnd).toLocaleLowerCase()

  return (
    <div
      data-slot="filter-builder"
      data-yj-dirty={dirty || undefined}
      className={cn('own:flex w-full min-w-0 flex-col own:rounded-lg own:border own:border-line-subtle own:bg-surface own:text-fg', className)}
      {...props}
    >
      {summary && (
        <div
          data-slot="filter-builder-summary"
          role="group"
          aria-label={labels.filterSummary}
          className="own:flex min-h-control-sm items-center own:gap-3 own:border-b own:border-line-subtle own:px-4 own:py-2"
        >
          <div className="min-w-0 flex-1 own:text-ui">
            {!sentence ? (
              <p className="own:text-fg-muted">{labels.filterSummaryNone}</p>
            ) : view === 'sentence' ? (
              <p data-slot="filter-builder-sentence" className="own:text-fg-muted">
                {sentence}
              </p>
            ) : (
              <ul aria-label={labels.filterSummary} className="own:flex list-none flex-wrap items-center own:gap-x-1.5 own:gap-y-1">
                {describeParts(applied, fields, labels).map((part, index) => (
                  <li key={index} className="own:flex items-center own:gap-1.5">
                    {index > 0 && <span className="own:text-fg-muted">{joiner}</span>}
                    <span
                      data-slot="filter-builder-chip"
                      className="own:inline-flex h-control-sm items-center own:rounded-control-sm own:bg-band own:px-2.5"
                    >
                      {part}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {sentence && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setView(view === 'sentence' ? 'chips' : 'sentence')} className="-me-2.5">
              {view === 'sentence' ? labels.filterShowChips : labels.filterShowSentence}
            </Button>
          )}
        </div>
      )}
      <div className="own:px-2 own:py-3">
        <FilterBuilderProvider value={context}>
          <GroupBox group={draft} depth={1} name={ariaLabel ?? labels.filterBuilder} />
        </FilterBuilderProvider>
      </div>
      <div className="own:flex flex-wrap items-center own:gap-1 own:border-t own:border-line-subtle own:px-4 own:py-2">
        <span role="status" data-slot="filter-builder-hint" className="own:me-auto own:text-ui-sm own:text-fg-muted">
          {dirty ? labels.filterUnapplied : ''}
        </span>
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={reset}>
          {labels.filterReset}
        </Button>
        <Button type="button" size="sm" disabled={disabled} onClick={apply}>
          {labels.filterApply}
        </Button>
      </div>
      {announcer}
    </div>
  )
}

export { FilterBuilder, type FilterBuilderProps }
