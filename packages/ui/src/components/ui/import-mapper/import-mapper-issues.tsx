import { AlertTriangleIcon } from '@youj/icons/components/youj/icons/alert-triangle'
import { Button } from '../button'
import { Collapsible, CollapsibleChevron, CollapsibleContent, CollapsibleTrigger } from '../collapsible'
import { NativeSelect, NativeSelectOption } from '../native-select'
import { SegmentedControl, SegmentedControlItem } from '../segmented-control'
import { cn } from '../../../lib/utils'
import type { ImportMapperCopy } from './import-mapper-data'
import type { DuplicatePolicy } from './import-mapper-model'
import type { Importer, ProblemGroup } from './import-mapper-use-importer'

interface IssuesProps {
  m: Importer
  copy: ImportMapperCopy
  id: string
  /** One control height for the whole list. */
  size: 'sm' | 'default'
  /** Opens the review sheet on this group. */
  onReview: (group: ProblemGroup) => void
  /** Called after a group is skipped, to move focus on. */
  settle: () => void
}

/** What needs attention before the import, each with a way out; or a line saying nothing does. */
export function Issues({ m, copy, id, size, onReview, settle }: IssuesProps) {
  const duplicateId = `${id}-dup`
  const clean = m.problems.length === 0 && m.skippedRows.length === 0
  const issueText = (group: ProblemGroup) =>
    (group.kind === 'required' ? copy.importMapperIssueMissing : copy.importMapperIssueInvalid)(group.rows.length, m.labelOf(group.fieldId))

  return (
    <>
      {clean && m.duplicateCount === 0 && <p className="own:text-ui-sm own:text-fg-muted">{copy.importMapperAllGood}</p>}

      {(m.problems.length > 0 || m.duplicateCount > 0) && (
        <Collapsible>
          <ul className={cn('flex flex-col gap-1 own:bg-well own:p-1.5', size === 'sm' ? 'own:rounded-lg' : 'own:rounded-md')}>
            {m.problems.map((group) => (
              <li key={group.key} className="flex flex-wrap items-center gap-x-2 gap-y-1 own:ps-1.5">
                <span aria-hidden className="own:text-warning-text">
                  <AlertTriangleIcon trigger="none" size={16} strokeWidth={1.75} />
                </span>
                <span id={`${id}-p-${group.key}`} className="min-w-0 flex-1 own:text-ui own:text-fg">
                  {issueText(group)}
                </span>
                <span className="own:flex gap-1">
                  <Button variant="secondary" size={size} data-yj-review="" aria-describedby={`${id}-p-${group.key}`} onClick={() => onReview(group)}>
                    {copy.importMapperReview}
                  </Button>
                  <Button
                    variant="ghost"
                    size={size}
                    aria-describedby={`${id}-p-${group.key}`}
                    onClick={() => {
                      m.skipRows(group.rows, true)
                      settle()
                    }}
                  >
                    {copy.importMapperSkipThem(group.rows.length)}
                  </Button>
                </span>
              </li>
            ))}
            {m.duplicateCount > 0 && (
              <li data-slot="import-mapper-duplicates" className="own:flex flex-wrap items-center own:gap-x-2 own:gap-y-1 own:ps-1.5">
                <span aria-hidden className="own:text-warning-text">
                  <AlertTriangleIcon trigger="none" size={16} strokeWidth={1.75} />
                </span>
                <p id={duplicateId} className="min-w-48 flex-1 own:text-ui own:text-fg">
                  {copy.importMapperDuplicatesFound(m.duplicateCount)} <span className="own:text-fg-muted">{copy.importMapperPolicy}</span>
                </p>
                <SegmentedControl
                  variant="pill"
                  size={size}
                  aria-labelledby={duplicateId}
                  value={m.policy}
                  onValueChange={(value) => value && m.setPolicy(value as DuplicatePolicy)}
                >
                  <SegmentedControlItem value="update">{copy.importMapperPolicyUpdate}</SegmentedControlItem>
                  <SegmentedControlItem value="skip">{copy.skip}</SegmentedControlItem>
                  <SegmentedControlItem value="create">{copy.importMapperPolicyCreate}</SegmentedControlItem>
                </SegmentedControl>
                <CollapsibleTrigger render={<Button variant="ghost" size={size} />}>
                  {copy.importMapperMoreOptions}
                  <CollapsibleChevron size={14} />
                </CollapsibleTrigger>
              </li>
            )}
          </ul>
          {m.duplicateCount > 0 && (
            <CollapsibleContent>
              <div className="own:flex flex-wrap items-center gap-2 own:px-1.5 own:py-2">
                <label htmlFor={`${id}-key`} className="text-ui-sm own:text-fg-muted">
                  {copy.importMapperKey}
                </label>
                <NativeSelect id={`${id}-key`} size={size} value={m.keyId} onChange={(event) => m.setKeyId(event.target.value)}>
                  {m.mappedIds.map((fieldId) => (
                    <NativeSelectOption key={fieldId} value={fieldId}>
                      {m.labelOf(fieldId)}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </div>
            </CollapsibleContent>
          )}
        </Collapsible>
      )}

      {m.skippedRows.length > 0 && (
        <p className="own:flex items-center gap-2 own:text-ui-sm own:text-fg-muted">
          {copy.importMapperSkippedNote(m.skippedRows.length)}
          <Button variant="ghost" size={size === 'sm' ? 'xs' : size} onClick={() => m.skipRows(m.skippedRows, false)}>
            {copy.undo}
          </Button>
        </p>
      )}
    </>
  )
}
