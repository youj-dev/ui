/* The chat kit's few CSS rules that utilities can't express: words that fade
 * in once when they mount (@starting-style), the caret's blink and the
 * "Thinking" shimmer. React hoists the <style> into <head> once, however many
 * components render it. Every duration is a youj token, so Speed reaches
 * them; `--yj-motion` zeroes the fades under reduced motion, and the loops
 * stop on [data-reduced-motion] and [data-paused] (offscreen). */

const CSS = `
.yj-chat-word {
  transition: opacity calc(var(--yj-duration-slow) * var(--yj-motion, 1)) var(--ease-enter);
}
@starting-style {
  .yj-chat-word { opacity: 0; }
}

.yj-chat-caret {
  animation-name: yj-chat-blink;
  animation-duration: calc(var(--yj-duration-deliberate) * 2);
  animation-timing-function: steps(1, end);
  animation-delay: var(--yj-duration-deliberate);
  animation-iteration-count: infinite;
}
[data-reduced-motion] .yj-chat-caret { animation: none; }
@keyframes yj-chat-blink { 50% { opacity: 0; } }

.yj-chat-shimmer { position: relative; display: inline-block; overflow: hidden; vertical-align: bottom; }
.yj-chat-shimmer__band {
  position: absolute;
  inset: 0;
  pointer-events: none;
  color: var(--color-fg);
  -webkit-mask-image: linear-gradient(90deg, transparent 15%, black 50%, transparent 85%);
  mask-image: linear-gradient(90deg, transparent 15%, black 50%, transparent 85%);
}
.yj-chat-shimmer__band, .yj-chat-shimmer__text {
  animation-duration: calc(var(--yj-duration-deliberate) * 3);
  animation-timing-function: var(--ease-standard);
  animation-iteration-count: infinite;
}
.yj-chat-shimmer__band { animation-name: yj-chat-sweep; }
.yj-chat-shimmer__text { display: block; white-space: nowrap; animation-name: yj-chat-sweep-back; }
.yj-chat-shimmer:dir(rtl) :is(.yj-chat-shimmer__band, .yj-chat-shimmer__text) { animation-direction: reverse; }
.yj-chat-shimmer[data-paused] :is(.yj-chat-shimmer__band, .yj-chat-shimmer__text) { animation-play-state: paused; }
[data-reduced-motion] .yj-chat-shimmer__band, [data-reduced-motion].yj-chat-shimmer .yj-chat-shimmer__band { display: none; }
@keyframes yj-chat-sweep { 0% { transform: translateX(-100%); } 70%, 100% { transform: translateX(100%); } }
@keyframes yj-chat-sweep-back { 0% { transform: translateX(100%); } 70%, 100% { transform: translateX(-100%); } }
`

export function ChatStyles() {
  return (
    <style href="youj-chat" precedence="youj">
      {CSS}
    </style>
  )
}
