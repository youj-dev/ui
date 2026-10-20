import { EventEmitter } from 'node:events'
import { delimiter, dirname, join } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const spawn = vi.hoisted(() => vi.fn())
vi.mock('node:child_process', () => ({ spawn }))

const { run, spawnTarget } = await import('../src/run')

describe('run', () => {
  it('never spawns through a shell', async () => {
    spawn.mockImplementation(() => {
      const child = new EventEmitter() as EventEmitter & { stdout: EventEmitter; stderr: EventEmitter }
      child.stdout = new EventEmitter()
      child.stderr = new EventEmitter()
      queueMicrotask(() => child.emit('close', 0))
      return child
    })
    for (const platform of ['darwin', 'linux'] as const) {
      const real = process.platform
      Object.defineProperty(process, 'platform', { value: platform })
      try {
        await run({ cmd: process.execPath, args: ['-v'] }, process.cwd())
      } finally {
        Object.defineProperty(process, 'platform', { value: real })
      }
    }
    expect(spawn).toHaveBeenCalledTimes(2)
    for (const call of spawn.mock.calls) expect(call[2].shell).toBe(false)
  })
})

describe('spawnTarget', () => {
  const command = { cmd: 'npx', args: ['--yes', 'shadcn@4.21.0', 'add', 'button&calc'] }

  it('leaves the command alone off Windows', () => {
    expect(spawnTarget(command, 'darwin')).toEqual(command)
  })

  it('runs npm and npx on Windows as node on their own scripts, arguments untouched', () => {
    const script = join(dirname(process.execPath), 'node_modules', 'npm', 'bin', 'npx-cli.js')
    expect(spawnTarget(command, 'win32', (p) => p === script)).toEqual({ cmd: process.execPath, args: [script, ...command.args] })
  })

  it('finds another tool as an .exe on PATH, and says so when it only has a .cmd', () => {
    const exe = join('tools', 'bun.exe')
    expect(spawnTarget({ cmd: 'bun', args: ['x'] }, 'win32', (p) => p === exe, { Path: ['nowhere', 'tools'].join(delimiter) })).toEqual({ cmd: exe, args: ['x'] })
    expect(() => spawnTarget({ cmd: 'pnpm', args: ['add', 'x'] }, 'win32', () => false, { Path: '' })).toThrow(/without a shell/)
  })
})
