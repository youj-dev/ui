import type { ProgressSink, StepState } from './steps'

/* The build's panel: every step with its state while the kit builds, then
 * the outcome. A clean build closes itself; a build with problems stays open
 * and lists them, so a failure is never just a toast that fades. Figma's
 * theme colours style it; all text goes in through textContent. */

const HTML = `<!doctype html>
<meta charset="utf-8">
<style>
  :root { color-scheme: light dark; }
  * { box-sizing: border-box; }
  body { margin: 0; font: 11px/16px Inter, system-ui, sans-serif; color: var(--figma-color-text, #1e1e1e); background: var(--figma-color-bg, #fff); display: flex; flex-direction: column; height: 100vh; }
  header { padding: 12px 16px 8px; }
  h1 { margin: 0; font-size: 13px; line-height: 20px; font-weight: 600; }
  #summary { margin: 2px 0 0; color: var(--figma-color-text-secondary, #666); }
  ol { list-style: none; margin: 0; padding: 4px 8px; overflow: auto; flex: 1; }
  li { display: grid; grid-template-columns: 16px 1fr; column-gap: 8px; padding: 4px 8px; border-radius: 4px; }
  #problems { margin: 0 16px 8px; padding: 8px 10px; border-radius: 5px; background: var(--figma-color-bg-danger-tertiary, #fff1ee); color: var(--figma-color-text-danger, #f24822); display: none; max-height: 120px; overflow: auto; }
  #problems.show { display: block; }
  #problems p { margin: 0; word-break: break-word; }
  #problems p + p { margin-top: 4px; }
  li[data-status=running] { background: var(--figma-color-bg-secondary, #f5f5f5); }
  .mark { width: 16px; height: 16px; display: grid; place-items: center; font-weight: 700; }
  [data-status=pending] .mark::before { content: ''; width: 6px; height: 6px; border-radius: 50%; background: var(--figma-color-border, #e6e6e6); }
  [data-status=running] .mark::before { content: ''; width: 10px; height: 10px; border-radius: 50%; border: 2px solid var(--figma-color-border-brand-strong, #0d99ff); border-right-color: transparent; animation: spin .8s linear infinite; }
  [data-status=done] .mark::before { content: '✓'; color: var(--figma-color-text-success, #14ae5c); }
  [data-status=failed] .mark::before { content: '!'; color: var(--figma-color-text-danger, #f24822); }
  [data-status=skipped] .mark::before { content: '–'; color: var(--figma-color-text-tertiary, #999); }
  [data-status=pending] .label { color: var(--figma-color-text-tertiary, #999); }
  .detail { grid-column: 2; color: var(--figma-color-text-secondary, #666); word-break: break-word; }
  [data-status=failed] .detail { color: var(--figma-color-text-danger, #f24822); }
  footer { display: none; gap: 8px; justify-content: flex-end; padding: 8px 16px 12px; border-top: 1px solid var(--figma-color-border, #e6e6e6); }
  footer.show { display: flex; }
  button { font: inherit; font-weight: 500; height: 28px; padding: 0 12px; border-radius: 5px; border: 1px solid var(--figma-color-border, #e6e6e6); background: transparent; color: inherit; cursor: pointer; }
  button.primary { background: var(--figma-color-bg-brand, #0d99ff); border-color: transparent; color: var(--figma-color-text-onbrand, #fff); }
  button:focus-visible { outline: 2px solid var(--figma-color-border-brand-strong, #0d99ff); outline-offset: 1px; }
  @keyframes spin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { [data-status=running] .mark::before { animation: none; } }
</style>
<header><h1 id="title">Building the Youj kit</h1><p id="summary" role="status">Starting…</p></header>
<div id="problems" role="alert"></div>
<ol id="steps" aria-label="Build steps"></ol>
<footer id="footer"><button id="copy">Copy report</button><button id="close" class="primary">Close</button></footer>
<script>
  const list = document.getElementById('steps');
  let report = '';
  function render(steps) {
    list.replaceChildren(...steps.map((s) => {
      const li = document.createElement('li');
      li.dataset.status = s.status;
      const mark = document.createElement('span'); mark.className = 'mark'; mark.setAttribute('aria-label', s.status);
      const label = document.createElement('span'); label.className = 'label'; label.textContent = s.label;
      li.append(mark, label);
      if (s.detail) { const d = document.createElement('span'); d.className = 'detail'; d.textContent = s.detail; li.append(d); }
      return li;
    }));
    const done = steps.filter((s) => s.status !== 'pending' && s.status !== 'running').length;
    const running = steps.find((s) => s.status === 'running');
    document.getElementById('summary').textContent = running ? running.label + '… (' + (done + 1) + ' of ' + steps.length + ')' : done + ' of ' + steps.length + ' steps';
  }
  onmessage = (event) => {
    const msg = event.data.pluginMessage;
    if (!msg) return;
    if (msg.type === 'steps') render(msg.steps);
    if (msg.type === 'finish') {
      render(msg.steps);
      report = msg.report;
      document.getElementById('title').textContent = msg.ok ? 'The kit is ready' : 'The kit built with problems';
      document.getElementById('summary').textContent = msg.message;
      const problems = document.getElementById('problems');
      problems.replaceChildren(...msg.problems.map((p) => { const line = document.createElement('p'); line.textContent = p; return line; }));
      problems.classList.toggle('show', msg.problems.length > 0);
      const failed = list.querySelector('[data-status=failed], [data-status=skipped]');
      if (failed) failed.scrollIntoView({ block: 'center' });
      document.getElementById('footer').classList.add('show');
      document.getElementById('close').focus();
    }
  };
  document.getElementById('close').onclick = () => parent.postMessage({ pluginMessage: { type: 'close' } }, '*');
  document.getElementById('copy').onclick = () => {
    const area = document.createElement('textarea');
    area.value = report; document.body.append(area); area.select();
    try { document.execCommand('copy'); document.getElementById('copy').textContent = 'Copied'; } catch (e) {}
    area.remove();
  };
</script>`

export class Panel implements ProgressSink {
  private closed: Promise<void>
  private last: StepState[] = []

  /** `style` names the component style being built, shown under the title. */
  constructor(style?: string) {
    figma.showUI(HTML, { width: 340, height: 460, title: style ? `Youj kit · ${style}` : 'Youj kit', themeColors: true })
    this.closed = new Promise((resolve) => {
      figma.ui.onmessage = (msg: { type?: string } | undefined) => {
        if (msg && msg.type === 'close') resolve()
      }
    })
  }

  update(steps: StepState[]) {
    this.last = steps
    figma.ui.postMessage({ type: 'steps', steps })
  }

  /** Shows the outcome and resolves when the panel is closed. */
  finish(ok: boolean, message: string, problems: string[], report: string): Promise<void> {
    figma.ui.postMessage({ type: 'finish', steps: this.last, ok, message, problems, report })
    return this.closed
  }
}
