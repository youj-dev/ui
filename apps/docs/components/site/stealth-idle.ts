/** Runs `task` once the page has loaded and the browser is idle (at most 2 s later); returns a cancel. */
export function afterFirstPaint(task: () => void): () => void {
  let cancel = () => {}
  const idle = () => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(task, { timeout: 2000 })
      cancel = () => window.cancelIdleCallback(id)
    } else {
      const id = setTimeout(task, 200)
      cancel = () => clearTimeout(id)
    }
  }
  if (document.readyState === 'complete') idle()
  else {
    window.addEventListener('load', idle, { once: true })
    cancel = () => window.removeEventListener('load', idle)
  }
  return () => cancel()
}

/** The reader asked for less data (Save-Data). */
export function saveData(): boolean {
  return (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true
}
