/* The map's loops and transitions, as one stylesheet. */

export const CSS = `
.kh-map:not([data-shown]) :is(.kh-row, .kh-arc, .kh-node-mark) { opacity: 0; }
.kh-map[data-shown] .kh-row {
  animation: kh-print calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-enter) backwards;
  animation-delay: calc(var(--kh-i) * var(--yj-duration-instant) * 0.25 * var(--yj-motion, 1));
}
.kh-map[data-shown] .kh-node-mark {
  animation: kh-pop calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-enter) backwards;
  animation-delay: calc((var(--yj-duration-deliberate) + var(--kh-i) * var(--yj-duration-instant) * 0.6) * var(--yj-motion, 1));
}
.kh-map[data-shown] .kh-arc {
  transition: opacity calc(var(--yj-duration-base) * var(--yj-motion, 1)) var(--ease-standard);
  animation: kh-fade calc(var(--yj-duration-deliberate) * var(--yj-motion, 1)) var(--ease-standard) backwards;
  animation-delay: calc(var(--yj-duration-deliberate) * 1.6 * var(--yj-motion, 1));
}
.kh-map .kh-arc[data-dim] { opacity: 0.42; }
.kh-halo { transition: scale calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-standard), opacity calc(var(--yj-duration-base) * var(--yj-motion, 1)) var(--ease-standard); }
.kh-ping { animation: kh-ping calc(var(--yj-duration-deliberate) * 3) var(--ease-exit) infinite; }
.kh-map[data-paused] .kh-ping { animation-play-state: paused; }
[data-reduced-motion] .kh-ping { animation: none; scale: 1.9; opacity: 0.45; }
.kh-reticle { transition: translate calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-emphasized); }
@keyframes kh-print { from { opacity: 0; transform: translateY(-0.5px); } }
@keyframes kh-pop { from { opacity: 0; scale: 0.3; } }
@keyframes kh-fade { from { opacity: 0; } }
@keyframes kh-ping { from { scale: 1; opacity: 0.55; } to { scale: 3.4; opacity: 0; } }
`
