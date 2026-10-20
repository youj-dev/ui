/* The build as a list of steps. Each runs on its own: a step that throws is
 * marked failed with its message, the build carries on with the next, and
 * everything that failed is listed in the panel, on the cover and in the
 * plugin console. Steps the others can't do without (fonts, variables,
 * styles, pages) stop the steps that need them, and say so. */

export type Status = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export interface StepState {
  id: string
  label: string
  status: Status
  detail?: string
}

/** Where progress is shown: the plugin's panel, or toasts when there is none. */
export interface ProgressSink {
  update(steps: StepState[]): void
}

/** An error's message. Duck-typed: errors from another realm (Figma's, a sandbox's) aren't instances of this one's Error. */
export const message = (error: unknown) => (typeof error === 'object' && error !== null && 'message' in error ? String(error.message) : String(error))

/** Hands control back to Figma, so it can paint the panel and stay responsive between stretches of work. */
export const pause = () => new Promise<void>((resolve) => setTimeout(resolve, 0))

export class Steps {
  readonly states: StepState[]
  /** One line per failed or skipped step: "Icons: <what went wrong>". */
  readonly problems: string[] = []

  constructor(
    defs: [id: string, label: string][],
    private sink: ProgressSink,
  ) {
    this.states = defs.map(([id, label]) => ({ id, label, status: 'pending' as Status }))
  }

  private state(id: string) {
    const s = this.states.find((x) => x.id === id)
    if (!s) throw new Error(`steps: no step ${id}`)
    return s
  }

  private notify() {
    this.sink.update(this.states.map((s) => ({ ...s })))
  }

  /** Runs a step. Resolves to its result, or to undefined when it failed (the failure is recorded, not thrown). */
  async run<T>(id: string, fn: () => Promise<T>, detail?: (result: T) => string | undefined): Promise<T | undefined> {
    const s = this.state(id)
    s.status = 'running'
    s.detail = undefined
    this.notify()
    await pause()
    try {
      const result = await fn()
      s.status = 'done'
      s.detail = detail?.(result)
      return result
    } catch (error) {
      s.status = 'failed'
      s.detail = message(error)
      this.problems.push(`${s.label}: ${s.detail}`)
      console.error(`Youj kit: ${s.label} failed`, error)
      return undefined
    } finally {
      this.notify()
    }
  }

  /** Marks a step as not run, with the reason (usually a step it needs that failed). */
  skip(id: string, reason: string) {
    const s = this.state(id)
    s.status = 'skipped'
    s.detail = reason
    this.problems.push(`${s.label}: skipped, ${reason}`)
    this.notify()
  }

  /** Records a problem found after the steps ran (an empty page, say). */
  problem(line: string) {
    this.problems.push(line)
  }

  get failed() {
    return this.states.filter((s) => s.status === 'failed' || s.status === 'skipped')
  }
}

/** Progress as a toast per step: the fallback when the panel can't open, and the Theme command's. */
export class ToastSink implements ProgressSink {
  private toast: NotificationHandler | undefined
  private last = ''
  update(steps: StepState[]) {
    const running = steps.find((s) => s.status === 'running')
    const text = running ? `Youj kit: ${running.label.toLowerCase()}… (${steps.indexOf(running) + 1}/${steps.length})` : ''
    if (text === this.last) return
    this.last = text
    this.toast?.cancel()
    this.toast = text ? figma.notify(text, { timeout: Infinity }) : undefined
  }
  close() {
    this.toast?.cancel()
    this.toast = undefined
  }
}
