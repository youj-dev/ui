import kit from 'virtual:youj-kit'
import { Panel } from './panel'
import { drawKit, readLook, run, styleCommand, styleName, summarise, writeLook } from './run'
import { message, ToastSink } from './steps'

/* The plugin's entry. The kit (tokens, themes, icons, blocks) was read from
 * the code at build time and is bundled above; nothing is fetched. A build
 * shows its steps in a panel: a clean build closes it, a build with problems
 * keeps it open with the list, so a failure is never silent. */

const command = figma.command || 'build'

async function main(): Promise<void> {
  // The Look menu chooses a look, then builds like "Build or update the kit".
  const style = styleCommand(kit, command)
  if (command !== 'build' && !style) {
    figma.closePlugin(await run(kit, command))
    return
  }
  if (style) writeLook(style)
  let panel: Panel | undefined
  try {
    panel = new Panel(styleName(kit, readLook(kit)))
  } catch (error) {
    console.error('Youj kit: the progress panel could not open; using toasts', error)
  }
  const report = await drawKit(kit, panel ?? new ToastSink())
  const closing = summarise(kit, report)
  if (report.problems.length && panel) {
    figma.notify(closing, { error: true, timeout: 10_000 })
    const text = [closing, '', ...report.problems.map((p) => `Problem: ${p}`), ...report.warnings.map((w) => `Note: ${w}`), '', ...report.lines, `Pages: ${report.census.join(' · ')}`].join('\n')
    const n = report.problems.length
    await panel.finish(false, `${n} problem${n > 1 ? 's' : ''}. A page that didn’t build says why on the page; run the plugin again to retry.`, report.problems, text)
  }
  figma.closePlugin(closing)
}

main().catch((error: unknown) => {
  console.error(error)
  figma.closePlugin(`Youj kit stopped: ${message(error)}`)
})
