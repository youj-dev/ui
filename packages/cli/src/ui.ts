import * as p from '@clack/prompts'
import { styleText } from 'node:util'
import { countChanges, diffLines, hunks } from './diff'
import type { Change } from './project'

export interface Choice<T extends string> {
  value: T
  label?: string
  hint?: string
}

/** What the commands need from a terminal; tests pass a silent one. */
export interface Ui {
  select<T extends string>(message: string, options: Choice<T>[], initial: T): Promise<T>
  confirm(message: string, initial: boolean): Promise<boolean>
  info(message: string): void
  success(message: string): void
  warn(message: string): void
  error(message: string): void
  task<T>(message: string, done: string, work: () => Promise<T>): Promise<T>
  changes(changes: Change[]): void
  note(title: string, body: string): void
}

export class CliError extends Error {}

const color = (format: Parameters<typeof styleText>[0], text: string) => (process.stdout.isTTY && !process.env.NO_COLOR ? styleText(format, text) : text)

export const dim = (text: string) => color('dim', text)
export const bold = (text: string) => color('bold', text)

function cancelled<T>(value: T | symbol): T {
  if (p.isCancel(value)) {
    p.cancel('Nothing was changed.')
    process.exit(1)
  }
  return value as T
}

export function formatChanges(changes: Change[], paint = (_: 'green' | 'red' | 'dim', t: string) => t): string {
  if (!changes.length) return 'Nothing to change: Youj is already set up here.'
  return changes
    .map((change) => {
      const lines = diffLines(change.before ?? '', change.after)
      if (change.before === null) return `${paint('green', '+')} ${change.path} ${paint('dim', '(new)')}`
      const { added, removed } = countChanges(lines)
      const body = hunks(lines)
        .slice(0, 24)
        .map((l) => (l.startsWith('+') ? paint('green', l) : l.startsWith('-') ? paint('red', l) : paint('dim', `  ${l.slice(2) || l}`)))
      return [`${paint('dim', '~')} ${change.path} ${paint('dim', `(+${added} -${removed})`)}`, ...body.map((l) => `    ${l}`)].join('\n')
    })
    .join('\n\n')
}

export const terminalUi: Ui = {
  async select(message, options, initial) {
    return cancelled(await p.select({ message, options: options as never, initialValue: initial as never })) as never
  },
  async confirm(message, initial) {
    return cancelled<boolean>(await p.confirm({ message, initialValue: initial }))
  },
  info: (m) => p.log.info(m),
  success: (m) => p.log.success(m),
  warn: (m) => p.log.warn(m),
  error: (m) => p.log.error(m),
  async task(message, done, work) {
    // A spinner redraws; piped into a log it would print every frame.
    if (!process.stdout.isTTY) {
      p.log.step(message)
      const result = await work()
      p.log.success(done)
      return result
    }
    const s = p.spinner()
    s.start(message)
    try {
      const result = await work()
      s.stop(done)
      return result
    } catch (error) {
      s.error(message)
      throw error
    }
  },
  changes(changes) {
    p.note(formatChanges(changes, (c, t) => color(c, t)), changes.length ? 'Changes' : 'Up to date')
  },
  note: (title, body) => p.note(body, title),
}

/** Answers every prompt with its default and records what it would print. */
export function silentUi(): Ui & { log: string[] } {
  const log: string[] = []
  return {
    log,
    select: async (_m, _o, initial) => initial,
    confirm: async (_m, initial) => initial,
    info: (m) => void log.push(`info: ${m}`),
    success: (m) => void log.push(`success: ${m}`),
    warn: (m) => void log.push(`warn: ${m}`),
    error: (m) => void log.push(`error: ${m}`),
    task: async (_m, done, work) => {
      const result = await work()
      log.push(`done: ${done}`)
      return result
    },
    changes: (changes) => void log.push(formatChanges(changes)),
    note: (title, body) => void log.push(`${title}: ${body}`),
  }
}
