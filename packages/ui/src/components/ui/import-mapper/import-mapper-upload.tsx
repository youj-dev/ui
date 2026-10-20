import { useId, type RefObject } from 'react'
import { UploadIcon } from '@youj/icons/components/youj/icons/upload'
import { Alert, AlertDescription } from '../alert'
import { Button } from '../button'
import { useFileDrop } from '../file-upload'
import { cn } from '../../../lib/utils'
import { formatBytes, SAMPLE_CSV, SAMPLE_NAME, type ImportMapperCopy } from './import-mapper-data'
import type { Importer } from './import-mapper-use-importer'

/** The hidden input behind every "choose a file" button. */
export function FilePicker({ inputRef, onFile }: { inputRef: RefObject<HTMLInputElement | null>; onFile: (file: File) => void }) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept=".csv,.tsv,.txt,text/csv"
      tabIndex={-1}
      aria-hidden
      className="sr-only"
      onChange={(event) => {
        const picked = event.target.files?.[0]
        event.target.value = ''
        if (picked) onFile(picked)
      }}
    />
  )
}

interface ChooseProps {
  m: Importer
  copy: ImportMapperCopy
  locale: string
  maxSize: number
  /** Offer the built-in sample. */
  sample: boolean
  /** Opens the file picker. */
  onPick: () => void
}

/** The first screen: a drop zone for the CSV, then straight on to the mapping. */
export function ChooseFile({ m, copy, locale, maxSize, sample, onPick }: ChooseProps) {
  const hintId = useId()
  const drop = useFileDrop((files) => void (files[0] && m.loadFile(files[0])))

  return (
    <div className="own:flex h-full flex-col gap-3">
      <div
        {...drop.props}
        data-slot="import-mapper-drop"
        data-yj-over={drop.over || undefined}
        className={cn(
          'own:flex flex-1 flex-col items-center justify-center gap-3 own:rounded-lg border border-dashed border-line own:bg-well own:px-4 own:py-8 text-center transition-colors own:yj-duration-fast own:ease-standard',
          drop.over && 'border-accent own:bg-accent-subtle',
        )}
      >
        <span aria-hidden className="own:text-fg-muted">
          <UploadIcon size={28} trigger="none" />
        </span>
        <div className="own:flex flex-col gap-0.5">
          <p className="own:text-ui own:font-medium own:text-fg">{copy.importMapperDropTitle}</p>
          <p id={hintId} className="own:text-ui-sm own:text-fg-muted">
            {copy.importMapperDropHint(formatBytes(maxSize, locale))}
          </p>
        </div>
        <div className="own:flex flex-wrap justify-center gap-2">
          <Button variant="outline" data-yj-focus="" aria-describedby={hintId} onClick={onPick}>
            {copy.importMapperChoose}
          </Button>
          {sample && (
            <Button variant="ghost" onClick={() => m.load(SAMPLE_CSV, SAMPLE_NAME, SAMPLE_CSV.length)}>
              {copy.importMapperSample}
            </Button>
          )}
        </div>
      </div>
      {m.uploadError && (
        <Alert variant="danger">
          <AlertDescription>{m.uploadError}</AlertDescription>
        </Alert>
      )}
    </div>
  )
}
