import { type ReactNode, type Ref, useRef, useState } from 'react'
import { stage } from '../engine/palette'
import type { AnyMiniatureHandle, MiniatureMeta, MiniatureProps, MiniatureMode, MiniatureSnapshot } from '../engine/types'

/* How a showroom presents a miniature, built from React alone: the stage, the
 * maker's header, the miniature (painting its own stage, so a lights-out mode
 * darkens the room), and a caption whose name, spec and key strip come from
 * the metadata and whose readout comes from onStateChange. The key strip
 * presses keys through the handle; toggles show their state from the
 * snapshot. The docs can lift this as is. */

type Part = Pick<MiniatureProps, 'onStateChange' | 'style' | 'mode' | 'stage'> & { ref: Ref<AnyMiniatureHandle> }

const tokens = (s: { bg: string; ink: string; muted: string; rule: string; accent: string }) => `--bg:${s.bg};--ink:${s.ink};--muted:${s.muted};--rule:${s.rule};--accent:${s.accent}`
const CSS = `
.yjm-showroom{${tokens(stage.light)};box-sizing:border-box;min-height:100dvh;display:grid;grid-template-columns:minmax(0,1fr);place-items:center;padding:38px 28px;background:var(--bg);color:var(--ink);font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.yjm-showroom[data-mode=dark],:is(.dark,[data-theme=dark]) .yjm-showroom[data-mode=system]{${tokens(stage.dark)}}
@media(prefers-color-scheme:dark){.yjm-showroom[data-mode=system]:not(:is(.light,[data-theme=light]) *){${tokens(stage.dark)}}}
.yjm-showroom main{width:min(100%,940px)}
.yjm-showroom header{display:flex;align-items:center;justify-content:space-between;gap:20px;font-size:10px;letter-spacing:.16em;color:var(--muted)}
.yjm-showroom header b{font-weight:500;color:var(--ink)}
.yjm-showroom header span{display:flex;align-items:center;gap:10px}
.yjm-showroom header i{height:6px;width:6px;border:1px solid var(--muted);border-radius:50%}
.yjm-showroom figure{margin:25px 0 0}
.yjm-showroom figcaption{border-top:1px solid var(--rule);margin-top:4px;padding-top:20px;display:grid;grid-template-columns:1fr auto;gap:12px 24px;font-size:12px}
.yjm-showroom .name{font-family:system-ui,sans-serif;font-size:14px;font-weight:450}
.yjm-showroom .spec{font-size:10px;letter-spacing:.1em;color:var(--muted)}
.yjm-showroom .readout{text-align:right;font-variant-numeric:tabular-nums;min-width:min(320px,100%)}
.yjm-showroom .state{display:block;color:var(--muted);font-size:9px;letter-spacing:.12em;margin-top:8px}
.yjm-showroom .keys{grid-column:1/-1;display:flex;flex-wrap:wrap;gap:4px 14px;font-size:10px;line-height:2;color:var(--muted)}
.yjm-showroom .hint{display:inline-flex;align-items:center;gap:4px}
.yjm-showroom kbd{font:inherit;color:var(--ink);border:1px solid var(--rule);border-radius:3px;padding:2px 4px;min-width:1.6em;text-align:center}
.yjm-showroom button{font:inherit;color:inherit;background:none;border:0;padding:0;margin:0;cursor:pointer;display:inline-flex;align-items:center;gap:4px;border-radius:3px}
.yjm-showroom button:hover kbd{border-color:var(--muted)}
.yjm-showroom button:focus-visible{outline:1px solid var(--accent);outline-offset:3px}
.yjm-showroom button[aria-pressed=true] kbd{color:var(--accent);border-color:var(--accent)}
@media(max-width:560px){.yjm-showroom{padding:28px 18px}.yjm-showroom figcaption{grid-template-columns:1fr}.yjm-showroom .readout{text-align:left}}
`

const capOf = (key: string) => (key === ' ' ? 'Space' : key.length === 1 ? key.toUpperCase() : key.replace('Arrow', ''))

export function Showroom({ meta, render, mode = 'system' }: { meta: MiniatureMeta; render: (part: Part) => ReactNode; mode?: MiniatureMode }) {
  const ref = useRef<AnyMiniatureHandle>(null)
  const [snapshot, setSnapshot] = useState<MiniatureSnapshot>(meta.initial)
  const press = (key: string) => ref.current?.press(key)
  return (
    <div className="yjm-showroom" data-mode={mode}>
      <style>{CSS}</style>
      <main>
        <header>
          <b>{meta.maker}</b>
          <span>
            <i aria-hidden="true" />
            OBJECT STUDY&nbsp;&nbsp;{meta.study}
          </span>
        </header>
        <figure>
          {render({ ref, onStateChange: setSnapshot, mode, stage: true, style: { width: '100%', height: 'clamp(360px, 65svh, 640px)' } })}
          <figcaption>
            <span className="name">Fig · {meta.name}</span>
            <div className="readout">
              <output aria-live="off">{snapshot.readout}</output>
              <span className="state">{snapshot.state}</span>
            </div>
            <span className="spec">{meta.spec}</span>
            <div className="keys" role="group" aria-label={`${meta.name} keys`}>
              {meta.keys.map((hint) => {
                const pressed = hint.toggle ? Boolean(snapshot.pressed[hint.keys[0]!]) : undefined
                // A hint whose caps are its keys gets a button per key; a range (1–6) prints as one cap.
                const each = hint.caps.length === hint.keys.length
                return (
                  <span className="hint" key={hint.label}>
                    {each ? (
                      hint.keys.map((key, i) => (
                        <button type="button" key={key} aria-pressed={pressed} aria-label={`${hint.caps[i] ?? capOf(key)}: ${hint.label}`} onClick={() => press(key)}>
                          <kbd>{hint.caps[i] ?? capOf(key)}</kbd>
                        </button>
                      ))
                    ) : (
                      <kbd>{hint.caps.join(' ')}</kbd>
                    )}
                    {hint.label}
                  </span>
                )
              })}
            </div>
          </figcaption>
        </figure>
      </main>
    </div>
  )
}
