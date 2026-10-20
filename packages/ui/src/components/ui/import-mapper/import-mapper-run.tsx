import { CheckIcon } from '@youj/icons/components/youj/icons/check'
import { Alert, AlertDescription } from '../alert'
import { Button } from '../button'
import { Progress, ProgressLabel, ProgressValue } from '../progress'
import type { ImportMapperCopy } from './import-mapper-data'
import type { Importer } from './import-mapper-use-importer'
import { numberFormat } from '../../../lib/utils'

interface ResultProps {
  m: Importer
  copy: ImportMapperCopy
  locale: string
  /** The skipped-rows file's name. */
  reportName: string
  onDone?: () => void
}

/** The last screen: progress while the rows go in, then what was imported and skipped, with the skipped rows to download. */
export function ResultStep({ m, copy, locale, reportName, onDone }: ResultProps) {
  const number = numberFormat(locale)
  const { run } = m

  const download = () => {
    const url = URL.createObjectURL(new Blob([m.report()], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = reportName
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  if (run.status === 'failed') {
    return (
      <div className="own:flex h-full flex-col items-start justify-center gap-3">
        <Alert variant="danger" className="w-full" data-yj-focus="" tabIndex={-1}>
          <AlertDescription>{copy.importMapperFailed(run.message)}</AlertDescription>
        </Alert>
        <div className="own:flex gap-2">
          <Button onClick={m.start}>{copy.retry}</Button>
          <Button variant="ghost" onClick={m.back}>
            {copy.back}
          </Button>
        </div>
      </div>
    )
  }

  if (run.status === 'done') {
    const details = [run.updated > 0 && copy.importMapperUpdatedCount(run.updated), run.skipped > 0 && copy.importMapperSkippedCount(run.skipped)]
    return (
      <div data-slot="import-mapper-result" className="own:flex own:h-full flex-col items-center justify-center gap-5 own:text-center">
        <span aria-hidden className="own:grid size-10 place-items-center rounded-full bg-success-subtle own:text-success-text">
          <CheckIcon trigger="none" size={22} />
        </span>
        <div className="own:flex flex-col gap-1">
          <h3 tabIndex={-1} data-yj-focus="" className="own:text-ui-lg own:font-medium text-fg outline-none">
            {copy.importMapperImported(m.noun(run.created + run.updated))}
          </h3>
          {details.some(Boolean) && <p className="own:text-ui own:text-fg-muted">{details.filter(Boolean).join(' · ')}</p>}
        </div>
        <div className="own:flex flex-wrap justify-center gap-2">
          {m.leftOut.length > 0 && (
            <Button variant="outline" onClick={download}>
              {copy.importMapperErrorReport}
            </Button>
          )}
          <Button variant={onDone ? 'ghost' : 'outline'} onClick={m.reset}>
            {copy.importMapperImportAnother}
          </Button>
          {onDone && <Button onClick={onDone}>{copy.done}</Button>}
        </div>
      </div>
    )
  }

  const done = run.status === 'running' ? run.done : 0
  const total = run.status === 'running' ? run.total : 0
  return (
    <div className="own:flex h-full flex-col justify-center gap-3" data-yj-focus="" tabIndex={-1}>
      <Progress value={total ? (done / total) * 100 : 0} aria-label={copy.importMapperProgressLabel}>
        <ProgressLabel>{copy.importMapperImporting}</ProgressLabel>
        <ProgressValue>{() => copy.importMapperProgress(number.format(done), number.format(total))}</ProgressValue>
      </Progress>
    </div>
  )
}
