import os from 'node:os'

/** Identifies the machine a result came from; baselines only compare within one. */
export function environment() {
  const cpu = os.cpus()[0]?.model.trim() ?? 'unknown'
  return `${os.platform()}-${os.arch()}-${cpu}`
}

const quantile = (sorted, q) => (sorted.length ? sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))] : null)
const r1 = (n) => (n == null ? null : Math.round(n * 10) / 10)

/** One run's raw recording → metrics. */
export function metrics(raw) {
  const deltas = raw.frames.slice(1).map((t, i) => t - raw.frames[i]).sort((a, b) => a - b)
  const span = raw.frames.length > 1 ? raw.frames.at(-1) - raw.frames[0] : 0
  const durations = raw.interactions.map((e) => e.duration)
  const timing = raw.eventTiming.map((e) => e.duration)
  return {
    fps: span ? r1(((raw.frames.length - 1) / span) * 1000) : 0,
    p50: r1(quantile(deltas, 0.5)),
    p95: r1(quantile(deltas, 0.95)),
    /** Frames over 50 ms: visible hitches. */
    hitches: deltas.filter((d) => d > 50).length,
    longTasks: raw.longTasks.length,
    /** Total blocking time: the part of every long task over 50 ms. */
    tbt: Math.round(raw.longTasks.reduce((sum, t) => sum + Math.max(0, t.duration - 50), 0)),
    /** Worst interaction to next paint: Chrome's Event Timing (what INP is computed from) when it
     *  saw one (it only reports >= 16 ms), else the recorder's rAF proxy. Theme switches use the proxy. */
    inp: timing.length ? r1(Math.max(...timing, ...durations)) : durations.length ? r1(Math.max(...durations)) : null,
    /** Canvas pixels shaded per second by WebGL draws, in megapixels: the GPU load CPU throttling can't show. */
    shadedMPps: span && raw.shaded ? r1(raw.shaded / 1e6 / (span / 1000)) : 0,
  }
}

const median = (values) => {
  const v = values.filter((x) => x != null).sort((a, b) => a - b)
  if (!v.length) return null
  return v.length % 2 ? v[v.length >> 1] : r1((v[v.length / 2 - 1] + v[v.length / 2]) / 2)
}

/** Median of every metric over the runs, plus the per-run metrics. */
export function summarize(raws) {
  if (!raws.length) return null
  const runs = raws.map(metrics)
  const out = {}
  for (const key of Object.keys(runs[0])) out[key] = median(runs.map((r) => r[key]))
  return { ...out, runs }
}
